from django.core.management.base import BaseCommand
from accounts.models import User
from food.models import Food
from promotions.models import PromoCode
from orders.models import Order, OrderItem
from decimal import Decimal
import datetime

class Command(BaseCommand):
    help = 'Seeds CraveKart with initial admin, customer, promo codes, and delicious menu items'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding CraveKart database...")

        # 1. Create Administrator
        admin_email = 'admin@cravekart.com'
        if not User.objects.filter(email=admin_email).exists():
            admin_user = User.objects.create_superuser(
                email=admin_email,
                password='AdminPassword@123',
                name='CraveKart Admin',
                phone='+91 9876543210',
                address='CraveKart HQ, Bangalore, Karnataka'
            )
            self.stdout.write(self.style.SUCCESS(f"Created Admin: {admin_email} (Password: AdminPassword@123)"))
        else:
            admin_user = User.objects.get(email=admin_email)
            admin_user.set_password('AdminPassword@123')
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save()
            self.stdout.write(f"Updated Admin: {admin_email}")

        # 2. Create Demo Customer
        customer_email = 'customer@example.com'
        if not User.objects.filter(email=customer_email).exists():
            demo_user = User.objects.create_user(
                email=customer_email,
                password='CustomerPassword@123',
                name='Avinash Kumar',
                phone='+91 9876543210',
                address='GreatStack, Whitefield, Bangalore, Karnataka, 560066'
            )
            self.stdout.write(self.style.SUCCESS(f"Created Demo Customer: {customer_email} (Password: CustomerPassword@123)"))
        else:
            demo_user = User.objects.get(email=customer_email)

        # 3. Create Promo Codes
        promos = [
            {
                'code': 'CRAVE50',
                'discount_type': 'flat',
                'discount_value': Decimal('50.00'),
                'minimum_order_amount': Decimal('200.00'),
                'expiry_date': datetime.date(2027, 12, 31)
            },
            {
                'code': 'FIRSTORDER',
                'discount_type': 'percentage',
                'discount_value': Decimal('20.00'),
                'minimum_order_amount': Decimal('150.00'),
                'expiry_date': datetime.date(2027, 12, 31)
            },
            {
                'code': 'DELIGHT',
                'discount_type': 'flat',
                'discount_value': Decimal('100.00'),
                'minimum_order_amount': Decimal('400.00'),
                'expiry_date': datetime.date(2027, 12, 31)
            }
        ]

        for p_data in promos:
            promo, created = PromoCode.objects.update_or_create(
                code=p_data['code'],
                defaults=p_data
            )
            if created:
                self.stdout.write(f"Created Promo Code: {promo.code}")

        # 4. Seed Foods across all 8 categories
        sample_foods = [
            # Salads
            {
                'name': 'Greek Salad',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Salad',
                'price': Decimal('120.00'),
                'rating': Decimal('4.8'),
                'image_url': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Veg Salad',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Salad',
                'price': Decimal('180.00'),
                'rating': Decimal('4.6'),
                'image_url': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Clover Salad',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Salad',
                'price': Decimal('160.00'),
                'rating': Decimal('4.7'),
                'image_url': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Chicken Salad',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Salad',
                'price': Decimal('240.00'),
                'rating': Decimal('4.9'),
                'image_url': 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&auto=format&fit=crop&q=80'
            },

            # Rolls
            {
                'name': 'Lasagna Rolls',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Rolls',
                'price': Decimal('140.00'),
                'rating': Decimal('4.7'),
                'image_url': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Peri Peri Rolls',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Rolls',
                'price': Decimal('120.00'),
                'rating': Decimal('4.6'),
                'image_url': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Chicken Rolls',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Rolls',
                'price': Decimal('200.00'),
                'rating': Decimal('4.9'),
                'image_url': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Veg Rolls',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Rolls',
                'price': Decimal('150.00'),
                'rating': Decimal('4.5'),
                'image_url': 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80'
            },

            # Desserts
            {
                'name': 'Ripple Ice Cream',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Desserts',
                'price': Decimal('140.00'),
                'rating': Decimal('4.8'),
                'image_url': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Fruit Ice Cream',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Desserts',
                'price': Decimal('220.00'),
                'rating': Decimal('4.9'),
                'image_url': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Jar Ice Cream',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Desserts',
                'price': Decimal('100.00'),
                'rating': Decimal('4.7'),
                'image_url': 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Vanilla Ice Cream',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Desserts',
                'price': Decimal('120.00'),
                'rating': Decimal('4.6'),
                'image_url': 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&auto=format&fit=crop&q=80'
            },

            # Sandwich
            {
                'name': 'Grilled Cheese Sandwich',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Sandwich',
                'price': Decimal('130.00'),
                'rating': Decimal('4.7'),
                'image_url': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Club Sandwich',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Sandwich',
                'price': Decimal('170.00'),
                'rating': Decimal('4.8'),
                'image_url': 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Paneer Tikka Sandwich',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Sandwich',
                'price': Decimal('160.00'),
                'rating': Decimal('4.6'),
                'image_url': 'https://images.unsplash.com/photo-1619096252214-ef06c45683e3?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Chicken Mayo Sandwich',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Sandwich',
                'price': Decimal('190.00'),
                'rating': Decimal('4.8'),
                'image_url': 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80'
            },

            # Cake
            {
                'name': 'Chocolate Truffle Cake',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Cake',
                'price': Decimal('350.00'),
                'rating': Decimal('4.9'),
                'image_url': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Red Velvet Cake',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Cake',
                'price': Decimal('380.00'),
                'rating': Decimal('4.8'),
                'image_url': 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Blueberry Cheesecake',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Cake',
                'price': Decimal('420.00'),
                'rating': Decimal('5.0'),
                'image_url': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop&q=80'
            },

            # Pure Veg
            {
                'name': 'Paneer Butter Masala',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Pure Veg',
                'price': Decimal('260.00'),
                'rating': Decimal('4.9'),
                'image_url': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Dal Makhani',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Pure Veg',
                'price': Decimal('210.00'),
                'rating': Decimal('4.7'),
                'image_url': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Veg Dum Biryani',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Pure Veg',
                'price': Decimal('240.00'),
                'rating': Decimal('4.8'),
                'image_url': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80'
            },

            # Pasta
            {
                'name': 'Penne Arrabiata',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Pasta',
                'price': Decimal('190.00'),
                'rating': Decimal('4.7'),
                'image_url': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Creamy Alfredo Pasta',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Pasta',
                'price': Decimal('220.00'),
                'rating': Decimal('4.8'),
                'image_url': 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Cheesy Macaroni',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Pasta',
                'price': Decimal('180.00'),
                'rating': Decimal('4.6'),
                'image_url': 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&auto=format&fit=crop&q=80'
            },

            # Noodles
            {
                'name': 'Butter Noodles',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Noodles',
                'price': Decimal('140.00'),
                'rating': Decimal('4.7'),
                'image_url': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Veg Noodles',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Noodles',
                'price': Decimal('120.00'),
                'rating': Decimal('4.6'),
                'image_url': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Somen Noodles',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Noodles',
                'price': Decimal('200.00'),
                'rating': Decimal('4.9'),
                'image_url': 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Cooked Noodles',
                'description': 'Food provides essential nutrients for overall health and well-being.',
                'category': 'Noodles',
                'price': Decimal('150.00'),
                'rating': Decimal('4.5'),
                'image_url': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80'
            },
        ]

        for f_data in sample_foods:
            Food.objects.update_or_create(
                name=f_data['name'],
                defaults=f_data
            )

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(sample_foods)} food items successfully."))

        # 5. Create a sample initial order for demo customer (matching screenshots 7 & 8)
        if not Order.objects.filter(user=demo_user).exists():
            greek_salad = Food.objects.filter(name='Greek Salad').first()
            peri_rolls = Food.objects.filter(name='Peri Peri Rolls').first()

            order = Order.objects.create(
                user=demo_user,
                first_name='Avinash',
                last_name='Kumar',
                email='customer@example.com',
                phone='9876543210',
                street='GreatStack, Whitefield',
                city='Bangalore',
                state='Karnataka',
                zip_code='560066',
                country='India',
                subtotal=Decimal('600.00'),
                delivery_fee=Decimal('40.00'),
                discount=Decimal('0.00'),
                total_amount=Decimal('640.00'),
                payment_method='Razorpay',
                payment_status='Paid',
                razorpay_order_id='order_demo_101',
                razorpay_payment_id='pay_demo_101',
                order_status='Food Processing'
            )
            if greek_salad:
                OrderItem.objects.create(
                    order=order,
                    food=greek_salad,
                    food_name_snapshot='Greek salad',
                    food_image_snapshot=greek_salad.display_image,
                    price_snapshot=greek_salad.price,
                    quantity=2,
                    item_total=greek_salad.price * 2
                )
            if peri_rolls:
                OrderItem.objects.create(
                    order=order,
                    food=peri_rolls,
                    food_name_snapshot='Peri Peri Rolls',
                    food_image_snapshot=peri_rolls.display_image,
                    price_snapshot=peri_rolls.price,
                    quantity=3,
                    item_total=peri_rolls.price * 3
                )
            self.stdout.write(self.style.SUCCESS(f"Created sample order #{order.id} for demo customer."))

        self.stdout.write(self.style.SUCCESS("CraveKart database successfully seeded!"))
