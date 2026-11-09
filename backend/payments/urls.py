from django.urls import path
from .views import CreatePaymentOrderView, RazorpayWebhookView
from orders.views import VerifyPaymentView

urlpatterns = [
    path('payment/create-order/', CreatePaymentOrderView.as_view(), name='payment-create-order'),
    path('payment/verify/', VerifyPaymentView.as_view(), name='payment-verify'),
    path('payment/webhook/', RazorpayWebhookView.as_view(), name='payment-webhook'),
]
