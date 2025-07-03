# authentication/management/commands/make_admin.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from authentication.models import UserProfile

class Command(BaseCommand):
    help = 'Make a user an admin by email'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='User email to make admin')

    def handle(self, *args, **options):
        email = options['email'].lower().strip()
        
        try:
            # Find the user
            user = User.objects.get(email=email)
            
            # Update Django admin permissions
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.save()
            
            # Update or create UserProfile with admin role
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.role = 'admin'
            profile.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully made {email} an admin!\n'
                    f'Django admin access: ✓\n'
                    f'Custom admin role: ✓\n'
                    f'Profile {"created" if created else "updated"}: ✓'
                )
            )
            
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User with email {email} does not exist')
            )