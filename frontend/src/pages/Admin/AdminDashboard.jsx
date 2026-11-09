import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, ShoppingBag, Clock, CheckCircle2, UtensilsCrossed, PlusCircle } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await adminAPI.getDashboardStats();
        if (res.data && res.data.stats) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="admin-dashboard animate-fade-in" style={{ padding: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#262626' }}>CraveKart Operations Overview</h2>
          <p style={{ color: '#777', fontSize: '14px', marginTop: '4px' }}>Real-time food delivery and store analytics</p>
        </div>
        <button
          onClick={() => navigate('/admin/add')}
          style={{
            backgroundColor: '#FF6347',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <PlusCircle size={18} /> Add New Dish
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#888', padding: '40px 0' }}>Loading analytics...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '10px', border: '1px solid #eef2f5', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Revenue</span>
              <div style={{ background: '#eefcf5', color: '#10b981', padding: '8px', borderRadius: '8px' }}><IndianRupee size={20} /></div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b' }}>₹{Math.round(Number(stats?.total_revenue || 0))}</div>
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '10px', border: '1px solid #eef2f5', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Orders</span>
              <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '8px', borderRadius: '8px' }}><ShoppingBag size={20} /></div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b' }}>{stats?.total_orders || 0}</div>
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '10px', border: '1px solid #eef2f5', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Processing</span>
              <div style={{ background: '#fffbeb', color: '#f59e0b', padding: '8px', borderRadius: '8px' }}><Clock size={20} /></div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>{stats?.processing_orders || 0}</div>
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '10px', border: '1px solid #eef2f5', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Delivered</span>
              <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '8px', borderRadius: '8px' }}><CheckCircle2 size={20} /></div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a' }}>{stats?.delivered_orders || 0}</div>
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '10px', border: '1px solid #eef2f5', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Menu Items</span>
              <div style={{ background: '#fff1f2', color: '#FF6347', padding: '8px', borderRadius: '8px' }}><UtensilsCrossed size={20} /></div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#FF6347' }}>{stats?.total_food_items || 0}</div>
          </div>
        </div>
      )}

      {/* Quick Action cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div
          onClick={() => navigate('/admin/orders')}
          style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <h4 style={{ fontSize: '17px', color: '#1e293b', marginBottom: '8px', fontWeight: 600 }}>Manage Customer Orders &rarr;</h4>
          <p style={{ color: '#64748b', fontSize: '13.5px' }}>View order list, review delivery addresses, and update status from Food Processing to Delivered.</p>
        </div>

        <div
          onClick={() => navigate('/admin/list')}
          style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <h4 style={{ fontSize: '17px', color: '#1e293b', marginBottom: '8px', fontWeight: 600 }}>Manage Food Catalogue &rarr;</h4>
          <p style={{ color: '#64748b', fontSize: '13.5px' }}>Browse active menu items, check Indian Rupee pricing, and delete or modify dishes.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
