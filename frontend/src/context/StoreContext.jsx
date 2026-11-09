import React, { createContext, useState, useEffect, useCallback } from 'react';
import { foodAPI, cartAPI, authAPI } from '../services/api';
import { toast } from 'react-toastify';

export const StoreContext = createContext(null);

export const StoreContextProvider = ({ children }) => {
  const [foodList, setFoodList] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [cartDetails, setCartDetails] = useState({ subtotal: '0.00', item_count: 0, items: [] });
  const [loadingFoods, setLoadingFoods] = useState(true);

  // Authentication states
  const [token, setToken] = useState(localStorage.getItem('cravekart_user_token') || '');
  const [user, setUser] = useState(null);

  const [adminToken, setAdminToken] = useState(localStorage.getItem('cravekart_admin_token') || '');
  const [adminUser, setAdminUser] = useState(null);

  // UI modals & filters
  const [showLogin, setShowLogin] = useState(false);
  const [loginState, setLoginState] = useState('Login'); // 'Login' or 'Sign Up'
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [promoCode, setPromoCode] = useState(null);

  // 1. Fetch Food List from backend
  const fetchFoodList = useCallback(async () => {
    try {
      setLoadingFoods(true);
      const res = await foodAPI.getFoods();
      if (res.data && res.data.foods) {
        setFoodList(res.data.foods);
      }
    } catch (err) {
      console.error('Failed to fetch food items:', err);
    } finally {
      setLoadingFoods(false);
    }
  }, []);

  // 2. Fetch Cart from backend
  const fetchCart = useCallback(async () => {
    try {
      const res = await cartAPI.getCart();
      if (res.data && res.data.cart) {
        setCartDetails(res.data.cart);
        // Build cartItems map { [foodId]: quantity }
        const itemMap = {};
        res.data.cart.items.forEach((item) => {
          if (item.food && item.food.id) {
            itemMap[item.food.id] = item.quantity;
          }
        });
        setCartItems(itemMap);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  }, []);

  // 3. Fetch User profile if token exists
  const fetchUserProfile = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const res = await authAPI.getProfile();
      setUser(res.data);
    } catch (err) {
      // Token might be expired or invalid
      console.warn('User profile fetch failed, token may be expired:', err);
      localStorage.removeItem('cravekart_user_token');
      setToken('');
      setUser(null);
    }
  }, [token]);

  // Initial loads
  useEffect(() => {
    fetchFoodList();
    fetchCart();
    fetchUserProfile();
  }, [fetchFoodList, fetchCart, fetchUserProfile]);

  // Add to Cart
  const addToCart = async (foodId) => {
    // Optimistic UI update
    setCartItems((prev) => ({
      ...prev,
      [foodId]: (prev[foodId] || 0) + 1,
    }));

    try {
      const res = await cartAPI.addToCart(foodId, 1);
      if (res.data && res.data.cart) {
        setCartDetails(res.data.cart);
      }
    } catch (err) {
      console.error('Add to cart failed:', err);
      toast.error('Could not add item to cart. Please try again.');
      // Revert from server
      fetchCart();
    }
  };

  // Remove from Cart
  const removeFromCart = async (foodId) => {
    const currentQty = cartItems[foodId] || 0;
    if (currentQty <= 0) return;

    const newQty = currentQty - 1;
    setCartItems((prev) => {
      const updated = { ...prev };
      if (newQty <= 0) {
        delete updated[foodId];
      } else {
        updated[foodId] = newQty;
      }
      return updated;
    });

    try {
      const res = await cartAPI.updateCart(foodId, newQty);
      if (res.data && res.data.cart) {
        setCartDetails(res.data.cart);
      }
    } catch (err) {
      console.error('Update cart failed:', err);
      fetchCart();
    }
  };

  // Clear single item completely from cart
  const deleteFromCart = async (foodId) => {
    setCartItems((prev) => {
      const updated = { ...prev };
      delete updated[foodId];
      return updated;
    });

    try {
      const res = await cartAPI.removeFromCart(foodId);
      if (res.data && res.data.cart) {
        setCartDetails(res.data.cart);
      }
      toast.info('Item removed from cart');
    } catch (err) {
      console.error('Delete from cart failed:', err);
      fetchCart();
    }
  };

  // Calculate Subtotal
  const getTotalCartAmount = () => {
    let total = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        const itemInfo = foodList.find((product) => String(product.id) === String(item));
        if (itemInfo) {
          total += Number(itemInfo.price) * cartItems[item];
        }
      }
    }
    return total;
  };

  // Get total count of cart items
  const getTotalCartCount = () => {
    return Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  };

  // Customer Authentication handlers
  const handleUserLogin = (userToken, userData) => {
    localStorage.setItem('cravekart_user_token', userToken);
    setToken(userToken);
    setUser(userData);
    setShowLogin(false);
    fetchCart(); // Merges guest cart with user cart on server
  };

  const handleUserLogout = () => {
    localStorage.removeItem('cravekart_user_token');
    setToken('');
    setUser(null);
    setPromoCode(null);
    toast.info('Logged out successfully.');
    fetchCart();
  };

  // Admin Authentication handlers
  const handleAdminLogin = (admToken, admData) => {
    localStorage.setItem('cravekart_admin_token', admToken);
    setAdminToken(admToken);
    setAdminUser(admData);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('cravekart_admin_token');
    setAdminToken('');
    setAdminUser(null);
    toast.info('Admin logged out.');
  };

  const contextValue = {
    foodList,
    loadingFoods,
    fetchFoodList,
    cartItems,
    cartDetails,
    addToCart,
    removeFromCart,
    deleteFromCart,
    getTotalCartAmount,
    getTotalCartCount,
    fetchCart,
    token,
    user,
    handleUserLogin,
    handleUserLogout,
    adminToken,
    adminUser,
    handleAdminLogin,
    handleAdminLogout,
    showLogin,
    setShowLogin,
    loginState,
    setLoginState,
    category,
    setCategory,
    searchQuery,
    setSearchQuery,
    promoCode,
    setPromoCode,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
};
