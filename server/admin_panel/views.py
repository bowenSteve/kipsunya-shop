# server/admin_panel/views.py

from django.utils import timezone
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser # This is crucial for security

# Import your models
from orders.models import Order
from authentication.models import User # Assuming your custom user model is here
from products.models import Product

class DashboardStatsView(APIView):
    """
    Provides statistics for the admin dashboard.
    Only accessible by admin users.
    """
    permission_classes = [IsAdminUser] # Ensures only admins can access this view

    def get(self, request, *args, **kwargs):
        # 1. KPI Data
        total_sales = Order.objects.filter(status='Delivered').aggregate(total=Sum('total_price'))['total'] or 0
        total_orders = Order.objects.count()
        total_customers = User.objects.filter(role='customer').count()
        
        # New orders in the last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        new_orders = Order.objects.filter(created_at__gte=thirty_days_ago).count()

        # 2. Sales Chart Data (last 6 months)
        six_months_ago = timezone.now() - timedelta(days=180)
        sales_by_month = Order.objects.filter(
            created_at__gte=six_months_ago,
            status='Delivered'
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            total=Sum('total_price')
        ).order_by('month')

        sales_chart_labels = [s['month'].strftime('%b %Y') for s in sales_by_month]
        sales_chart_data = [s['total'] for s in sales_by_month]
        
        # 3. Category Chart Data
        category_data = Product.objects.values('category__name').annotate(count=Count('id'))
        category_chart_labels = [c['category__name'] for c in category_data]
        category_chart_data = [c['count'] for c in category_data]

        # 4. Recent Orders
        recent_orders = Order.objects.order_by('-created_at')[:5].values(
            'id', 'user__first_name', 'user__last_name', 'total_price', 'status'
        )

        # Structure the response
        data = {
            "kpiData": {
                "totalSales": total_sales,
                "newOrders": total_orders, # Using total orders for now
                "newCustomers": total_customers,
                "pendingOrders": Order.objects.filter(status='Pending').count()
            },
            "salesData": {
                "labels": sales_chart_labels,
                "data": sales_chart_data
            },
            "categoryData": {
                "labels": category_chart_labels,
                "data": category_chart_data
            },
            "recentOrders": [
                {
                    "id": f"ORD-{o['id']}",
                    "customer": f"{o['user__first_name']} {o['user__last_name']}",
                    "total": o['total_price'],
                    "status": o['status']
                } for o in recent_orders
            ]
        }
        
        return Response(data)