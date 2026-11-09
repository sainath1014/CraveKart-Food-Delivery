from django.urls import path
from .views import (
    FoodListView,
    FoodDetailView,
    FoodSearchView,
    AdminFoodListView,
    AdminFoodAddView,
    AdminFoodUpdateView,
    AdminFoodDeleteView
)

urlpatterns = [
    path('food/list/', FoodListView.as_view(), name='food-list'),
    path('food/detail/<int:pk>/', FoodDetailView.as_view(), name='food-detail'),
    path('food/search/', FoodSearchView.as_view(), name='food-search'),

    # Admin endpoints
    path('admin/food/list/', AdminFoodListView.as_view(), name='admin-food-list'),
    path('admin/food/add/', AdminFoodAddView.as_view(), name='admin-food-add'),
    path('admin/food/update/<int:pk>/', AdminFoodUpdateView.as_view(), name='admin-food-update'),
    path('admin/food/delete/<int:pk>/', AdminFoodDeleteView.as_view(), name='admin-food-delete'),
]
