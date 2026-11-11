import logging
from rest_framework import status, permissions, parsers
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from django.db import DatabaseError
from django.db.models import Q
from .models import Food
from .serializers import FoodSerializer
from common.permissions import IsAdminUserRole
from common.db_bootstrap import ensure_sqlite_ready

logger = logging.getLogger(__name__)


class FoodListView(APIView):
    permission_classes = [permissions.AllowAny]

    def _query_foods(self, request):
        category = request.query_params.get('category')
        foods = Food.objects.filter(available=True)
        if category and category.lower() != 'all':
            # Handle 'Deserts' vs 'Desserts' tolerance
            if category.lower() in ('deserts', 'desserts'):
                foods = foods.filter(Q(category__iexact='Desserts') | Q(category__iexact='Deserts'))
            else:
                foods = foods.filter(category__iexact=category)

        serializer = FoodSerializer(foods, many=True, context={'request': request})
        return serializer.data

    def get(self, request):
        try:
            try:
                food_data = self._query_foods(request)
            except DatabaseError:
                ensure_sqlite_ready()
                food_data = self._query_foods(request)

            return Response({
                'success': True,
                'count': len(food_data),
                'foods': food_data
            }, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Error in FoodListView: %s", exc)
            return Response({
                'success': False,
                'message': 'Failed to load food items.',
                'error': str(exc) if settings.DEBUG else 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FoodDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            food = Food.objects.get(pk=pk)
        except Food.DoesNotExist:
            return Response({'success': False, 'message': 'Food item not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            logger.exception("Error in FoodDetailView: %s", exc)
            return Response({
                'success': False,
                'message': 'Failed to load food item details.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = FoodSerializer(food, context={'request': request})
        return Response({'success': True, 'food': serializer.data}, status=status.HTTP_200_OK)


class FoodSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
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
            food_data = serializer.data
            return Response({
                'success': True,
                'query': query,
                'count': len(food_data),
                'foods': food_data
            }, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Error in FoodSearchView: %s", exc)
            return Response({
                'success': False,
                'message': 'Failed to search food items.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        try:
            foods = Food.objects.all().order_by('-created_at')
            serializer = FoodSerializer(foods, many=True, context={'request': request})
            food_data = serializer.data
            return Response({
                'success': True,
                'count': len(food_data),
                'foods': food_data
            }, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Error in AdminFoodListView: %s", exc)
            return Response({
                'success': False,
                'message': 'Failed to load admin food list.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
