import uuid

from django.db import models
from simple_history.models import HistoricalRecords

from core.models import TenantOwnedModel


def document_upload_path(instance, filename: str) -> str:
    # Tenant-prefixed keys: isolation is visible in the storage layout itself.
    return f"tenants/{instance.tenant_id}/tenders/{instance.tender_id}/{filename}"


class Tender(TenantOwnedModel):
    class Status(models.TextChoices):
        DRAFT = "draft"
        PROCESSING = "processing"
        UNDER_REVIEW = "under_review"
        DECIDED = "decided"
        SUBMITTED = "submitted"
        CLOSED = "closed"

    class Decision(models.TextChoices):
        BID = "bid"
        NO_BID = "no_bid"
        HOLD = "hold"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=128, blank=True)
    title = models.CharField(max_length=512)
    client_name = models.CharField(max_length=255, blank=True)
    country = models.CharField(max_length=128, blank=True)
    deadline = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.DRAFT)
    # PRODUCT_CONTRACT rule 5: the decision is human-made and audited.
    decision = models.CharField(max_length=16, choices=Decision.choices, blank=True)
    decision_reason = models.TextField(blank=True)
    decided_by = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    decided_at = models.DateTimeField(null=True, blank=True)
    # Engine-extracted TenderMetadata contract payload (evidence included).
    ai_metadata = models.JSONField(null=True, blank=True)
    # Requirement extraction job tracking (engine-side job id).
    requirements_job_id = models.CharField(max_length=64, blank=True)
    requirements_status = models.CharField(max_length=16, default="pending")
    created_by = models.ForeignKey(
        "core.User", null=True, on_delete=models.SET_NULL, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    history = HistoricalRecords()

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class TenderDocument(TenantOwnedModel):
    class IngestionStatus(models.TextChoices):
        PENDING = "pending"
        PROCESSING = "processing"
        INGESTED = "ingested"
        FAILED = "failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tender = models.ForeignKey(Tender, on_delete=models.CASCADE, related_name="documents")
    # Tenant-prefixed keys are long (two UUIDs + filename); the FileField
    # default of max_length=100 truncates and breaks uploads.
    file = models.FileField(upload_to=document_upload_path, max_length=1024)
    filename = models.CharField(max_length=512)
    content_type = models.CharField(max_length=128, blank=True)
    size = models.BigIntegerField(default=0)
    ingestion_status = models.CharField(
        max_length=16, choices=IngestionStatus.choices, default=IngestionStatus.PENDING
    )
    engine_job_id = models.CharField(max_length=64, blank=True)
    engine_document_id = models.CharField(max_length=64, blank=True)
    ingestion_error = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(
        "core.User", null=True, on_delete=models.SET_NULL, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    history = HistoricalRecords()

    class Meta:
        ordering = ["created_at"]


class Requirement(TenantOwnedModel):
    """Platform mirror of an engine-extracted requirement.

    The AI Engine remains the system of record for the extracted *fact* and its
    evidence; the platform owns the *workflow state* laid on top (review,
    ownership, notes) and, from Phase 3, compliance against capabilities.
    """

    class ReviewStatus(models.TextChoices):
        PENDING = "pending"
        ACCEPTED = "accepted"
        REJECTED = "rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tender = models.ForeignKey(Tender, on_delete=models.CASCADE, related_name="requirements")
    engine_requirement_id = models.CharField(max_length=64, db_index=True)
    text = models.TextField()
    category = models.CharField(max_length=32)
    mandatory = models.BooleanField(null=True)
    # ExtractedRequirement.evidence contract payload — never rewritten by the platform.
    evidence = models.JSONField(default=list)
    confidence = models.FloatField(default=0.0)
    needs_review = models.BooleanField(default=False)
    review_status = models.CharField(
        max_length=16, choices=ReviewStatus.choices, default=ReviewStatus.PENDING
    )
    reviewed_by = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    history = HistoricalRecords()

    class Meta:
        ordering = ["category", "created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["tender", "engine_requirement_id"], name="unique_requirement_per_tender"
            )
        ]
