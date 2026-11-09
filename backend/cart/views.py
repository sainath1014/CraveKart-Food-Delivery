from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Cart, CartItem
from food.models import Food
from .serializers import CartSerializer

def get_or_create_cart(request):
    """
    Retrieves or initializes a cart for either an authenticated user or a guest session.
    """
    session_key = request.headers.get('X-Session-Key') or request.query_params.get('session_key')

    if request.user and request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
        # If guest session_key was provided and has items, merge them into user cart
        if session_key:
            try:
                guest_cart = Cart.objects.get(session_key=session_key, user__isnull=True)
                for g_item in guest_cart.items.all():
                    item, created = CartItem.objects.get_or_create(cart=cart, food=g_item.food)
                    if not created:
                        item.quantity += g_item.quantity
                    else:
                        item.quantity = g_item.quantity
                    item.save()
                guest_cart.delete()
            except Cart.DoesNotExist:
                pass
        return cart

    # Guest user
    if not session_key:
        session_key = request.session.session_key
        if not session_key:
            request.session.save()
            session_key = request.session.session_key

    cart, _ = Cart.objects.get_or_create(session_key=session_key, user__isnull=True)
    return cart

class CartView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cart = get_or_create_cart(request)
        serializer = CartSerializer(cart, context={'request': request})
        return Response({
            'success': True,
            'cart': serializer.data
        }, status=status.HTTP_200_OK)

class CartAddView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        food_id = request.data.get('food_id')
        quantity = int(request.data.get('quantity', 1))

        if not food_id:
            return Response({'success': False, 'message': 'food_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            food = Food.objects.get(id=food_id, available=True)
        except Food.DoesNotExist:
            return Response({'success': False, 'message': 'Food item not found or unavailable.'}, status=status.HTTP_404_NOT_FOUND)

        cart = get_or_create_cart(request)
        cart_item, created = CartItem.objects.get_or_create(cart=cart, food=food)

        if not created:
            cart_item.quantity += quantity
        else:
            cart_item.quantity = max(1, quantity)
        cart_item.save()

        serializer = CartSerializer(cart, context={'request': request})
        return Response({
            'success': True,
            'message': f"Added '{food.name}' to cart.",
            'cart': serializer.data
        }, status=status.HTTP_200_OK)

class CartUpdateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        food_id = request.data.get('food_id')
        quantity = int(request.data.get('quantity', 0))

        if not food_id:
            return Response({'success': False, 'message': 'food_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        cart = get_or_create_cart(request)

        try:
            item = CartItem.objects.get(cart=cart, food_id=food_id)
            if quantity <= 0:
                item.delete()
                message = f"Removed '{item.food.name}' from cart."
            else:
                item.quantity = quantity
                item.save()
                message = f"Updated quantity for '{item.food.name}' to {quantity}."
        except CartItem.DoesNotExist:
            if quantity > 0:
                try:
                    food = Food.objects.get(id=food_id, available=True)
                    CartItem.objects.create(cart=cart, food=food, quantity=quantity)
                    message = f"Added '{food.name}' to cart."
                except Food.DoesNotExist:
                    return Response({'success': False, 'message': 'Food item not found.'}, status=status.HTTP_404_NOT_FOUND)
            else:
                message = "Item not in cart."

        serializer = CartSerializer(cart, context={'request': request})
        return Response({
            'success': True,
            'message': message,
            'cart': serializer.data
        }, status=status.HTTP_200_OK)

class CartRemoveView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        food_id = request.data.get('food_id')
        if not food_id:
            return Response({'success': False, 'message': 'food_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        cart = get_or_create_cart(request)
        try:
            item = CartItem.objects.get(cart=cart, food_id=food_id)
            item_name = item.food.name
            item.delete()
            message = f"Removed '{item_name}' from cart."
        except CartItem.DoesNotExist:
            message = "Item was not in cart."

        serializer = CartSerializer(cart, context={'request': request})
        return Response({
            'success': True,
            'message': message,
            'cart': serializer.data
        }, status=status.HTTP_200_OK)

class CartClearView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        cart = get_or_create_cart(request)
        cart.items.all().delete()
        serializer = CartSerializer(cart, context={'request': request})
        return Response({
            'success': True,
            'message': 'Cart cleared successfully.',
            'cart': serializer.data
        }, status=status.HTTP_200_OK)
