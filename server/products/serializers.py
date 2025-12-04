# products/serializers.py - Updated for marketplace
from rest_framework import serializers
from django.utils.text import slugify
from .models import Product, Category

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'product_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()

    def validate_name(self, value):
        """Ensure category name is unique"""
        if self.instance:
            if Category.objects.filter(name__iexact=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("A category with this name already exists.")
        else:
            if Category.objects.filter(name__iexact=value).exists():
                raise serializers.ValidationError("A category with this name already exists.")
        return value

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=True)
    is_available = serializers.ReadOnlyField()

    # Vendor information fields - contact info only shown to authenticated users
    vendor_name = serializers.SerializerMethodField()
    vendor_phone = serializers.SerializerMethodField()
    vendor_whatsapp = serializers.SerializerMethodField()
    vendor_business = serializers.SerializerMethodField()
    vendor_location = serializers.SerializerMethodField()
    vendor_tier = serializers.SerializerMethodField()
    vendor_id = serializers.SerializerMethodField()

    # Analytics
    view_count = serializers.IntegerField(read_only=True)
    contact_reveal_count = serializers.IntegerField(read_only=True)

    # Image field
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'description',
            'category',
            'category_id',
            'price',
            'stock_quantity',
            'in_stock',
            'is_available',
            'image',
            'slug',
            'featured',
            'is_active',
            'created_at',
            'updated_at',
            # Vendor fields
            'vendor_name',
            'vendor_phone',
            'vendor_whatsapp',
            'vendor_business',
            'vendor_location',
            'vendor_tier',
            'vendor_id',
            # Analytics
            'view_count',
            'contact_reveal_count',
        ]
        read_only_fields = ['created_at', 'updated_at', 'slug', 'view_count', 'contact_reveal_count']

    def get_vendor_name(self, obj):
        """Get vendor's full name"""
        if obj.vendor:
            return obj.vendor.get_full_name() or obj.vendor.email
        return None

    def get_vendor_phone(self, obj):
        """Get vendor's phone number - only for authenticated users"""
        request = self.context.get('request')
        if request and request.user.is_authenticated and obj.vendor:
            try:
                return obj.vendor.profile.phone
            except:
                return None
        return None

    def get_vendor_whatsapp(self, obj):
        """Get vendor's WhatsApp - only for authenticated users"""
        request = self.context.get('request')
        if request and request.user.is_authenticated and obj.vendor:
            try:
                return obj.vendor.profile.whatsapp
            except:
                return None
        return None

    def get_vendor_business(self, obj):
        """Get vendor's business name"""
        if obj.vendor:
            try:
                return obj.vendor.profile.business_name
            except:
                return None
        return None

    def get_vendor_location(self, obj):
        """Get vendor's location"""
        if obj.vendor:
            try:
                profile = obj.vendor.profile
                location_parts = [profile.neighborhood, profile.district, profile.city]
                location = ', '.join([part for part in location_parts if part])
                return location if location else None
            except:
                return None
        return None

    def get_vendor_tier(self, obj):
        """Get vendor's tier"""
        if obj.vendor:
            try:
                return obj.vendor.profile.vendor_tier
            except:
                return 'free'
        return 'free'

    def get_vendor_id(self, obj):
        """Get vendor's ID"""
        if obj.vendor:
            return obj.vendor.id
        return None

    def validate_category_id(self, value):
        """Validate that the category exists"""
        try:
            Category.objects.get(id=value)
        except Category.DoesNotExist:
            raise serializers.ValidationError("Category does not exist.")
        return value

    def validate_price(self, value):
        """Validate price is positive"""
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0.")
        return value

    def validate_stock_quantity(self, value):
        """Validate stock quantity is not negative"""
        if value < 0:
            raise serializers.ValidationError("Stock quantity cannot be negative.")
        return value

    def validate_name(self, value):
        """Validate product name"""
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Product name must be at least 3 characters long.")

        # Check for uniqueness within the same vendor (if updating)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            queryset = Product.objects.filter(name__iexact=value.strip(), vendor=request.user)
            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)
            if queryset.exists():
                raise serializers.ValidationError("You already have a product with this name.")

        return value.strip()

    def create(self, validated_data):
        """Create product with auto-generated slug"""
        category_id = validated_data.pop('category_id')
        category = Category.objects.get(id=category_id)

        # Generate unique slug
        name = validated_data['name']
        base_slug = slugify(name)
        slug = base_slug
        counter = 1

        while Product.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        validated_data['slug'] = slug
        validated_data['category'] = category

        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update product, regenerate slug if name changed"""
        category_id = validated_data.pop('category_id', None)

        if category_id:
            category = Category.objects.get(id=category_id)
            validated_data['category'] = category

        # Check if name changed and regenerate slug
        new_name = validated_data.get('name')
        if new_name and new_name != instance.name:
            base_slug = slugify(new_name)
            slug = base_slug
            counter = 1

            while Product.objects.filter(slug=slug).exclude(id=instance.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            validated_data['slug'] = slug

        return super().update(instance, validated_data)


class VendorStatsSerializer(serializers.Serializer):
    """Serializer for vendor dashboard statistics"""
    total_products = serializers.IntegerField()
    active_products = serializers.IntegerField()
    total_views = serializers.IntegerField()
    total_contacts = serializers.IntegerField()
    vendor_tier = serializers.CharField()
    product_limit = serializers.IntegerField(allow_null=True)
    products_remaining = serializers.IntegerField(allow_null=True)
    subscription_expires_at = serializers.DateTimeField(allow_null=True)
    is_subscription_active = serializers.BooleanField()
