from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from tenders.engine_client import EngineClient
from tenders.models import Requirement, Tender, TenderDocument
from tenders.serializers import (
    DecisionSerializer,
    RequirementReviewSerializer,
    RequirementSerializer,
    TenderDocumentSerializer,
    TenderSerializer,
)


class TenderViewSet(viewsets.ModelViewSet):
    serializer_class = TenderSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        # Tenant scoping on every query — never trust ids alone.
        return Tender.objects.filter(tenant=self.request.user.tenant).prefetch_related("documents")

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant, created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="documents")
    def upload_document(self, request, pk=None):
        """Upload a tender document and send it to the AI Engine for ingestion."""
        tender = self.get_object()
        upload = request.FILES.get("file")
        if upload is None:
            return Response(
                {"code": "missing_file", "message": "multipart field 'file' is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        doc = TenderDocument.objects.create(
            tenant=tender.tenant,
            tender=tender,
            file=upload,
            filename=upload.name,
            content_type=upload.content_type or "",
            size=upload.size,
            uploaded_by=request.user,
        )
        try:
            doc.file.open("rb")
            content = doc.file.read()
            job = EngineClient().ingest(
                tenant_id=str(tender.tenant_id),
                filename=doc.filename,
                content=content,
                content_type=doc.content_type or None,
                external_ref=str(doc.id),
                tender_ref=str(tender.id),
            )
            doc.engine_job_id = job.id
            doc.ingestion_status = TenderDocument.IngestionStatus.PROCESSING
            doc.save(update_fields=["engine_job_id", "ingestion_status"])
            # A new document invalidates the previous requirement extraction.
            tender.requirements_status = "pending"
            tender.requirements_job_id = ""
            if tender.status == Tender.Status.DRAFT:
                tender.status = Tender.Status.PROCESSING
            tender.save(update_fields=["status", "requirements_status", "requirements_job_id"])
        except Exception as exc:  # engine down → document kept, marked failed, retryable
            doc.ingestion_status = TenderDocument.IngestionStatus.FAILED
            doc.ingestion_error = f"engine ingest failed: {exc}"
            doc.save(update_fields=["ingestion_status", "ingestion_error"])
        return Response(TenderDocumentSerializer(doc).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="refresh")
    def refresh(self, request, pk=None):
        """Advance this tender's AI pipeline: sync ingestion, then requirements.

        Polling is deliberate for V1 — the engine owns job state, the platform
        just mirrors it. Webhooks replace this without changing the contracts.
        """
        tender = self.get_object()
        client = EngineClient()
        self._sync_ingestion(tender, client)
        self._sync_requirements(tender, client)
        return Response(TenderSerializer(self.get_queryset().get(pk=tender.pk)).data)

    def _sync_ingestion(self, tender: Tender, client: EngineClient) -> None:
        for doc in tender.documents.filter(
            ingestion_status=TenderDocument.IngestionStatus.PROCESSING
        ):
            try:
                job = client.get_job(tenant_id=str(tender.tenant_id), job_id=doc.engine_job_id)
            except Exception:
                continue
            if job.state.value == "succeeded" and job.result:
                doc.ingestion_status = TenderDocument.IngestionStatus.INGESTED
                doc.engine_document_id = job.result.get("document_id", "")
                doc.save(update_fields=["ingestion_status", "engine_document_id"])
                metadata = job.result.get("metadata")
                if metadata:
                    tender.ai_metadata = metadata
                    if tender.status == Tender.Status.PROCESSING:
                        tender.status = Tender.Status.UNDER_REVIEW
                    tender.save(update_fields=["ai_metadata", "status"])
            elif job.state.value == "failed":
                doc.ingestion_status = TenderDocument.IngestionStatus.FAILED
                doc.ingestion_error = job.error or "unknown engine error"
                doc.save(update_fields=["ingestion_status", "ingestion_error"])

    def _sync_requirements(self, tender: Tender, client: EngineClient) -> None:
        # Query documents directly: tender.documents.all() would serve the
        # prefetch cache captured before _sync_ingestion updated statuses.
        documents = list(TenderDocument.objects.filter(tender=tender))
        ingested = [d for d in documents if d.ingestion_status == TenderDocument.IngestionStatus.INGESTED]
        still_processing = any(
            d.ingestion_status == TenderDocument.IngestionStatus.PROCESSING for d in documents
        )
        if not ingested or still_processing:
            return

        if tender.requirements_status == "pending":
            try:
                job = client.extract_requirements(
                    tenant_id=str(tender.tenant_id), tender_ref=str(tender.id)
                )
            except Exception:
                return
            tender.requirements_job_id = job.id
            tender.requirements_status = "processing"
            tender.save(update_fields=["requirements_job_id", "requirements_status"])
            return

        if tender.requirements_status == "processing" and tender.requirements_job_id:
            try:
                job = client.get_job(
                    tenant_id=str(tender.tenant_id), job_id=tender.requirements_job_id
                )
            except Exception:
                return
            if job.state.value == "succeeded" and job.result:
                self._store_requirements(tender, job.result.get("requirements", []))
                tender.requirements_status = "ready"
                tender.save(update_fields=["requirements_status"])
            elif job.state.value == "failed":
                tender.requirements_status = "failed"
                tender.save(update_fields=["requirements_status"])

    @staticmethod
    @transaction.atomic
    def _store_requirements(tender: Tender, payloads: list[dict]) -> None:
        """Mirror engine requirements, preserving human review state on re-extraction."""
        prior = {r.text: r for r in tender.requirements.all()}
        tender.requirements.all().delete()
        for payload in payloads:
            previous = prior.get(payload["text"])
            Requirement.objects.create(
                tenant=tender.tenant,
                tender=tender,
                engine_requirement_id=payload["id"],
                text=payload["text"],
                category=payload["category"],
                mandatory=payload.get("mandatory"),
                evidence=payload.get("evidence", []),
                confidence=payload.get("confidence", 0.0),
                needs_review=payload.get("needs_review", False),
                review_status=previous.review_status if previous else Requirement.ReviewStatus.PENDING,
                reviewed_by=previous.reviewed_by if previous else None,
                reviewed_at=previous.reviewed_at if previous else None,
                note=previous.note if previous else "",
            )

    @action(detail=True, methods=["get"], url_path="requirements")
    def requirements(self, request, pk=None):
        """Requirement list for the compliance/review UI, with filters."""
        tender = self.get_object()
        queryset = tender.requirements.all()
        category = request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)
        needs_review = request.query_params.get("needs_review")
        if needs_review is not None:
            queryset = queryset.filter(needs_review=needs_review.lower() == "true")
        review_status = request.query_params.get("review_status")
        if review_status:
            queryset = queryset.filter(review_status=review_status)
        return Response(RequirementSerializer(queryset, many=True).data)

    @action(detail=True, methods=["post"], url_path="decision")
    def decide(self, request, pk=None):
        """Record the human Bid/No-Bid/Hold decision (PRODUCT_CONTRACT rule 5)."""
        tender = self.get_object()
        ser = DecisionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        tender.decision = ser.validated_data["decision"]
        tender.decision_reason = ser.validated_data["reason"]
        tender.decided_by = request.user
        tender.decided_at = timezone.now()
        tender.status = Tender.Status.DECIDED
        tender.save()
        return Response(TenderSerializer(tender).data)


