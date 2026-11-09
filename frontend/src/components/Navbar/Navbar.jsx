import React, { useState, useContext, useRef, useEffect } from 'react';
import './Navbar.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import { Search, ShoppingBag, User as UserIcon, Package, LogOut, Shield } from 'lucide-react';

const Navbar = () => {
  const [menu, setMenu] = useState('home');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { getTotalCartCount, token, user, handleUserLogout, setShowLogin, setLoginState, searchQuery, setSearchQuery } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (sectionId, menuName) => {
    setMenu(menuName);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="navbar">
      <Link to="/" onClick={() => setMenu('home')}>
        <div className="logo">CraveKart<span>.</span></div>
      </Link>

      <ul className="navbar-menu">
        <li onClick={() => { setMenu('home'); navigate('/'); }} className={menu === 'home' && location.pathname === '/' ? 'active' : ''}>
          home
        </li>
        <li onClick={() => handleNavClick('explore-menu', 'menu')} className={menu === 'menu' ? 'active' : ''}>
          menu
        </li>
        <li onClick={() => handleNavClick('app-download', 'mobile-app')} className={menu === 'mobile-app' ? 'active' : ''}>
          mobile app
        </li>
        <li onClick={() => handleNavClick('footer', 'contact-us')} className={menu === 'contact-us' ? 'active' : ''}>
          contact us
        </li>
      </ul>

      <div className="navbar-right">
        {/* Search Input Bar */}
        <div className="navbar-search-box">
          <Search size={18} color="#49557e" />
          <input
            type="text"
            placeholder="Search food..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (location.pathname !== '/') navigate('/');
            }}
          />
        </div>

        {/* Cart Icon */}
        <div className="navbar-cart-icon" onClick={() => navigate('/cart')}>
          <ShoppingBag size={24} />
          {getTotalCartCount() > 0 && (
            <div className="cart-badge">{getTotalCartCount()}</div>
          )}
        </div>

        {/* User Account / Sign In */}
        {!token ? (
          <button
            className="navbar-signin-btn"
            onClick={() => {
              setLoginState('Login');
              setShowLogin(true);
            }}
          >
            sign in
          </button>
        ) : (
          <div className="navbar-profile" ref={dropdownRef} onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="navbar-profile-icon">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={20} />}
            </div>

            {dropdownOpen && (
              <ul className="nav-profile-dropdown">
                <li onClick={() => { navigate('/myorders'); setDropdownOpen(false); }}>
                  <Package size={18} color="#FF6347" />
                  <span>Orders</span>
                </li>
                {user?.is_staff && (
                  <>
                    <hr />
                    <li onClick={() => { navigate('/admin/dashboard'); setDropdownOpen(false); }}>
                      <Shield size={18} color="#FF6347" />
                      <span>Admin Panel</span>
                    </li>
                  </>
                )}
                <hr />
                <li onClick={() => { handleUserLogout(); setDropdownOpen(false); }}>
                  <LogOut size={18} color="#FF6347" />
                  <span>Logout</span>
                </li>
              </ul>
            )}
          </div>
        )}

        {/* Admin Quick Switch Pill */}
        <Link to="/admin" className="admin-link-pill" title="Go to CraveKart Admin Panel">
          Admin
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
