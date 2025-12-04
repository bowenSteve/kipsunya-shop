# server/admin_panel/views.py

from django.utils import timezone
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

# Import models
from django.contrib.auth.models import User
from products.models import Product
from authentication.models import UserProfile

class DashboardStatsView(APIView):
    """
    Provides statistics for the admin dashboard - updated for marketplace model.
    Only accessible by admin users.
    """
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        # 1. KPI Data
        total_products = Product.objects.count()
        active_products = Product.objects.filter(is_active=True).count()
        total_vendors = User.objects.filter(profile__role='vendor').count()
        total_customers = User.objects.filter(profile__role='customer').count()

        # Product views and contact reveals in the last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_products = Product.objects.filter(created_at__gte=thirty_days_ago)
        total_views_30d = recent_products.aggregate(total=Sum('view_count'))['total'] or 0
        total_contacts_30d = recent_products.aggregate(total=Sum('contact_reveal_count'))['total'] or 0

        kpi_data = {
            'total_products': total_products,
            'active_products': active_products,
            'total_vendors': total_vendors,
            'total_customers': total_customers,
            'views_last_30_days': total_views_30d,
            'contacts_last_30_days': total_contacts_30d,
        }

        # 2. Vendor tier distribution
        tier_distribution = UserProfile.objects.filter(role='vendor').values('vendor_tier').annotate(count=Count('id'))

        # 3. Top products by views
        top_viewed_products = Product.objects.filter(is_active=True).order_by('-view_count')[:10].values(
            'id', 'name', 'view_count', 'contact_reveal_count'
        )

        # 4. Top products by contact reveals
        top_contacted_products = Product.objects.filter(is_active=True).order_by('-contact_reveal_count')[:10].values(
            'id', 'name', 'view_count', 'contact_reveal_count'
        )

        # 5. Recent products (last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_products_list = Product.objects.filter(created_at__gte=seven_days_ago).order_by('-created_at')[:20].values(
            'id', 'name', 'created_at', 'vendor__email', 'view_count'
        )

        return Response({
            'success': True,
            'kpi': kpi_data,
            'tier_distribution': list(tier_distribution),
            'top_viewed_products': list(top_viewed_products),
            'top_contacted_products': list(top_contacted_products),
            'recent_products': list(recent_products_list),
        })
