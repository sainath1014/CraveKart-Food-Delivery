import React, { useContext } from 'react';
import './ExploreMenu.css';
import { menu_list } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';

const ExploreMenu = () => {
  const { category, setCategory } = useContext(StoreContext);

  return (
    <div className="explore-menu" id="explore-menu">
      <h1>Explore our menu</h1>
      <p className="explore-menu-text">
        Choose from a diverse menu featuring a delectable array of dishes. Our mission is to satisfy your cravings and elevate your dining experience, one delicious meal at a time.
      </p>

      <div className="explore-menu-list">
        {/* All option */}
        <div
          onClick={() => setCategory('All')}
          className="explore-menu-list-item"
        >
          <div
            className={`all-pill ${category === 'All' ? 'active' : ''}`}
            style={{
              width: '7.5vw',
              minWidth: '80px',
              height: '7.5vw',
              minHeight: '80px',
              borderRadius: '50%',
              backgroundColor: category === 'All' ? '#FF6347' : '#f5f5f5',
              color: category === 'All' ? '#ffffff' : '#49557e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '16px',
              border: category === 'All' ? '4px solid #FF6347' : '1px solid #e2e2e2',
              boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
            }}
          >
            All
          </div>
          <p style={{ color: category === 'All' ? '#FF6347' : '#747474', fontWeight: category === 'All' ? '600' : '500' }}>
            All
          </p>
        </div>

        {menu_list.map((item, index) => {
          const isSelected = category.toLowerCase() === item.menu_name.toLowerCase();
          return (
            <div
              key={index}
              onClick={() => setCategory(prev => prev.toLowerCase() === item.menu_name.toLowerCase() ? 'All' : item.menu_name)}
              className="explore-menu-list-item"
            >
              <img
                className={isSelected ? 'active' : ''}
                src={item.menu_image}
                alt={item.menu_name}
              />
              <p style={{ color: isSelected ? '#FF6347' : '#747474', fontWeight: isSelected ? '600' : '500' }}>
                {item.menu_name}
              </p>
            </div>
          );
        })}
      </div>
      <hr />
    </div>
  );
};

export default ExploreMenu;
