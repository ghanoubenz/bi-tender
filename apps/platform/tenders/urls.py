from rest_framework.routers import DefaultRouter

from tenders.views import DocumentBlocksView, RequirementViewSet, TenderViewSet

router = DefaultRouter()
router.register("tenders", TenderViewSet, basename="tender")
router.register("requirements", RequirementViewSet, basename="requirement")
router.register("documents/blocks", DocumentBlocksView, basename="document-blocks")

urlpatterns = router.urls
