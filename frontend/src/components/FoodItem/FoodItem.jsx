import React, { useContext } from 'react';
import './FoodItem.css';
import { StoreContext } from '../../context/StoreContext';
import { Star, Plus, Minus } from 'lucide-react';

const FoodItem = ({ id, name, price, description, image, rating }) => {
  const { cartItems, addToCart, removeFromCart } = useContext(StoreContext);
  const itemCount = cartItems[id] || 0;

  // Render 5 stars based on rating
  const renderStars = () => {
    const stars = [];
    const numRating = Math.round(Number(rating) || 5);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          fill={i <= numRating ? '#FF6347' : 'none'}
          color="#FF6347"
        />
      );
    }
    return stars;
  };

  return (
    <div className="food-item">
      <div className="food-item-img-container">
        <img
          className="food-item-image"
          src={image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
          alt={name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
          }}
        />

        {!itemCount ? (
          <div
            className="add-btn-white"
            onClick={() => addToCart(id)}
            title="Add to cart"
          >
            <Plus size={20} color="#2e7d32" strokeWidth={2.8} />
          </div>
        ) : (
          <div className="food-item-counter">
            <div
              className="counter-btn minus"
              onClick={() => removeFromCart(id)}
              title="Decrease quantity"
            >
              <Minus size={15} strokeWidth={2.8} />
            </div>
            <p>{itemCount}</p>
            <div
              className="counter-btn plus"
              onClick={() => addToCart(id)}
              title="Increase quantity"
            >
              <Plus size={15} strokeWidth={2.8} />
            </div>
          </div>
        )}
      </div>

      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p title={name}>{name}</p>
          <div className="food-item-stars">{renderStars()}</div>
        </div>
        <p className="food-item-desc">{description || 'Food provides essential nutrients for overall health and well-being.'}</p>
        <p className="food-item-price">₹{Math.round(Number(price))}</p>
      </div>
    </div>
  );
};

export default FoodItem;
