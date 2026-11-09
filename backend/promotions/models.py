from django.db import models
from django.utils import timezone
from decimal import Decimal

class PromoCode(models.Model):
    DISCOUNT_TYPES = [
        ('percentage', 'Percentage'),
        ('flat', 'Flat Amount'),
    ]

    code = models.CharField(max_length=30, unique=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES, default='percentage')
    discount_value = models.DecimalField(max_digits=8, decimal_places=2)
    minimum_order_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    expiry_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} ({self.discount_value}{'%' if self.discount_type == 'percentage' else ' INR'})"

    def is_valid_for_amount(self, subtotal):
        if not self.is_active:
            return False, "This promo code is currently inactive."
        if self.expiry_date and self.expiry_date < timezone.now().date():
            return False, "This promo code has expired."
        if Decimal(str(subtotal)) < self.minimum_order_amount:
            return False, f"Minimum order amount of ₹{self.minimum_order_amount} required for this coupon."
        return True, "Valid promo code."

    def calculate_discount(self, subtotal):
        subtotal_dec = Decimal(str(subtotal))
        valid, msg = self.is_valid_for_amount(subtotal_dec)
        if not valid:
            return Decimal('0.00')

        if self.discount_type == 'percentage':
            discount = (subtotal_dec * self.discount_value) / Decimal('100.00')
        else:
            discount = min(self.discount_value, subtotal_dec)
        return round(discount, 2)
