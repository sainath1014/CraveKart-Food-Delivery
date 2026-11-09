from rest_framework import serializers
from .models import PromoCode

class PromoCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = ['id', 'code', 'discount_type', 'discount_value', 'minimum_order_amount', 'expiry_date', 'is_active']
