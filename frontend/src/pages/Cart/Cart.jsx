import React, { useContext, useState } from 'react';
import './Cart.css';
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { promoAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { X, Plus, Minus, Tag } from 'lucide-react';

const Cart = () => {
  const {
    cartItems,
    foodList,
    removeFromCart,
    addToCart,
    deleteFromCart,
    getTotalCartAmount,
    promoCode,
    setPromoCode,
    token,
    setShowLogin,
    setLoginState
  } = useContext(StoreContext);

  const [promoInput, setPromoInput] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const navigate = useNavigate();

  const subtotal = getTotalCartAmount();
  const deliveryFee = subtotal === 0 ? 0 : 40;

  // Calculate discount based on active promo
  let discount = 0;
  if (promoCode && subtotal > 0) {
    if (promoCode.discount_type === 'percentage') {
      discount = (subtotal * Number(promoCode.discount_value)) / 100;
    } else {
      discount = Math.min(Number(promoCode.discount_value), subtotal);
    }
  }

  const finalTotal = Math.max(0, subtotal + deliveryFee - discount);

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!promoInput.trim()) {
      toast.warning('Please enter a promo code.');
      return;
    }
    if (subtotal === 0) {
      toast.warning('Add items to your cart before applying a promo code.');
      return;
    }

    setValidatingPromo(true);
    try {
      const res = await promoAPI.validate(promoInput.trim(), subtotal);
      if (res.data && res.data.success) {
        setPromoCode(res.data.promo);
        toast.success(res.data.message);
        setPromoInput('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid promo code');
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (subtotal === 0) {
      toast.warning('Your cart is empty. Please add items to checkout.');
      return;
    }
    if (!token) {
      toast.info('Please sign in or create an account to complete your delivery.');
      setLoginState('Login');
      setShowLogin(true);
      return;
    }
    navigate('/order');
  };

  if (subtotal === 0) {
    return (
      <div className="cart cart-empty animate-fade-in">
        <h2>Your CraveKart cart is empty</h2>
        <p>Looks like you haven't added anything to your cart yet.</p>
        <button onClick={() => navigate('/')}>Explore Food Menu</button>
      </div>
    );
  }

  return (
    <div className="cart animate-fade-in">
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />

        {foodList.map((item) => {
          if (cartItems[item.id] > 0) {
            const itemTotal = Number(item.price) * cartItems[item.id];
            return (
              <div key={item.id}>
                <div className="cart-items-title cart-items-item">
                  <img src={item.display_image || item.image_url} alt={item.name} />
                  <p style={{ fontWeight: 500 }}>{item.name}</p>
                  <p>₹{Math.round(Number(item.price))}</p>
                  <div className="cart-quantity-controls">
                    <div className="cart-qty-btn" onClick={() => removeFromCart(item.id)}>
                      <Minus size={12} />
                    </div>
                    <span>{cartItems[item.id]}</span>
                    <div className="cart-qty-btn" onClick={() => addToCart(item.id)}>
                      <Plus size={12} />
                    </div>
                  </div>
                  <p style={{ fontWeight: 600, color: '#FF6347' }}>₹{Math.round(itemTotal)}</p>
                  <p onClick={() => deleteFromCart(item.id)} className="cross" title="Remove item">
                    <X size={18} />
                  </p>
                </div>
                <hr />
              </div>
            );
          }
          return null;
        })}
      </div>

      <div className="cart-bottom">
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
          <button onClick={handleProceedToCheckout}>
            PROCEED TO CHECKOUT
          </button>
        </div>

        <div className="cart-promocode">
          <div>
            <p>If you have a promo code, Enter it here</p>
            {promoCode ? (
              <div className="promo-applied-badge">
                <span>
                  <Tag size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Coupon <strong>{promoCode.code}</strong> applied (-₹{Math.round(discount)})
                </span>
                <button type="button" onClick={() => setPromoCode(null)}>Remove</button>
              </div>
            ) : (
              <form onSubmit={handleApplyPromo} className="cart-promocode-input">
                <input
                  type="text"
                  placeholder="promo code (e.g. CRAVE50)"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                />
                <button type="submit" disabled={validatingPromo}>
                  {validatingPromo ? 'Checking...' : 'Submit'}
                </button>
              </form>
            )}
            <p style={{ fontSize: '12px', color: '#888', marginTop: 8 }}>
              Try <strong>CRAVE50</strong> for ₹50 off or <strong>FIRSTORDER</strong> for 20% off!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
