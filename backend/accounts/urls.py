from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, AdminLoginView, UserProfileView, LogoutView

urlpatterns = [
    path('user/register/', RegisterView.as_view(), name='user-register'),
    path('user/login/', LoginView.as_view(), name='user-login'),
    path('user/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('user/logout/', LogoutView.as_view(), name='user-logout'),
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    path('admin/login/', AdminLoginView.as_view(), name='admin-login'),
]
