from rest_framework import serializers
from .models import Order, OrderItem
from food.serializers import FoodSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id', 'food', 'food_name_snapshot', 'food_image_snapshot',
            'price_snapshot', 'quantity', 'item_total'
        ]

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    items_summary = serializers.ReadOnlyField()
    total_items_count = serializers.ReadOnlyField()
    full_address = serializers.ReadOnlyField()

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'first_name', 'last_name', 'email', 'phone',
            'street', 'city', 'state', 'zip_code', 'country', 'full_address',
            'subtotal', 'delivery_fee', 'discount', 'total_amount',
            'payment_method', 'payment_status', 'razorpay_order_id',
            'razorpay_payment_id', 'order_status', 'items', 'items_summary',
            'total_items_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'subtotal', 'delivery_fee', 'discount', 'total_amount',
            'payment_status', 'razorpay_order_id', 'razorpay_payment_id',
            'razorpay_signature', 'order_status', 'created_at', 'updated_at'
        ]
