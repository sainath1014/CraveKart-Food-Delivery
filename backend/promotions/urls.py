from django.urls import path
from .views import ValidatePromoView

urlpatterns = [
    path('promo/validate/', ValidatePromoView.as_view(), name='promo-validate'),
]
