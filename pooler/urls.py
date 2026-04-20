from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard_view, name='dashboard'),
    path('login/', views.login_view, name='login'),
    path('login/otp/', views.login_otp_view, name='login_otp'),
    path('logout/', views.logout_view, name='logout'),

    path('pools/', views.pool_list_view, name='pool_list'),
    path('pools/create/', views.pool_create_view, name='pool_create'),
    path('pools/<str:pk>/', views.pool_detail_view, name='pool_detail'),
    path('pools/<str:pk>/edit/', views.pool_edit_view, name='pool_edit'),
    path('pools/<str:pk>/delete/', views.pool_delete_view, name='pool_delete'),
    path('pools/<str:pk>/allocate/', views.allocate_view, name='allocate'),
    path('pools/<str:pk>/release/', views.release_view, name='release'),

    path('allocations/', views.allocation_list_view, name='allocation_list'),

    # JSON API
    path('api/users/', views.api_users, name='api_users'),
    path('api/pools/<str:pk>/free-ips/', views.api_free_ips, name='api_free_ips'),
]
