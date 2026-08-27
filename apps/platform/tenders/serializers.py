from rest_framework import serializers

from tenders.models import Tender, TenderDocument


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
            "documents",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
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
