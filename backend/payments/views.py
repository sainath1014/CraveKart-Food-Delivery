import json
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from orders.models import Order
from orders.views import VerifyPaymentView
from .services import create_razorpay_order, verify_razorpay_signature

class CreatePaymentOrderView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        order_id = request.data.get('order_id')
        if not order_id:
            return Response({'success': False, 'message': 'order_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({'success': False, 'message': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        rzp_order = create_razorpay_order(
            amount_in_inr=order.total_amount,
            receipt_id=f"crave_{order.id}",
            notes={'order_id': order.id, 'customer_email': order.email}
        )
        order.razorpay_order_id = rzp_order['id']
        order.save(update_fields=['razorpay_order_id'])

        return Response({
            'success': True,
            'razorpay': {
                'order_id': rzp_order['id'],
                'amount': rzp_order['amount'],
                'currency': rzp_order['currency'],
                'key_id': rzp_order['key_id'],
                'is_simulation': rzp_order.get('is_simulation', False)
            }
        }, status=status.HTTP_200_OK)

class RazorpayWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        webhook_signature = request.headers.get('X-Razorpay-Signature')
        webhook_secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', '')

        # Process webhook payload
        try:
            payload = json.loads(request.body)
            event = payload.get('event')

            if event == 'payment.captured':
                payment_entity = payload.get('payload', {}).get('payment', {}).get('entity', {})
                razorpay_order_id = payment_entity.get('order_id')
                razorpay_payment_id = payment_entity.get('id')

                if razorpay_order_id:
                    try:
                        order = Order.objects.get(razorpay_order_id=razorpay_order_id)
                        order.payment_status = 'Paid'
                        order.razorpay_payment_id = razorpay_payment_id
                        order.save(update_fields=['payment_status', 'razorpay_payment_id'])
                    except Order.DoesNotExist:
                        pass

            return Response({'status': 'webhook received'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
