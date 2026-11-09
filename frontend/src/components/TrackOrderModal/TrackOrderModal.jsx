import React from 'react';
import './TrackOrderModal.css';
import { X, Check, Clock, Truck, PackageCheck, AlertCircle } from 'lucide-react';

const TrackOrderModal = ({ order, onClose }) => {
  if (!order) return null;

  const steps = [
    { title: 'Order Placed', statusKey: 'placed' },
    { title: 'Food Processing', statusKey: 'Food Processing' },
    { title: 'Out for Delivery', statusKey: 'Out for Delivery' },
    { title: 'Delivered', statusKey: 'Delivered' },
  ];

  const getStepState = (index) => {
    const status = order.order_status;
    if (status === 'Cancelled') return 'cancelled';

    let currentIndex = 1; // Default is Food Processing
    if (status === 'Out for Delivery') currentIndex = 2;
    if (status === 'Delivered') currentIndex = 3;

    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="track-modal-overlay" onClick={onClose}>
      <div className="track-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="track-modal-header">
          <div>
            <h3>Track Order #{order.id}</h3>
            <div style={{ fontSize: '12px', color: '#888', marginTop: 4 }}>
              Placed on {new Date(order.created_at).toLocaleDateString()} at{' '}
              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <X size={22} style={{ cursor: 'pointer', color: '#666' }} onClick={onClose} />
        </div>

        {order.order_status === 'Cancelled' ? (
          <div style={{ padding: '20px', background: '#ffebee', borderRadius: '8px', color: '#c62828', textAlign: 'center', marginBottom: '20px' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 10px' }} />
            <h4 style={{ fontWeight: 700 }}>Order Cancelled</h4>
            <p style={{ fontSize: '13px' }}>This order was cancelled. If you were charged, a refund will be processed to your original payment method.</p>
          </div>
        ) : (
          <div className="track-stepper">
            {steps.map((step, idx) => {
              const state = getStepState(idx);
              return (
                <div key={idx} className={`track-step ${state}`}>
                  <div className="track-step-circle">
                    {state === 'completed' ? (
                      <Check size={18} strokeWidth={3} />
                    ) : state === 'active' ? (
                      idx === 1 ? <Clock size={18} /> : idx === 2 ? <Truck size={18} /> : <PackageCheck size={18} />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <p>{step.title}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="track-details-box">
          <h4>Delivery Address</h4>
          <p>
            <strong>{order.first_name} {order.last_name}</strong> ({order.phone})<br />
            {order.full_address || `${order.street}, ${order.city}, ${order.state} - ${order.zip_code}`}
          </p>
          <div style={{ marginTop: '10px', display: 'flex', gap: '20px', fontSize: '13px' }}>
            <span>Payment: <strong style={{ color: order.payment_status === 'Paid' ? '#2e7d32' : '#d32f2f' }}>{order.payment_status}</strong> ({order.payment_method})</span>
            {order.razorpay_payment_id && <span>Txn ID: {order.razorpay_payment_id}</span>}
          </div>
        </div>

        <div className="track-items-list">
          <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px' }}>Items in this Order</h4>
          {order.items && order.items.map((item, idx) => (
            <div key={idx} className="track-item-row">
              <span>{item.food_name_snapshot} × {item.quantity}</span>
              <strong>₹{Math.round(Number(item.item_total))}</strong>
            </div>
          ))}
          <div className="track-item-row" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #ccc', fontWeight: 700, fontSize: '15px' }}>
            <span>Total Paid</span>
            <span style={{ color: '#FF6347' }}>₹{Math.round(Number(order.total_amount))}</span>
          </div>
        </div>

        <button className="track-close-btn" onClick={onClose}>
          Close Tracking
        </button>
      </div>
    </div>
  );
};

export default TrackOrderModal;
