import React, { useState, useContext } from 'react';
import './AdminAdd.css';
import { adminAPI } from '../../../services/api';
import { StoreContext } from '../../../context/StoreContext';
import { toast } from 'react-toastify';
import { UploadCloud, Check } from 'lucide-react';

const AdminAdd = () => {
  const { fetchFoodList } = useContext(StoreContext);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [data, setData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Salad',
  });
  const [loading, setLoading] = useState(false);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!data.name.trim()) {
      toast.error('Please enter a product name.');
      return;
    }
    if (!data.description.trim()) {
      toast.error('Please enter a product description.');
      return;
    }
    if (!data.price || Number(data.price) <= 0) {
      toast.error('Please enter a valid price in ₹.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name.trim());
      formData.append('description', data.description.trim());
      formData.append('price', Number(data.price));
      formData.append('category', data.category);

      if (image) {
        formData.append('image', image);
      } else {
        // Fallback default appetizing image based on category
        const fallbackUrls = {
          Salad: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
          Rolls: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
          Desserts: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80',
          Sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
          Cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
          'Pure Veg': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
          Pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80',
          Noodles: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
        };
        formData.append('image_url', fallbackUrls[data.category] || fallbackUrls.Salad);
      }

      const res = await adminAPI.addFood(formData);
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Food item added successfully!');
        // Reset form
        setData({
          name: '',
          description: '',
          price: '',
          category: 'Salad',
        });
        setImage(null);
        setImagePreview('');

        // Refresh global food list so customer side gets it immediately!
        await fetchFoodList();
      }
    } catch (err) {
      console.error('Error adding food item:', err);
      toast.error(err.response?.data?.message || 'Failed to add food item. Make sure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-add">
      <form onSubmit={onSubmitHandler}>
        <div className="add-img-upload">
          <p>Upload image</p>
          <label htmlFor="food-image-input">
            <div className="upload-box">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="upload-preview" />
              ) : (
                <>
                  <UploadCloud size={32} color="#777" />
                  <span>Upload</span>
                </>
              )}
            </div>
          </label>
          <input
            id="food-image-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onImageChange}
          />
        </div>

        <div className="add-product-name">
          <p>Product name</p>
          <input
            name="name"
            value={data.name}
            onChange={onChangeHandler}
            type="text"
            placeholder="Type here"
            required
          />
        </div>

        <div className="add-product-description">
          <p>Product description</p>
          <textarea
            name="description"
            value={data.description}
            onChange={onChangeHandler}
            rows={5}
            placeholder="Write content here"
            required
          />
        </div>

        <div className="add-category-price">
          <div className="add-category">
            <p>Product category</p>
            <select name="category" value={data.category} onChange={onChangeHandler}>
              <option value="Salad">Salad</option>
              <option value="Rolls">Rolls</option>
              <option value="Desserts">Desserts</option>
              <option value="Sandwich">Sandwich</option>
              <option value="Cake">Cake</option>
              <option value="Pure Veg">Pure Veg</option>
              <option value="Pasta">Pasta</option>
              <option value="Noodles">Noodles</option>
            </select>
          </div>

          <div className="add-price">
            <p>Product Price</p>
            <input
              name="price"
              value={data.price}
              onChange={onChangeHandler}
              type="number"
              placeholder="₹ 150"
              required
            />
          </div>
        </div>

        <button type="submit" className="add-btn" disabled={loading}>
          {loading ? 'ADDING...' : 'ADD'}
        </button>
      </form>
    </div>
  );
};

export default AdminAdd;
