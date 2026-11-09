import React, { useEffect, useState, useContext } from 'react';
import './AdminList.css';
import { adminAPI } from '../../../services/api';
import { StoreContext } from '../../../context/StoreContext';
import { toast } from 'react-toastify';
import { X, RefreshCw } from 'lucide-react';

const AdminList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchFoodList } = useContext(StoreContext);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getFoods();
      if (res.data && res.data.foods) {
        setList(res.data.foods);
      }
    } catch (err) {
      console.error('Error fetching admin foods:', err);
      toast.error('Failed to load foods from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const removeFood = async (foodId, foodName) => {
    if (!window.confirm(`Are you sure you want to remove '${foodName}' from the CraveKart menu?`)) {
      return;
    }

    try {
      const res = await adminAPI.deleteFood(foodId);
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Food item removed.');
        await fetchFoods();
        // Update customer side food menu
        await fetchFoodList();
      }
    } catch (err) {
      console.error('Delete food error:', err);
      toast.error(err.response?.data?.message || 'Failed to remove food item.');
    }
  };

  return (
    <div className="admin-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="admin-list-title">All Foods List ({list.length})</p>
        <button
          onClick={fetchFoods}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#49557e', fontSize: '13px' }}
        >
          <RefreshCw size={15} /> Refresh List
        </button>
      </div>

      <div className="list-table">
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Action</b>
        </div>

        {loading ? (
          <p style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
            Loading menu items...
          </p>
        ) : list.length === 0 ? (
          <p style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
            No foods added yet. Click 'Add Items' in the sidebar to add your first dish.
          </p>
        ) : (
          list.map((item) => (
            <div key={item.id} className="list-table-format">
              <img src={item.display_image || item.image_url} alt={item.name} />
              <p style={{ fontWeight: 500, color: '#262626' }}>{item.name}</p>
              <p style={{ color: '#555' }}>{item.category}</p>
              <p style={{ color: '#FF6347', fontWeight: 600 }}>₹{Math.round(Number(item.price))}</p>
              <span
                onClick={() => removeFood(item.id, item.name)}
                className="cursor"
                title={`Delete ${item.name}`}
              >
                <X size={18} />
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminList;
