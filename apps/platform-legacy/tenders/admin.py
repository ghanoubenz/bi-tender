from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin

from tenders.models import Requirement, Tender, TenderDocument

admin.site.register(Tender, SimpleHistoryAdmin)
admin.site.register(TenderDocument, SimpleHistoryAdmin)
admin.site.register(Requirement, SimpleHistoryAdmin)
