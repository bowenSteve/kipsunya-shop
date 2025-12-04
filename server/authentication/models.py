# authentication/models.py
from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    """Extend Django's User with additional fields for marketplace"""

    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('vendor', 'Vendor'),
        ('admin', 'Admin'),
    ]

    TIER_CHOICES = [
        ('free', 'Free'),
        ('basic', 'Basic'),
        ('premium', 'Premium'),
        ('featured', 'Featured'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')

    # Basic profile fields
    phone = models.CharField(max_length=20, blank=True, null=True)
    whatsapp = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    neighborhood = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, default='Kenya')
    date_of_birth = models.DateField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)

    # Vendor business fields
    business_name = models.CharField(max_length=255, blank=True, null=True)
    business_type = models.CharField(max_length=100, blank=True, null=True)
    business_description = models.TextField(blank=True, null=True)
    business_phone = models.CharField(max_length=20, blank=True, null=True)
    business_email = models.EmailField(blank=True, null=True)
    business_address = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    tax_id = models.CharField(max_length=100, blank=True, null=True)

    # Vendor tier and subscription
    vendor_tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='free')
    subscription_expires_at = models.DateTimeField(null=True, blank=True)
    subscription_started_at = models.DateTimeField(null=True, blank=True)

    # Vendor status
    business_verified = models.BooleanField(default=False)
    vendor_approved_at = models.DateTimeField(null=True, blank=True)

    # Social media (stored as JSON)
    social_media = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def product_limit(self):
        """Return product limit based on vendor tier"""
        limits = {
            'free': 10,
            'basic': 50,
            'premium': 150,
            'featured': None,  # Unlimited
        }
        return limits.get(self.vendor_tier, 10)

    @property
    def is_subscription_active(self):
        """Check if vendor subscription is still active"""
        if self.vendor_tier == 'free':
            return True
        if not self.subscription_expires_at:
            return False
        from django.utils import timezone
        return self.subscription_expires_at > timezone.now()
    
    def __str__(self):
        return f"{self.user.email} - {self.get_role_display()}"

# Automatically create profile when user is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()

# Add role property to User model for easy access
def get_user_role(self):
    try:
        return self.profile.role
    except UserProfile.DoesNotExist:
        UserProfile.objects.create(user=self, role='customer')
        return 'customer'

User.add_to_class('role', property(get_user_role))