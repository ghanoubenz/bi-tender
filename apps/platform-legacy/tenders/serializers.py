from rest_framework import serializers

from tenders.models import Requirement, Tender, TenderDocument


class TenderDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderDocument
        fields = [
            "id",
            "filename",
            "content_type",
            "size",
            "ingestion_status",
            "ingestion_error",
            "engine_document_id",
            "created_at",
        ]
        read_only_fields = fields


class TenderSerializer(serializers.ModelSerializer):
    documents = TenderDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Tender
        fields = [
            "id",
            "reference",
            "title",
            "client_name",
            "country",
            "deadline",
            "status",
            "decision",
            "decision_reason",
            "decided_at",
            "ai_metadata",
            "requirements_status",
            "documents",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "requirements_status",
            "decision",
            "decision_reason",
            "decided_at",
            "ai_metadata",
            "documents",
            "created_at",
            "updated_at",
        ]


class DecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=Tender.Decision.choices)
    reason = serializers.CharField(allow_blank=False)


class RequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Requirement
        fields = [
            "id",
            "engine_requirement_id",
            "text",
            "category",
            "mandatory",
            "evidence",
            "confidence",
            "needs_review",
            "review_status",
            "reviewed_at",
            "note",
        ]
        read_only_fields = fields


class RequirementReviewSerializer(serializers.Serializer):
    review_status = serializers.ChoiceField(
        choices=[Requirement.ReviewStatus.ACCEPTED, Requirement.ReviewStatus.REJECTED]
    )
    note = serializers.CharField(allow_blank=True, required=False)
