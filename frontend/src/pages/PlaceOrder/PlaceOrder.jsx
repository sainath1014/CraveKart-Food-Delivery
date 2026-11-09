import React, { useContext, useState, useEffect } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { ShieldCheck, CreditCard, Smartphone, CheckCircle, X } from 'lucide-react';

const PlaceOrder = () => {
  const {
    getTotalCartAmount,
    token,
    user,
    foodList,
    cartItems,
    promoCode,
    fetchCart
  } = useContext(StoreContext);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [razorpayModal, setRazorpayModal] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('UPI');

  // Populate user data if available
  useEffect(() => {
    if (user) {
      const names = (user.name || '').split(' ');
      setFormData((prev) => ({
        ...prev,
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
        street: user.address || '',
      }));
    }
  }, [user]);

  const subtotal = getTotalCartAmount();
  const deliveryFee = subtotal === 0 ? 0 : 40;

  let discount = 0;
  if (promoCode && subtotal > 0) {
    if (promoCode.discount_type === 'percentage') {
      discount = (subtotal * Number(promoCode.discount_value)) / 100;
    } else {
      discount = Math.min(Number(promoCode.discount_value), subtotal);
    }
  }

  const finalTotal = Math.max(0, subtotal + deliveryFee - discount);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateInputs = () => {
    if (!formData.firstName.trim()) {
      toast.error('First name is required.');
      return false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Please enter a valid email address.');
      return false;
    }
    if (!formData.street.trim()) {
      toast.error('Street address is required.');
      return false;
    }
    if (!formData.city.trim()) {
      toast.error('City is required.');
      return false;
    }
    if (!formData.state.trim()) {
      toast.error('State is required.');
      return false;
    }
    if (!formData.zipCode.trim() || formData.zipCode.trim().length < 5) {
      toast.error('Please enter a valid PIN / Zip code.');
      return false;
    }
    if (!formData.phone.trim() || formData.phone.trim().replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return false;
    }
    return true;
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    if (subtotal === 0) {
      toast.error('Your cart is empty.');
      navigate('/cart');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip_code: formData.zipCode.trim(),
        country: formData.country.trim() || 'India',
        promo_code: promoCode ? promoCode.code : '',
      };

      const res = await orderAPI.createOrder(payload);
      if (res.data && res.data.success) {
        const orderData = res.data;
        const rzpConfig = orderData.razorpay;

        // Check if real Razorpay standard SDK can launch
        const hasValidKey =
          window.Razorpay &&
          rzpConfig.key_id &&
          !rzpConfig.key_id.startsWith('rzp_test_placeholder') &&
          !rzpConfig.key_id.startsWith('rzp_test_cravekart_demo') &&
          !rzpConfig.is_simulation;

        if (hasValidKey) {
          const options = {
            key: rzpConfig.key_id,
            amount: rzpConfig.amount,
            currency: rzpConfig.currency,
            name: 'CraveKart',
            description: 'Every craving, delivered.',
            order_id: rzpConfig.order_id,
            handler: async function (response) {
              await verifyAndCompleteOrder({
                order_id: orderData.order_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
            },
            prefill: {
              name: `${formData.firstName} ${formData.lastName}`.trim(),
              email: formData.email,
              contact: formData.phone,
            },
            theme: {
              color: '#FF6347',
            },
          };
          const razorpayInstance = new window.Razorpay(options);
          razorpayInstance.on('payment.failed', function (failRes) {
            toast.error(failRes.error.description || 'Payment failed. Please try again.');
          });
          razorpayInstance.open();
        } else {
          // Open interactive Razorpay Test Modal Simulator
          setRazorpayModal({
            order_id: orderData.order_id,
            razorpay_order_id: rzpConfig.order_id,
            amount: rzpConfig.amount,
            currency: rzpConfig.currency,
            total_inr: orderData.order_summary.total_amount,
          });
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(err.response?.data?.message || 'Could not initiate checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndCompleteOrder = async (verificationPayload) => {
    try {
      const verifyRes = await orderAPI.verifyPayment(verificationPayload);
      if (verifyRes.data && verifyRes.data.success) {
        toast.success('Payment verified successfully! Your order is being prepared.');
        setRazorpayModal(null);
        await fetchCart(); // Clears customer cart
        navigate('/myorders');
      } else {
        toast.error('Payment verification failed.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      toast.error(err.response?.data?.message || 'Payment verification failed.');
    }
  };

  const handleSimulatedPaymentSuccess = async () => {
    if (!razorpayModal) return;
    const paymentId = 'pay_sim_' + Math.random().toString(36).substring(2, 10);
    const signature = 'sig_sim_' + Math.random().toString(36).substring(2, 15);

    await verifyAndCompleteOrder({
      order_id: razorpayModal.order_id,
      razorpay_order_id: razorpayModal.razorpay_order_id,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    });
  };

  return (
    <div className="place-order animate-fade-in">
      <form onSubmit={handleCheckoutSubmit} className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input
            name="firstName"
            value={formData.firstName}
            onChange={onChangeHandler}
            type="text"
            placeholder="First name"
            required
          />
          <input
            name="lastName"
            value={formData.lastName}
            onChange={onChangeHandler}
            type="text"
            placeholder="Last name"
          />
        </div>
        <input
          name="email"
          value={formData.email}
          onChange={onChangeHandler}
          type="email"
          placeholder="Email address"
          required
        />
        <input
          name="street"
          value={formData.street}
          onChange={onChangeHandler}
          type="text"
          placeholder="Street / House Address"
          required
        />
        <div className="multi-fields">
          <input
            name="city"
            value={formData.city}
            onChange={onChangeHandler}
            type="text"
            placeholder="City"
            required
          />
          <input
            name="state"
            value={formData.state}
            onChange={onChangeHandler}
            type="text"
            placeholder="State"
            required
          />
        </div>
        <div className="multi-fields">
          <input
            name="zipCode"
            value={formData.zipCode}
            onChange={onChangeHandler}
            type="text"
            placeholder="Zip code / PIN"
            required
          />
          <input
            name="country"
            value={formData.country}
            onChange={onChangeHandler}
            type="text"
            placeholder="Country"
            required
          />
        </div>
        <input
          name="phone"
          value={formData.phone}
          onChange={onChangeHandler}
          type="text"
          placeholder="Phone (10 digits)"
          required
        />
      </form>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>₹{Math.round(subtotal)}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>₹{deliveryFee}</p>
            </div>
            <hr />
            {discount > 0 && (
              <>
                <div className="cart-total-details" style={{ color: '#2e7d32', fontWeight: 500 }}>
                  <p>Discount ({promoCode?.code})</p>
                  <p>-₹{Math.round(discount)}</p>
                </div>
                <hr />
              </>
            )}
            <div className="cart-total-details" style={{ fontSize: '18px', fontWeight: 700, color: '#262626' }}>
              <b>Total</b>
              <b style={{ color: '#FF6347' }}>₹{Math.round(finalTotal)}</b>
            </div>
          </div>
          <button type="button" onClick={handleCheckoutSubmit} disabled={loading}>
            {loading ? 'INITIALIZING PAYMENT...' : 'PROCEED TO PAYMENT'}
          </button>

          <div className="payment-badges">
            <span><ShieldCheck size={16} color="#2e7d32" /> Razorpay Secured</span>
            <span><Smartphone size={16} color="#333" /> UPI / Cards</span>
          </div>
        </div>
      </div>

      {/* Razorpay Test Checkout Modal (Test Mode Simulator) */}
      {razorpayModal && (
        <div className="razorpay-sim-modal">
          <div className="razorpay-sim-card">
            <div className="razorpay-sim-header">
              <h3>
                <CreditCard size={20} /> Razorpay Checkout
              </h3>
              <span className="tag">Test Mode</span>
            </div>

            <div className="razorpay-sim-body">
              <div className="sim-amount-banner">
                <div>
                  <span>Paying CraveKart</span>
                  <div style={{ fontSize: '12px', color: '#888' }}>Order #{razorpayModal.order_id}</div>
                </div>
                <strong>₹{Math.round(Number(razorpayModal.total_inr))}</strong>
              </div>

              <div className="sim-methods">
                <div
                  className={`sim-method-item ${selectedMethod === 'UPI' ? 'active' : ''}`}
                  onClick={() => setSelectedMethod('UPI')}
                >
                  <Smartphone size={18} color="#FF6347" />
                  <span>UPI (Google Pay, PhonePe, Paytm, BHIM)</span>
                  {selectedMethod === 'UPI' && <CheckCircle size={16} color="#3399cc" style={{ marginLeft: 'auto' }} />}
                </div>

                <div
                  className={`sim-method-item ${selectedMethod === 'Cards' ? 'active' : ''}`}
                  onClick={() => setSelectedMethod('Cards')}
                >
                  <CreditCard size={18} color="#FF6347" />
                  <span>Credit / Debit Cards (Visa, MasterCard, RuPay)</span>
                  {selectedMethod === 'Cards' && <CheckCircle size={16} color="#3399cc" style={{ marginLeft: 'auto' }} />}
                </div>

                <div
                  className={`sim-method-item ${selectedMethod === 'NetBanking' ? 'active' : ''}`}
                  onClick={() => setSelectedMethod('NetBanking')}
                >
                  <ShieldCheck size={18} color="#FF6347" />
                  <span>Net Banking (All Indian Banks)</span>
                  {selectedMethod === 'NetBanking' && <CheckCircle size={16} color="#3399cc" style={{ marginLeft: 'auto' }} />}
                </div>
              </div>

              <div className="sim-actions">
                <button
                  type="button"
                  className="sim-btn-pay"
                  onClick={handleSimulatedPaymentSuccess}
                >
                  Pay ₹{Math.round(Number(razorpayModal.total_inr))}
                </button>
                <button
                  type="button"
                  className="sim-btn-cancel"
                  onClick={() => {
                    setRazorpayModal(null);
                    toast.info('Payment cancelled.');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceOrder;
