from rest_framework import serializers
from .models import Food

class FoodSerializer(serializers.ModelSerializer):
    display_image = serializers.SerializerMethodField()

    class Meta:
        model = Food
        fields = [
            'id', 'name', 'description', 'category', 'price',
            'image', 'image_url', 'display_image', 'rating',
            'available', 'created_at', 'updated_at'
        ]

    def get_display_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        if obj.image_url:
            return obj.image_url
        return ''
