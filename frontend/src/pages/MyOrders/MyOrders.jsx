import React, { useEffect, useState, useContext } from 'react';
import './MyOrders.css';
import { StoreContext } from '../../context/StoreContext';
import { orderAPI } from '../../services/api';
import { Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TrackOrderModal from '../../components/TrackOrderModal/TrackOrderModal';

const MyOrders = () => {
  const { token } = useContext(StoreContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await orderAPI.getUserOrders();
      if (res.data && res.data.orders) {
        setData(res.data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch user orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [token]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'Out for Delivery':
        return 'out-for-delivery';
      case 'Delivered':
        return 'delivered';
      case 'Cancelled':
        return 'cancelled';
      case 'Food Processing':
      default:
        return 'processing';
    }
  };

  if (!token) {
    return (
      <div className="my-orders no-orders animate-fade-in">
        <h3>Please log in to view your orders</h3>
        <p>Sign in to your CraveKart account to see order history and track deliveries.</p>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="my-orders animate-fade-in">
      <h2>My Orders</h2>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
          Loading your CraveKart orders...
        </p>
      ) : data.length === 0 ? (
        <div className="no-orders">
          <h3>No orders placed yet</h3>
          <p>You haven't ordered any meals yet. Explore our delicious dishes now!</p>
          <button onClick={() => navigate('/')}>Order Now</button>
        </div>
      ) : (
        <div className="container">
          {data.map((order) => (
            <div key={order.id} className="my-orders-order">
              <div className="parcel-icon">
                <Package size={26} />
              </div>

              <p style={{ fontWeight: 500, color: '#333' }}>
                {order.items_summary ||
                  order.items?.map((item) => `${item.food_name_snapshot} x ${item.quantity}`).join(', ')}
              </p>

              <p style={{ fontWeight: 600, color: '#FF6347', fontSize: '16px' }}>
                ₹{Math.round(Number(order.total_amount))}
              </p>

              <p style={{ color: '#666' }}>
                Items: {order.total_items_count || order.items?.reduce((s, i) => s + i.quantity, 0)}
              </p>

              <div className="order-status-badge">
                <span className={`status-dot ${getStatusClass(order.order_status)}`}></span>
                <b style={{ color: '#262626' }}>{order.order_status}</b>
              </div>

              <button onClick={() => setSelectedOrder(order)}>
                Track Order
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <TrackOrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

export default MyOrders;
