import os
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

import requests

BASE_URL = 'http://127.0.0.1:8000/api'

def test_full_flow():
    session = requests.Session()

    # 1. Customer registration / login
    reg_data = {
        'name': 'Rajesh Sharma',
        'email': 'rajesh.sharma@example.com',
        'password': 'SecurePassword@123',
        'confirm_password': 'SecurePassword@123',
    }
    r = session.post(f'{BASE_URL}/user/register/', json=reg_data)
    if r.status_code == 400 and 'already exists' in r.text:
        r = session.post(f'{BASE_URL}/user/login/', json={'email': reg_data['email'], 'password': reg_data['password']})

    assert r.status_code in (200, 201), f"Auth failed: {r.text}"
    token = r.json()['tokens']['access']
    headers = {'Authorization': f'Bearer {token}'}
    print(f"1. Customer Authenticated: {r.json()['user']['email']}")

    # 2. Add to Cart
    r_cart = session.post(f'{BASE_URL}/cart/add/', json={'food_id': 1, 'quantity': 2}, headers=headers)
    assert r_cart.status_code == 200, f"Cart add failed: {r_cart.text}"
    cart_info = r_cart.json()['cart']
    print(f"2. Added food to cart: Subtotal = INR {cart_info['subtotal']}, Items = {cart_info['item_count']}")

    # 3. Apply Promo Code
    r_promo = session.post(f'{BASE_URL}/promo/validate/', json={'code': 'CRAVE50', 'subtotal': float(cart_info['subtotal'])})
    assert r_promo.status_code == 200, f"Promo validation failed: {r_promo.text}"
    print(f"3. Promo CRAVE50 applied: Discount = INR {r_promo.json()['promo']['discount_amount']}")

    # 4. Checkout Order
    checkout_data = {
        'first_name': 'Rajesh',
        'last_name': 'Sharma',
        'email': 'rajesh.sharma@example.com',
        'phone': '9876543210',
        'street': '100 Feet Road, Indiranagar',
        'city': 'Bangalore',
        'state': 'Karnataka',
        'zip_code': '560038',
        'country': 'India',
        'promo_code': 'CRAVE50'
    }
    r_order = session.post(f'{BASE_URL}/order/create/', json=checkout_data, headers=headers)
    assert r_order.status_code == 201, f"Order create failed: {r_order.text}"
    order_res = r_order.json()
    order_id = order_res['order_id']
    rzp_order_id = order_res['razorpay']['order_id']
    total_amt = order_res['order_summary']['total_amount']
    print(f"4. Created Order #{order_id}: Total = INR {total_amt}, Razorpay Order = {rzp_order_id}")

    # 5. Verify Razorpay Payment
    verify_data = {
        'order_id': order_id,
        'razorpay_order_id': rzp_order_id,
        'razorpay_payment_id': 'pay_test_online_123',
        'razorpay_signature': 'sig_test_online_123'
    }
    r_verify = session.post(f'{BASE_URL}/payment/verify/', json=verify_data, headers=headers)
    assert r_verify.status_code == 200, f"Payment verify failed: {r_verify.text}"
    print(f"5. Payment Verified: Status = {r_verify.json()['order']['payment_status']}")

    # 6. Verify Cart Cleared
    r_cart_after = session.get(f'{BASE_URL}/cart/', headers=headers)
    assert len(r_cart_after.json()['cart']['items']) == 0, "Cart should be cleared after payment!"
    print(f"6. Cart successfully cleared after payment.")

    # 7. Admin Login & Update Order Status
    r_admin_login = session.post(f'{BASE_URL}/admin/login/', json={'email': 'admin@cravekart.com', 'password': 'AdminPassword@123'})
    assert r_admin_login.status_code == 200, f"Admin login failed: {r_admin_login.text}"
    admin_token = r_admin_login.json()['tokens']['access']
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    print(f"7. Admin logged in: {r_admin_login.json()['user']['name']}")

    # 8. Update Order Status to 'Out for Delivery'
    r_status = session.patch(f'{BASE_URL}/admin/order/status/{order_id}/', json={'order_status': 'Out for Delivery'}, headers=admin_headers)
    assert r_status.status_code == 200, f"Admin status update failed: {r_status.text}"
    print(f"8. Admin updated Order #{order_id} status to: {r_status.json()['order']['order_status']}")

    # 9. Customer views updated order in /userorders/
    r_user_orders = session.get(f'{BASE_URL}/order/userorders/', headers=headers)
    user_orders = r_user_orders.json()['orders']
    updated_order = next(o for o in user_orders if o['id'] == order_id)
    assert updated_order['order_status'] == 'Out for Delivery', "Customer should see updated status!"
    print(f"9. Customer sees updated status in My Orders: {updated_order['order_status']}")

    print("\n==============================================")
    print("  ALL 9 END-TO-END WORKFLOW TESTS PASSED 100%!")
    print("==============================================")

if __name__ == '__main__':
    test_full_flow()