class RequirementViewSet(viewsets.GenericViewSet):
    """Human review of extracted requirements. The extracted fact and its
    evidence are immutable here — only workflow state changes."""

    serializer_class = RequirementSerializer

    def get_queryset(self):
        return Requirement.objects.filter(tenant=self.request.user.tenant)

    def retrieve(self, request, pk=None):
        requirement = self.get_queryset().filter(pk=pk).first()
        if requirement is None:
            return Response(
                {"code": "not_found", "message": "requirement not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(RequirementSerializer(requirement).data)

    @action(detail=True, methods=["post"], url_path="review")
    def review(self, request, pk=None):
        requirement = self.get_queryset().filter(pk=pk).first()
        if requirement is None:
            return Response(
                {"code": "not_found", "message": "requirement not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        ser = RequirementReviewSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        requirement.review_status = ser.validated_data["review_status"]
        requirement.note = ser.validated_data.get("note", "")
        requirement.reviewed_by = request.user
        requirement.reviewed_at = timezone.now()
        requirement.needs_review = False
        requirement.save()
        return Response(RequirementSerializer(requirement).data)


class DocumentBlocksView(viewsets.ViewSet):
    """Proxy parsed blocks from the engine for the evidence viewer."""

    def retrieve(self, request, pk=None):
        doc = TenderDocument.objects.filter(pk=pk, tenant=request.user.tenant).first()
        if doc is None or not doc.engine_document_id:
            return Response(
                {"code": "not_found", "message": "document not found or not ingested"},
                status=status.HTTP_404_NOT_FOUND,
            )
        blocks = EngineClient().get_blocks(
            tenant_id=str(doc.tenant_id), document_id=doc.engine_document_id
        )
        return Response(blocks)
