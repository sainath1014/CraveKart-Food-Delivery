import React, { useState, useContext } from 'react';
import './AdminLogin.css';
import { StoreContext } from '../../../context/StoreContext';
import { authAPI } from '../../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { handleAdminLogin } = useContext(StoreContext);
  const navigate = useNavigate();

  const handleDemoFill = () => {
    setEmail('admin@cravekart.com');
    setPassword('AdminPassword@123');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authAPI.adminLogin({
        email: email.trim(),
        password: password,
      });

      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Welcome to CraveKart Admin Panel!');
        handleAdminLogin(res.data.tokens.access, res.data.user);
        navigate('/admin/add');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      const msg =
        err.response?.data?.message ||
        'Access denied: Invalid administrator credentials or permissions.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1>CraveKart.</h1>
          <span>Staff & Admin Portal</span>
          <p>Sign in to manage foods, orders, and customer operations</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-input-group">
            <label>Admin Email</label>
            <input
              type="email"
              placeholder="admin@cravekart.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="admin-input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="admin-login-btn" disabled={loading}>
            <ShieldCheck size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {loading ? 'Authenticating...' : 'Sign In as Administrator'}
          </button>
        </form>

        <div className="admin-demo-box">
          <p><strong>Demo Administrator:</strong> admin@cravekart.com</p>
          <button type="button" onClick={handleDemoFill}>
            Auto-fill Admin Credentials
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/" style={{ color: '#666', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={14} /> Back to Customer Store
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
