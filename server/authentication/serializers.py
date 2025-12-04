from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""

    class Meta:
        model = UserProfile
        fields = [
            'role', 'phone', 'whatsapp', 'address', 'city', 'district',
            'neighborhood', 'country', 'bio', 'business_name', 'business_type',
            'business_description', 'business_phone', 'business_email',
            'business_address', 'website', 'vendor_tier', 'subscription_expires_at',
            'subscription_started_at', 'business_verified', 'vendor_approved_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['role', 'vendor_tier', 'subscription_expires_at',
                           'subscription_started_at', 'business_verified',
                           'vendor_approved_at', 'created_at', 'updated_at']


class VendorSerializer(serializers.ModelSerializer):
    """Serializer for vendor information (public view)"""
    phone = serializers.CharField(source='profile.phone', read_only=True)
    whatsapp = serializers.CharField(source='profile.whatsapp', read_only=True)
    business_name = serializers.CharField(source='profile.business_name', read_only=True)
    business_type = serializers.CharField(source='profile.business_type', read_only=True)
    business_verified = serializers.BooleanField(source='profile.business_verified', read_only=True)
    vendor_tier = serializers.CharField(source='profile.vendor_tier', read_only=True)
    location = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'email',
            'phone', 'whatsapp', 'business_name', 'business_type',
            'business_verified', 'vendor_tier', 'location'
        ]

    def get_location(self, obj):
        """Get formatted location"""
        try:
            profile = obj.profile
            location_parts = [profile.neighborhood, profile.district, profile.city]
            location = ', '.join([part for part in location_parts if part])
            return location if location else None
        except:
            return None
