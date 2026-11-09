from django.db import models

class Food(models.Model):
    CATEGORY_CHOICES = [
        ('Salad', 'Salad'),
        ('Rolls', 'Rolls'),
        ('Desserts', 'Desserts'),
        ('Sandwich', 'Sandwich'),
        ('Cake', 'Cake'),
        ('Pure Veg', 'Pure Veg'),
        ('Pasta', 'Pasta'),
        ('Noodles', 'Noodles'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    image = models.ImageField(upload_to='foods/', null=True, blank=True)
    image_url = models.CharField(max_length=500, blank=True, default='')
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.5)
    available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - ₹{self.price} ({self.category})"

    @property
    def display_image(self):
        if self.image:
            return self.image.url
        if self.image_url:
            return self.image_url
        return '/placeholder-food.png'
