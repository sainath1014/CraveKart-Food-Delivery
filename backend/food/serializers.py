from rest_framework import serializers
from .models import Food


class SafeImageField(serializers.ImageField):
    """Writable ImageField that avoids crashing GET serialization if storage URL resolution fails."""

    def to_representation(self, value):
        try:
            return super().to_representation(value)
        except Exception:
            return None


class FoodSerializer(serializers.ModelSerializer):
    image = SafeImageField(required=False, allow_null=True)
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
            try:
                image_url = obj.image.url
                if request:
                    return request.build_absolute_uri(image_url)
                return image_url
            except Exception:
                pass
        if obj.image_url:
            return obj.image_url
        return ''
