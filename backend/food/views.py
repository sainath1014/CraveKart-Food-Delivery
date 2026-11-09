from rest_framework import status, permissions, parsers
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q, Sum, Count
from .models import Food
from .serializers import FoodSerializer
from common.permissions import IsAdminUserRole

class FoodListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        category = request.query_params.get('category')
        foods = Food.objects.filter(available=True)
        if category and category.lower() != 'all':
            # Handle 'Deserts' vs 'Desserts' tolerance
            if category.lower() in ('deserts', 'desserts'):
                foods = foods.filter(Q(category__iexact='Desserts') | Q(category__iexact='Deserts'))
            else:
                foods = foods.filter(category__iexact=category)

        serializer = FoodSerializer(foods, many=True, context={'request': request})
        return Response({
            'success': True,
            'count': foods.count(),
            'foods': serializer.data
        }, status=status.HTTP_200_OK)

class FoodDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            food = Food.objects.get(pk=pk)
        except Food.DoesNotExist:
            return Response({'success': False, 'message': 'Food item not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = FoodSerializer(food, context={'request': request})
        return Response({'success': True, 'food': serializer.data}, status=status.HTTP_200_OK)

class FoodSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({'success': True, 'foods': []}, status=status.HTTP_200_OK)

        foods = Food.objects.filter(
            available=True
        ).filter(
            Q(name__icontains=query) |
            Q(description__icontains=query) |
            Q(category__icontains=query)
        )
        serializer = FoodSerializer(foods, many=True, context={'request': request})
        return Response({
            'success': True,
            'query': query,
            'count': foods.count(),
            'foods': serializer.data
        }, status=status.HTTP_200_OK)

# Admin Food Management Views
class AdminFoodAddView(APIView):
    permission_classes = [IsAdminUserRole]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def post(self, request):
        data = request.data.copy()
        serializer = FoodSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            food = serializer.save()
            return Response({
                'success': True,
                'message': f"'{food.name}' added successfully to CraveKart menu!",
                'food': FoodSerializer(food, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'success': False,
            'message': 'Failed to add food item. Please check the inputs.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class AdminFoodUpdateView(APIView):
    permission_classes = [IsAdminUserRole]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def put(self, request, pk):
        try:
            food = Food.objects.get(pk=pk)
        except Food.DoesNotExist:
            return Response({'success': False, 'message': 'Food item not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = FoodSerializer(food, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            food = serializer.save()
            return Response({
                'success': True,
                'message': f"'{food.name}' updated successfully.",
                'food': FoodSerializer(food, context={'request': request}).data
            }, status=status.HTTP_200_OK)
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class AdminFoodDeleteView(APIView):
    permission_classes = [IsAdminUserRole]

    def delete(self, request, pk):
        try:
            food = Food.objects.get(pk=pk)
            food_name = food.name
            food.delete()
            return Response({
                'success': True,
                'message': f"'{food_name}' removed from CraveKart menu."
            }, status=status.HTTP_200_OK)
        except Food.DoesNotExist:
            return Response({'success': False, 'message': 'Food item not found.'}, status=status.HTTP_404_NOT_FOUND)

class AdminFoodListView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        foods = Food.objects.all().order_by('-created_at')
        serializer = FoodSerializer(foods, many=True, context={'request': request})
        return Response({
            'success': True,
            'count': foods.count(),
            'foods': serializer.data
        }, status=status.HTTP_200_OK)
