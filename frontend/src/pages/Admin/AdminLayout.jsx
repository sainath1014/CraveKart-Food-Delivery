import React, { useContext } from 'react';
import './AdminLayout.css';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import { PlusCircle, List, ClipboardList, LogOut, ArrowLeft, User } from 'lucide-react';

const AdminLayout = () => {
  const { adminToken, adminUser, handleAdminLogout } = useContext(StoreContext);
  const navigate = useNavigate();

  return (
    <div className="admin-layout animate-fade-in">
      {/* Top Navbar */}
      <div className="admin-navbar">
        <div className="admin-nav-logo" onClick={() => navigate('/admin')}>
          <h2>CraveKart.</h2>
          <span>Admin Panel</span>
        </div>

        <div className="admin-nav-right">
          <Link to="/" className="admin-store-link">
            <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Customer Store
          </Link>

          <div className="admin-profile-img" title={adminUser?.name || 'Administrator'}>
            {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : <User size={20} />}
          </div>

          <button
            className="admin-logout-btn"
            onClick={() => {
              handleAdminLogout();
              navigate('/admin/login');
            }}
          >
            <LogOut size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Body with Sidebar & View Area */}
      <div className="admin-content">
        <div className="admin-sidebar">
          <div className="admin-sidebar-options">
            <NavLink
              to="/admin/add"
              className={({ isActive }) => `admin-sidebar-option ${isActive ? 'active' : ''}`}
            >
              <PlusCircle size={20} />
              <span>Add Items</span>
            </NavLink>

            <NavLink
              to="/admin/list"
              className={({ isActive }) => `admin-sidebar-option ${isActive ? 'active' : ''}`}
            >
              <List size={20} />
              <span>List Items</span>
            </NavLink>

            <NavLink
              to="/admin/orders"
              className={({ isActive }) => `admin-sidebar-option ${isActive ? 'active' : ''}`}
            >
              <ClipboardList size={20} />
              <span>Orders</span>
            </NavLink>
          </div>
        </div>

        <div className="admin-main-view">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
