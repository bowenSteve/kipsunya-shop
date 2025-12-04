# products/views.py - Updated for marketplace with tier enforcement
from rest_framework import generics, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from django.db.models import Sum, F, Q, Case, When, Value, IntegerField
from .models import Product, Category
from .serializers import ProductSerializer, CategorySerializer, VendorStatsSerializer


# Public product listing with tier-based ordering
class AllProductsView(generics.ListAPIView):
    """
    API endpoint that returns all products with filtering, searching, and tier-based ordering.
    Products are ordered by vendor tier (featured -> premium -> basic -> free) then by date.
    """
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    filterset_fields = ['category', 'in_stock', 'featured', 'is_active']
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['price', 'created_at', 'name']

    def get_queryset(self):
        queryset = Product.objects.select_related('category', 'vendor', 'vendor__profile').filter(is_active=True)

        # Filter by availability
        available_only = self.request.query_params.get('available_only', None)
        if available_only and available_only.lower() == 'true':
            queryset = queryset.filter(in_stock=True, stock_quantity__gt=0)

        # Filter by price range
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)

        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        # Filter by location
        city = self.request.query_params.get('city', None)
        district = self.request.query_params.get('district', None)

        if city:
            queryset = queryset.filter(vendor__profile__city__icontains=city)
        if district:
            queryset = queryset.filter(vendor__profile__district__icontains=district)

        # Filter by vendor_id
        vendor_id = self.request.query_params.get('vendor_id', None)
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)

        # Order by vendor tier (higher tiers appear first)
        queryset = queryset.annotate(
            tier_priority=Case(
                When(vendor__profile__vendor_tier='featured', then=Value(4)),
                When(vendor__profile__vendor_tier='premium', then=Value(3)),
                When(vendor__profile__vendor_tier='basic', then=Value(2)),
                When(vendor__profile__vendor_tier='free', then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            )
        ).order_by('-tier_priority', '-created_at')

        return queryset


# Product CRUD for vendors
class ProductListCreateView(generics.ListCreateAPIView):
    """
    List products or create new product (for vendors)
    GET: List all products
    POST: Create new product (vendors only) with tier limit enforcement
    """
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'in_stock', 'featured', 'is_active']
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = Product.objects.select_related('category', 'vendor', 'vendor__profile')

        # If user is authenticated and is a vendor, show only their products
        if user.is_authenticated and hasattr(user, 'role') and user.role == 'vendor':
            queryset = queryset.filter(vendor=user)

        return queryset

    def create(self, request, *args, **kwargs):
        """Create product with tier limit enforcement"""
        user = request.user

        # Check if user is vendor
        if not hasattr(user, 'role') or user.role not in ['vendor', 'admin']:
            return Response({
                'error': 'Only vendors and admins can create products'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check product limit for vendors (admins have no limit)
        if user.role == 'vendor':
            profile = user.profile
            product_limit = profile.product_limit
            current_count = Product.objects.filter(vendor=user).count()

            # Enforce limit (None means unlimited for featured tier)
            if product_limit is not None and current_count >= product_limit:
                return Response({
                    'error': f'You have reached your product limit ({product_limit} products for {profile.vendor_tier} tier). Please upgrade your subscription to add more products.',
                    'current_count': current_count,
                    'limit': product_limit,
                    'tier': profile.vendor_tier
                }, status=status.HTTP_403_FORBIDDEN)

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        """Set the vendor to the current user when creating a product"""
        serializer.save(vendor=self.request.user)


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a product
    GET: Anyone can view (increments view count)
    PUT/PATCH: Only product owner (vendor) or admin
    DELETE: Only product owner (vendor) or admin
    """
    serializer_class = ProductSerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if self.request.method == 'GET':
            return Product.objects.select_related('category', 'vendor', 'vendor__profile').filter(is_active=True)
        else:
            # For write operations, user can only access their own products
            user = self.request.user
            if hasattr(user, 'role') and user.role == 'admin':
                return Product.objects.select_related('category', 'vendor', 'vendor__profile').all()
            else:
                return Product.objects.select_related('category', 'vendor', 'vendor__profile').filter(vendor=user)

    def retrieve(self, request, *args, **kwargs):
        """Increment view count when product is viewed"""
        instance = self.get_object()

        # Increment view count
        Product.objects.filter(id=instance.id).update(view_count=F('view_count') + 1)
        instance.refresh_from_db()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)


# Category CRUD Operations
class CategoryListCreateView(generics.ListCreateAPIView):
    """
    List categories or create new category
    GET: Anyone can view
    POST: Only authenticated users (vendors/admins)
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        """Auto-generate slug if not provided"""
        name = serializer.validated_data.get('name')
        slug = serializer.validated_data.get('slug')

        if not slug:
            base_slug = slugify(name)
            slug = base_slug
            counter = 1
            while Category.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

        serializer.save(slug=slug)


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a category
    GET: Anyone can view
    PUT/PATCH/DELETE: Only admins
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]


# Simple function-based views
@api_view(['GET'])
@permission_classes([AllowAny])
def featured_products(request):
    """API endpoint that returns only featured products (Featured tier vendors)"""
    products = Product.objects.select_related('category', 'vendor', 'vendor__profile').filter(
        is_active=True,
        vendor__profile__vendor_tier='featured'
    ).order_by('-created_at')[:20]

    serializer = ProductSerializer(products, many=True, context={'request': request})

    return Response({
        'success': True,
        'count': len(serializer.data),
        'featured_products': serializer.data
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def product_by_id(request, id):
    """
    API endpoint that returns a single product by ID.
    Increments view count.
    """
    try:
        product = Product.objects.select_related('category', 'vendor', 'vendor__profile').get(id=id, is_active=True)

        # Increment view count
        Product.objects.filter(id=product.id).update(view_count=F('view_count') + 1)
        product.refresh_from_db()

        serializer = ProductSerializer(product, context={'request': request})
        return Response({
            'success': True,
            'product': serializer.data
        })
    except Product.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Product not found'
        }, status=404)


@api_view(['GET'])
@permission_classes([AllowAny])
def product_by_slug(request, slug):
    """
    API endpoint that returns a single product by slug.
    Increments view count.
    """
    try:
        product = Product.objects.select_related('category', 'vendor', 'vendor__profile').get(slug=slug, is_active=True)

        # Increment view count
        Product.objects.filter(id=product.id).update(view_count=F('view_count') + 1)
        product.refresh_from_db()

        serializer = ProductSerializer(product, context={'request': request})
        return Response({
            'success': True,
            'product': serializer.data
        })
    except Product.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Product not found'
        }, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reveal_contact(request, product_id):
    """
    Reveal vendor contact information and increment contact_reveal_count.
    Only for authenticated users.
    """
    try:
        product = Product.objects.select_related('vendor', 'vendor__profile').get(id=product_id, is_active=True)

        # Increment contact reveal count
        Product.objects.filter(id=product.id).update(contact_reveal_count=F('contact_reveal_count') + 1)
        product.refresh_from_db()

        # Return vendor contact information
        vendor_profile = product.vendor.profile

        return Response({
            'success': True,
            'contact': {
                'phone': vendor_profile.phone,
                'whatsapp': vendor_profile.whatsapp,
                'business_name': vendor_profile.business_name,
                'business_phone': vendor_profile.business_phone,
                'email': product.vendor.email,
            }
        })
    except Product.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Product not found'
        }, status=404)


