# products/urls.py - Updated for marketplace
from django.urls import path
from . import views

app_name = 'products'

urlpatterns = [
    # Public product listing (tier-based ordering)
    path('all_products/', views.AllProductsView.as_view(), name='all_products'),
    path('featured/', views.featured_products, name='featured_products'),

    # Product detail endpoints (public read, increments view count)
    path('products/<int:id>/', views.product_by_id, name='product_detail_by_id'),
    path('product/<slug:slug>/', views.product_by_slug, name='product_detail_by_slug'),

    # Contact reveal endpoint (authenticated only, increments contact_reveal_count)
    path('products/<int:product_id>/reveal-contact/', views.reveal_contact, name='reveal-contact'),

    # CRUD endpoints for products
    path('products/', views.ProductListCreateView.as_view(), name='product-list-create'),
    path('products/<int:id>/edit/', views.ProductDetailView.as_view(), name='product-detail'),

    # Vendor-specific endpoints
    path('vendor/products/', views.vendor_products, name='vendor-products'),
    path('vendor/stats/', views.vendor_stats, name='vendor-stats'),

    # Category endpoints
    path('categories/', views.CategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<int:id>/', views.CategoryDetailView.as_view(), name='category-detail'),
    path('categories/list/', views.categories, name='categories-list'),
]