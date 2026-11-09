from decimal import Decimal
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum, Count
from .models import Order, OrderItem
from .serializers import OrderSerializer
from cart.views import get_or_create_cart
from promotions.models import PromoCode
from payments.services import create_razorpay_order, verify_razorpay_signature
from common.permissions import IsAdminUserRole
from accounts.models import User
from food.models import Food

DELIVERY_FEE = Decimal('40.00')

class CreateOrderView(APIView):
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        user = request.user if (request.user and request.user.is_authenticated) else None
        cart = get_or_create_cart(request)

        cart_items = cart.items.select_related('food').all()
        if not cart_items.exists():
            return Response({
                'success': False,
                'message': 'Your cart is empty. Please add items before checking out.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Extract address details
        data = request.data
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        street = data.get('street', '').strip()
        city = data.get('city', '').strip()
        state = data.get('state', '').strip()
        zip_code = data.get('zip_code', '').strip()
        country = data.get('country', 'India').strip()

        if not all([first_name, email, phone, street, city, state, zip_code]):
            return Response({
                'success': False,
                'message': 'All delivery address fields are required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 1. Calculate subtotal strictly from backend database food prices
        subtotal = Decimal('0.00')
        for item in cart_items:
            # Check availability
            if not item.food.available:
                return Response({
                    'success': False,
                    'message': f"'{item.food.name}' is currently unavailable. Please remove it from your cart."
                }, status=status.HTTP_400_BAD_REQUEST)
            subtotal += item.food.price * item.quantity

        # 2. Check and calculate promo code discount
        discount = Decimal('0.00')
        applied_promo = None
        promo_code_str = data.get('promo_code', '').strip().upper()
        if promo_code_str:
            try:
                promo = PromoCode.objects.get(code__iexact=promo_code_str)
                is_valid, _ = promo.is_valid_for_amount(subtotal)
                if is_valid:
                    discount = promo.calculate_discount(subtotal)
                    applied_promo = promo
            except PromoCode.DoesNotExist:
                pass

        delivery_fee = DELIVERY_FEE
        total_amount = max(Decimal('0.00'), subtotal + delivery_fee - discount)

        # 3. Create Order
        order = Order.objects.create(
            user=user,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            street=street,
            city=city,
            state=state,
            zip_code=zip_code,
            country=country,
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            discount=discount,
            total_amount=total_amount,
            promo_code=applied_promo,
            payment_status='Pending',
            order_status='Food Processing'
        )

        # 4. Create OrderItems with snapshot
        for item in cart_items:
            img_url = item.food.display_image
            OrderItem.objects.create(
                order=order,
                food=item.food,
                food_name_snapshot=item.food.name,
                food_image_snapshot=img_url or '',
                price_snapshot=item.food.price,
                quantity=item.quantity,
                item_total=item.food.price * item.quantity
            )

        # 5. Create Razorpay order
        rzp_order = create_razorpay_order(
            amount_in_inr=total_amount,
            receipt_id=f"crave_{order.id}",
            notes={'order_id': order.id, 'customer_email': email}
        )
        order.razorpay_order_id = rzp_order['id']
        order.save(update_fields=['razorpay_order_id'])

        return Response({
            'success': True,
            'message': 'Order initialized successfully. Proceeding to Razorpay checkout.',
            'order_id': order.id,
            'razorpay': {
                'order_id': rzp_order['id'],
                'amount': rzp_order['amount'],
                'currency': rzp_order['currency'],
                'key_id': rzp_order['key_id'],
                'is_simulation': rzp_order.get('is_simulation', False)
            },
            'order_summary': {
                'id': order.id,
                'subtotal': str(subtotal),
                'delivery_fee': str(delivery_fee),
                'discount': str(discount),
                'total_amount': str(total_amount),
            }
        }, status=status.HTTP_201_CREATED)

class VerifyPaymentView(APIView):
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        order_id = request.data.get('order_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')

        if not order_id or not razorpay_payment_id:
            return Response({
                'success': False,
                'message': 'Missing payment verification details.'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Order not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        # Verify signature
        is_valid = verify_razorpay_signature(
            razorpay_order_id=razorpay_order_id or order.razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            razorpay_signature=razorpay_signature or ''
        )

        if not is_valid:
            order.payment_status = 'Failed'
            order.save(update_fields=['payment_status'])
            return Response({
                'success': False,
                'message': 'Payment verification failed. Invalid signature.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Mark paid
        order.payment_status = 'Paid'
        order.razorpay_payment_id = razorpay_payment_id
        if razorpay_signature:
            order.razorpay_signature = razorpay_signature
        order.save(update_fields=['payment_status', 'razorpay_payment_id', 'razorpay_signature'])

        # Clear cart
        cart = get_or_create_cart(request)
        cart.items.all().delete()

        return Response({
            'success': True,
            'message': 'Payment successful and verified! Your food order has been placed.',
            'order': OrderSerializer(order, context={'request': request}).data
        }, status=status.HTTP_200_OK)

class UserOrdersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True, context={'request': request})
        return Response({
            'success': True,
            'count': orders.count(),
            'orders': serializer.data
        }, status=status.HTTP_200_OK)

class OrderDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'success': False, 'message': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Security check: if user is logged in and not admin, can only view own order
        if request.user and request.user.is_authenticated:
            if not (request.user.is_staff or request.user.is_superuser) and order.user != request.user:
                return Response({'success': False, 'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = OrderSerializer(order, context={'request': request})
        return Response({'success': True, 'order': serializer.data}, status=status.HTTP_200_OK)

# Admin Order Management Views
class AdminOrdersListView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        orders = Order.objects.all().order_by('-created_at')
        serializer = OrderSerializer(orders, many=True, context={'request': request})
        return Response({
            'success': True,
            'count': orders.count(),
            'orders': serializer.data
        }, status=status.HTTP_200_OK)

class AdminOrderStatusUpdateView(APIView):
    permission_classes = [IsAdminUserRole]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'success': False, 'message': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('order_status')
        new_payment_status = request.data.get('payment_status')

        valid_statuses = [choice[0] for choice in Order.STATUS_CHOICES]
        if new_status:
            if new_status not in valid_statuses:
                return Response({
                    'success': False,
                    'message': f"Invalid status. Choose from: {', '.join(valid_statuses)}"
                }, status=status.HTTP_400_BAD_REQUEST)
            order.order_status = new_status

        if new_payment_status:
            if new_payment_status in ['Pending', 'Paid', 'Failed']:
                order.payment_status = new_payment_status

        order.save()
        serializer = OrderSerializer(order, context={'request': request})
        return Response({
            'success': True,
            'message': f"Order #{order.id} status updated to '{order.order_status}'.",
            'order': serializer.data
        }, status=status.HTTP_200_OK)

class AdminDashboardStatsView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        total_orders = Order.objects.count()
        paid_orders = Order.objects.filter(payment_status='Paid')
        total_revenue = paid_orders.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        processing_orders = Order.objects.filter(order_status='Food Processing').count()
        delivered_orders = Order.objects.filter(order_status='Delivered').count()
        total_food_items = Food.objects.count()
        total_customers = User.objects.filter(is_staff=False).count()

        recent_orders = Order.objects.all().order_by('-created_at')[:5]
        recent_orders_data = OrderSerializer(recent_orders, many=True, context={'request': request}).data

        return Response({
            'success': True,
            'stats': {
                'total_revenue': str(total_revenue),
                'total_orders': total_orders,
                'processing_orders': processing_orders,
                'delivered_orders': delivered_orders,
                'total_food_items': total_food_items,
                'total_customers': total_customers,
            },
            'recent_orders': recent_orders_data
        }, status=status.HTTP_200_OK)