@api_view(['GET'])
@permission_classes([AllowAny])
def categories(request):
    """API endpoint that returns all categories."""
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)

    return Response({
        'success': True,
        'count': len(serializer.data),
        'categories': serializer.data
    })


# Vendor-specific endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vendor_products(request):
    """Get all products for the current vendor"""
    if not hasattr(request.user, 'role') or request.user.role != 'vendor':
        return Response({
            'error': 'Only vendors can access this endpoint'
        }, status=403)

    products = Product.objects.select_related('category').filter(vendor=request.user)
    serializer = ProductSerializer(products, many=True, context={'request': request})

    return Response({
        'success': True,
        'count': len(serializer.data),
        'products': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vendor_stats(request):
    """Get vendor dashboard statistics"""
    if not hasattr(request.user, 'role') or request.user.role != 'vendor':
        return Response({
            'error': 'Only vendors can access this endpoint'
        }, status=403)

    user = request.user
    profile = user.profile

    # Calculate stats
    products = Product.objects.filter(vendor=user)
    total_products = products.count()
    active_products = products.filter(is_active=True).count()

    # Sum of all views and contact reveals
    stats = products.aggregate(
        total_views=Sum('view_count'),
        total_contacts=Sum('contact_reveal_count')
    )

    # Product limit info
    product_limit = profile.product_limit
    products_remaining = None if product_limit is None else max(0, product_limit - total_products)

    data = {
        'total_products': total_products,
        'active_products': active_products,
        'total_views': stats['total_views'] or 0,
        'total_contacts': stats['total_contacts'] or 0,
        'vendor_tier': profile.vendor_tier,
        'product_limit': product_limit,
        'products_remaining': products_remaining,
        'subscription_expires_at': profile.subscription_expires_at,
        'is_subscription_active': profile.is_subscription_active,
    }

    serializer = VendorStatsSerializer(data)
    return Response({
        'success': True,
        'stats': serializer.data
    })
