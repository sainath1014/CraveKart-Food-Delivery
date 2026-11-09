from django.urls import path
from .views import (
    CreateOrderView,
    UserOrdersView,
    OrderDetailView,
    AdminOrdersListView,
    AdminOrderStatusUpdateView,
    AdminDashboardStatsView
)

urlpatterns = [
    path('order/create/', CreateOrderView.as_view(), name='order-create'),
    path('order/userorders/', UserOrdersView.as_view(), name='user-orders'),
    path('order/detail/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),

    # Admin endpoints
    path('admin/orders/', AdminOrdersListView.as_view(), name='admin-orders'),
    path('admin/order/status/<int:pk>/', AdminOrderStatusUpdateView.as_view(), name='admin-order-status'),
    path('admin/dashboard/', AdminDashboardStatsView.as_view(), name='admin-dashboard'),
]
