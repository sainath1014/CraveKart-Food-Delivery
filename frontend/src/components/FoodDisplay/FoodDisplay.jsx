import React, { useContext } from 'react';
import './FoodDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import FoodItem from '../FoodItem/FoodItem';
import { Clock, RefreshCw, AlertCircle } from 'lucide-react';

const SKELETON_COUNT = 8;

const FoodDisplay = () => {
  const {
    foodList,
    loadingFoods,
    foodError,
    backendWakingUp,
    fetchFoodList,
    category,
    searchQuery,
    setSearchQuery,
    setCategory,
  } = useContext(StoreContext);

  // Filter foods by Category and Search Query
  const filteredFoods = foodList.filter((item) => {
    // 1. Category match
    const categoryMatch =
      category === 'All' ||
      item.category.toLowerCase() === category.toLowerCase() ||
      (category.toLowerCase() === 'desserts' && item.category.toLowerCase() === 'deserts') ||
      (category.toLowerCase() === 'deserts' && item.category.toLowerCase() === 'desserts');

    // 2. Search query match
    const query = searchQuery.trim().toLowerCase();
    const searchMatch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query));

    return categoryMatch && searchMatch;
  });

  return (
    <div className="food-display" id="food-display">
      <h2>Top dishes near you</h2>

      {loadingFoods && foodList.length === 0 ? (
        <div className="food-loading-container" aria-busy="true" aria-live="polite">
          {backendWakingUp && (
            <div className="food-wakeup-banner">
              <Clock size={18} className="wakeup-icon" />
              <div className="wakeup-text">
                <strong>Waking up CraveKart&apos;s kitchen server...</strong>
                <span>
                  Our backend runs on Render Free tier, so the first load after inactivity can take 30–40 seconds. Your menu will appear automatically.
                </span>
              </div>
            </div>
          )}

          <div className="food-display-list">
            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <div className="food-skeleton-card" key={index}>
                <div className="skeleton-shimmer skeleton-img" />
                <div className="food-skeleton-info">
                  <div className="food-skeleton-header">
                    <div className="skeleton-shimmer skeleton-title" />
                    <div className="skeleton-shimmer skeleton-stars" />
                  </div>
                  <div className="skeleton-shimmer skeleton-line" />
                  <div className="skeleton-shimmer skeleton-line short" />
                  <div className="skeleton-shimmer skeleton-price" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : foodError && foodList.length === 0 ? (
        <div className="food-error-state" role="alert">
          <AlertCircle size={36} color="#FF6347" />
          <h3>Could not load the menu</h3>
          <p>{foodError}</p>
          <button
            type="button"
            className="food-retry-btn"
            onClick={() => fetchFoodList({ force: true, silent: false })}
          >
            <RefreshCw size={16} />
            Retry Loading Menu
          </button>
        </div>
      ) : filteredFoods.length === 0 ? (
        <div className="food-display-empty">
          <h3>No matching food items found</h3>
          <p>
            {searchQuery
              ? `We couldn't find anything matching "${searchQuery}". Try searching for salad, rolls, noodles or cake!`
              : `No dishes available in the ${category} category right now.`}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategory('All');
            }}
          >
            Show All Dishes
          </button>
        </div>
      ) : (
        <div className="food-display-list">
          {filteredFoods.map((item) => (
            <FoodItem
              key={item.id}
              id={item.id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.display_image || item.image_url}
              rating={item.rating}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodDisplay;
