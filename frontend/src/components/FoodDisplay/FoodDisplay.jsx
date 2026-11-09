import React, { useContext } from 'react';
import './FoodDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import FoodItem from '../FoodItem/FoodItem';

const FoodDisplay = () => {
  const { foodList, loadingFoods, category, searchQuery, setSearchQuery, setCategory } = useContext(StoreContext);

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

      {loadingFoods ? (
        <div className="food-loading-skeleton">
          <p>Loading mouthwatering dishes from CraveKart kitchen...</p>
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
