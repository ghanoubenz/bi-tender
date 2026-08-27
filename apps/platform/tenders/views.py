from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from tenders.engine_client import EngineClient
from tenders.models import Tender, TenderDocument
from tenders.serializers import DecisionSerializer, TenderDocumentSerializer, TenderSerializer


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
            if tender.status == Tender.Status.DRAFT:
                tender.status = Tender.Status.PROCESSING
                tender.save(update_fields=["status"])
        except Exception as exc:  # engine down → document kept, marked failed, retryable
            doc.ingestion_status = TenderDocument.IngestionStatus.FAILED
            doc.ingestion_error = f"engine ingest failed: {exc}"
            doc.save(update_fields=["ingestion_status", "ingestion_error"])
        return Response(TenderDocumentSerializer(doc).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="refresh")
    def refresh(self, request, pk=None):
        """Poll engine jobs for this tender's documents and sync results."""
        tender = self.get_object()
        client = EngineClient()
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
        return Response(TenderSerializer(Tender.objects.get(pk=tender.pk)).data)

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


class DocumentBlocksView(viewsets.ViewSet):
    """Proxy parsed blocks from the engine for the evidence viewer."""

    def retrieve(self, request, pk=None):
        doc = TenderDocument.objects.filter(
            pk=pk, tenant=request.user.tenant
        ).first()
        if doc is None or not doc.engine_document_id:
            return Response(
                {"code": "not_found", "message": "document not found or not ingested"},
                status=status.HTTP_404_NOT_FOUND,
            )
        blocks = EngineClient().get_blocks(
            tenant_id=str(doc.tenant_id), document_id=doc.engine_document_id
        )
        return Response(blocks)
