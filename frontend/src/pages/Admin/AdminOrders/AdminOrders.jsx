import React, { useEffect, useState } from 'react';
import './AdminOrders.css';
import { adminAPI } from '../../../services/api';
import { toast } from 'react-toastify';
import { Package, RefreshCw } from 'lucide-react';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getOrders();
      if (res.data && res.data.orders) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      toast.error('Failed to load orders. Please ensure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const handleStatusChange = async (e, orderId) => {
    const newStatus = e.target.value;
    try {
      const res = await adminAPI.updateOrderStatus(orderId, newStatus);
      if (res.data && res.data.success) {
        toast.success(res.data.message || `Order #${orderId} status updated to '${newStatus}'!`);
        // Update local order state immediately
        setOrders((prev) =>
          prev.map((ord) => (ord.id === orderId ? { ...ord, order_status: newStatus } : ord))
        );
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('Could not update order status.');
      fetchAllOrders();
    }
  };

  return (
    <div className="admin-orders">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Order Page</h3>
        <button
          onClick={fetchAllOrders}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#49557e', fontSize: '13px' }}
        >
          <RefreshCw size={15} /> Refresh Orders
        </button>
      </div>

      <div className="order-list">
        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
            Loading customer orders...
          </p>
        ) : orders.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
            No customer orders placed yet.
          </p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-item">
              <div className="order-item-icon">
                <Package size={28} />
              </div>

              <div>
                <p className="order-item-food">
                  {order.items_summary ||
                    order.items?.map((item, idx) => {
                      if (idx === order.items.length - 1) {
                        return `${item.food_name_snapshot} x ${item.quantity}`;
                      } else {
                        return `${item.food_name_snapshot} x ${item.quantity}, `;
                      }
                    })}
                </p>

                <p className="order-item-name">
                  {order.first_name} {order.last_name}
                </p>

                <div className="order-item-address">
                  <p>{order.street},</p>
                  <p>
                    {order.city}, {order.state}, {order.zip_code}, {order.country}
                  </p>
                </div>

                <p className="order-item-phone">{order.phone}</p>
              </div>

              <p className="order-item-count">
                Items: {order.total_items_count || order.items?.reduce((s, i) => s + i.quantity, 0)}
              </p>

              <div>
                <p className="order-item-price">₹{Math.round(Number(order.total_amount))}</p>
                <div className="order-item-payment">
                  <span style={{ color: order.payment_status === 'Paid' ? '#2e7d32' : '#d32f2f', fontWeight: 600 }}>
                    {order.payment_status}
                  </span>{' '}
                  ({order.payment_method})
                </div>
              </div>

              <select
                value={order.order_status}
                onChange={(e) => handleStatusChange(e, order.id)}
              >
                <option value="Food Processing">Food Processing</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
