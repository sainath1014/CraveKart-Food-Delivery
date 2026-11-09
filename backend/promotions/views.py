from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from decimal import Decimal
from .models import PromoCode

class ValidatePromoView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code_str = request.data.get('code', '').strip().upper()
        subtotal = request.data.get('subtotal', 0)

        if not code_str:
            return Response({'success': False, 'message': 'Please enter a promo code.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            promo = PromoCode.objects.get(code__iexact=code_str)
        except PromoCode.DoesNotExist:
            return Response({'success': False, 'message': f"Invalid coupon code '{code_str}'."}, status=status.HTTP_404_NOT_FOUND)

        try:
            subtotal_dec = Decimal(str(subtotal))
        except Exception:
            subtotal_dec = Decimal('0.00')

        is_valid, reason = promo.is_valid_for_amount(subtotal_dec)
        if not is_valid:
            return Response({'success': False, 'message': reason}, status=status.HTTP_400_BAD_REQUEST)

        discount = promo.calculate_discount(subtotal_dec)
        return Response({
            'success': True,
            'message': f"Promo code '{promo.code}' applied successfully!",
            'promo': {
                'id': promo.id,
                'code': promo.code,
                'discount_type': promo.discount_type,
                'discount_value': str(promo.discount_value),
                'discount_amount': str(discount)
            }
        }, status=status.HTTP_200_OK)
