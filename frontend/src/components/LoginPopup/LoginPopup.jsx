import React, { useState, useContext } from 'react';
import './LoginPopup.css';
import { StoreContext } from '../../context/StoreContext';
import { authAPI } from '../../services/api';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';

const LoginPopup = () => {
  const { setShowLogin, loginState, setLoginState, handleUserLogin } = useContext(StoreContext);

  const [data, setData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
  });

  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const fillDemoCustomer = () => {
    setData({
      name: 'Avinash Kumar',
      email: 'customer@example.com',
      password: 'CustomerPassword@123',
      confirm_password: 'CustomerPassword@123'
    });
    setLoginState('Login');
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!agreeTerms) {
      toast.warning('Please accept the terms of use & privacy policy to continue.');
      return;
    }

    if (loginState === 'Sign Up') {
      if (!data.name.trim()) {
        toast.error('Please enter your full name.');
        return;
      }
      if (data.password.length < 6) {
        toast.error('Please enter a strong password (minimum 6 characters).');
        return;
      }
      if (data.confirm_password && data.password !== data.confirm_password) {
        toast.error('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (loginState === 'Login') {
        const res = await authAPI.login({
          email: data.email.trim(),
          password: data.password,
        });
        if (res.data && res.data.success) {
          toast.success(res.data.message || 'Logged in successfully!');
          handleUserLogin(res.data.tokens.access, res.data.user);
        }
      } else {
        const res = await authAPI.register({
          name: data.name.trim(),
          email: data.email.trim(),
          password: data.password,
          confirm_password: data.confirm_password || data.password,
        });
        if (res.data && res.data.success) {
          toast.success(res.data.message || 'Account created successfully!');
          handleUserLogin(res.data.tokens.access, res.data.user);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      const errMsg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : 'Authentication failed. Please check your details.');
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-popup">
      <form onSubmit={onSubmitHandler} className="login-popup-container">
        <div className="login-popup-title">
          <h2>{loginState}</h2>
          <div className="close-btn" onClick={() => setShowLogin(false)} title="Close">
            <X size={24} />
          </div>
        </div>

        <div className="login-popup-inputs">
          {loginState === 'Sign Up' && (
            <input
              name="name"
              onChange={onChangeHandler}
              value={data.name}
              type="text"
              placeholder="Your name"
              required
            />
          )}
          <input
            name="email"
            onChange={onChangeHandler}
            value={data.email}
            type="email"
            placeholder="Your email"
            required
          />
          <input
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder="Password"
            required
          />
          {loginState === 'Sign Up' && (
            <input
              name="confirm_password"
              onChange={onChangeHandler}
              value={data.confirm_password}
              type="password"
              placeholder="Confirm password"
              required
            />
          )}
        </div>

        <button type="submit" disabled={loading}>
          {loading
            ? 'Processing...'
            : loginState === 'Sign Up'
            ? 'Create account'
            : 'Login'}
        </button>

        <div className="login-popup-condition">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            required
          />
          <p>By continuing, i agree to the terms of use & privacy policy.</p>
        </div>

        {/* Demo Fast Fill Pill */}
        <div className="login-demo-credentials">
          <p><strong>Demo Account:</strong> customer@example.com / CustomerPassword@123</p>
          <button type="button" className="login-demo-btn" onClick={fillDemoCustomer}>
            Auto-fill Demo Credentials
          </button>
        </div>

        {loginState === 'Login' ? (
          <p>
            Create a new account?{' '}
            <span onClick={() => setLoginState('Sign Up')}>Click here</span>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <span onClick={() => setLoginState('Login')}>Login here</span>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPopup;
