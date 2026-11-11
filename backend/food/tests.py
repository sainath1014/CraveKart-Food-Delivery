from decimal import Decimal
from unittest.mock import patch, PropertyMock
from django.db import DatabaseError
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Food
from .serializers import FoodSerializer


class FoodAPITests(APITestCase):
    def setUp(self):
        self.salad = Food.objects.create(
            name='Greek Salad',
            description='Fresh Mediterranean salad.',
            category='Salad',
            price=Decimal('120.00'),
            image_url='https://example.com/salad.jpg',
            rating=Decimal('4.8'),
            available=True,
        )
        self.dessert = Food.objects.create(
            name='Ripple Ice Cream',
            description='Creamy ripple dessert.',
            category='Desserts',
            price=Decimal('140.00'),
            image_url='https://example.com/icecream.jpg',
            rating=Decimal('4.7'),
            available=True,
        )
        self.noodles = Food.objects.create(
            name='Veg Noodles',
            description='Classic stir-fried noodles.',
            category='Noodles',
            price=Decimal('130.00'),
            image_url='https://example.com/noodles.jpg',
            rating=Decimal('4.5'),
            available=True,
        )
        self.unavailable = Food.objects.create(
            name='Hidden Salad',
            description='Temporarily unavailable.',
            category='Salad',
            price=Decimal('99.00'),
            image_url='https://example.com/hidden.jpg',
            available=False,
        )

    def test_food_list_returns_200_and_expected_contract(self):
        response = self.client.get('/api/food/list/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['count'], 3)
        self.assertEqual(len(data['foods']), 3)

        returned_names = {item['name'] for item in data['foods']}
        self.assertNotIn('Hidden Salad', returned_names)
        for field in (
            'id',
            'name',
            'description',
            'category',
            'price',
            'display_image',
            'image_url',
            'rating',
            'available',
        ):
            self.assertIn(field, data['foods'][0])

    def test_food_list_category_and_dessert_typo_filtering(self):
        all_resp = self.client.get('/api/food/list/?category=All')
        self.assertEqual(all_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(all_resp.json()['count'], 3)

        salad_resp = self.client.get('/api/food/list/?category=Salad')
        self.assertEqual(salad_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(salad_resp.json()['count'], 1)
        self.assertEqual(salad_resp.json()['foods'][0]['name'], 'Greek Salad')

        deserts_resp = self.client.get('/api/food/list/?category=Deserts')
        self.assertEqual(deserts_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(deserts_resp.json()['count'], 1)
        self.assertEqual(deserts_resp.json()['foods'][0]['name'], 'Ripple Ice Cream')

    def test_food_detail_and_search(self):
        detail_resp = self.client.get(f'/api/food/detail/{self.salad.id}/')
        self.assertEqual(detail_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(detail_resp.json()['success'])
        self.assertEqual(detail_resp.json()['food']['name'], 'Greek Salad')

        missing_resp = self.client.get('/api/food/detail/999999/')
        self.assertEqual(missing_resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(missing_resp.json()['success'])

        search_resp = self.client.get('/api/food/search/?q=Noodle')
        self.assertEqual(search_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(search_resp.json()['count'], 1)
        self.assertEqual(search_resp.json()['foods'][0]['name'], 'Veg Noodles')

        empty_search_resp = self.client.get('/api/food/search/?q=')
        self.assertEqual(empty_search_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(empty_search_resp.json()['foods'], [])

    def test_food_list_retries_once_on_database_error(self):
        sample_payload = [{'id': self.salad.id, 'name': 'Greek Salad'}]
        with patch('food.views.ensure_sqlite_ready') as mock_bootstrap, \
             patch(
                 'food.views.FoodListView._query_foods',
                 side_effect=[DatabaseError('no such table: food_food'), sample_payload],
             ):
            response = self.client.get('/api/food/list/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_bootstrap.assert_called_once()
        self.assertTrue(response.json()['success'])
        self.assertEqual(response.json()['count'], 1)

    def test_food_list_returns_structured_json_error_on_failure(self):
        with self.assertLogs('food.views', level='ERROR'), \
             patch('food.views.FoodListView._query_foods', side_effect=RuntimeError('unexpected db failure')):
            response = self.client.get('/api/food/list/')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'Failed to load food items.')

    def test_food_serializer_image_error_falls_back_to_image_url(self):
        self.salad.image.name = 'foods/missing.png'
        with patch.object(type(self.salad.image), 'url', new_callable=PropertyMock, side_effect=ValueError('storage error')):
            serialized = FoodSerializer(self.salad).data
        self.assertEqual(serialized['display_image'], 'https://example.com/salad.jpg')

    def test_cors_preflight_allows_session_key_header(self):
        response = self.client.options(
            '/api/food/list/',
            HTTP_ORIGIN='https://cravekart.onrender.com',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='GET',
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS='authorization,content-type,x-session-key',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.headers.get('Access-Control-Allow-Origin'), 'https://cravekart.onrender.com')
        allow_headers = (response.headers.get('Access-Control-Allow-Headers') or '').lower()
        self.assertIn('x-session-key', allow_headers)
