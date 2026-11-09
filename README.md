# CraveKart – Full Stack Food Delivery Web Application
> **Tagline:** Every craving, delivered.  
> **Tech Stack:** React.js (Vite) + Python + Django REST Framework + PostgreSQL + Razorpay

---

## 🌟 Overview

**CraveKart** is a complete, modern, fully functional full-stack food delivery platform with Indian Rupee (₹) pricing, UPI & Card payments powered by Razorpay, and synchronized Customer & Admin interfaces backed by a single Django REST API and PostgreSQL database.

---

## 🎨 Visual Alignment & Features

The design, color palette, layouts, and spacing are matched to the reference screenshots:

### 1. Customer Website
- **Branding & Header**: Primary Orange (`#FF6347`), hero banner with "Order your favourite food here" and smooth-scrolling "View Menu" button.
- **Explore Our Menu**: Interactive circular category navigation (Salad, Rolls, Desserts, Sandwich, Cake, Pure Veg, Pasta, Noodles, All).
- **Food Cards**:
  - 4 cards per row responsive desktop layout.
  - Indian Rupee (₹) bold pricing.
  - Interactive counter capsule (`- count +`) directly overlaying food image cards.
  - Rating stars and health/well-being descriptions.
- **Search**: Live case-insensitive search across dish names, categories, and ingredients.
- **Cart Page (`/cart`)**: Real-time totals, table breakdown, item removal, and backend promo code engine (e.g., `CRAVE50`).
- **Checkout & Delivery (`/order`)**: Standard Indian address capture (PIN code, 10-digit mobile, Street, City, State).
- **Razorpay Payment Integration**:
  - Backend database price verification (no frontend price tampering).
  - Razorpay Orders creation via Python SDK.
  - HMAC SHA256 payment signature verification on the backend.
  - Interactive Razorpay Test Simulator mode for frictionless local testing.
- **Order Tracking (`/myorders`)**:
  - Order summary cards with item breakdowns and status badges (`• Food Processing`).
  - Interactive **Track Order** modal with a 4-stage visual stepper (Order Placed ➔ Food Processing ➔ Out for Delivery ➔ Delivered).
- **Authentication**: Sign Up and Login modal popups with JWT token issuance and password hashing.
- **App Download Promo & Footer**: Dark responsive 3-column footer with social links and company details.

### 2. Admin Dashboard (`/admin`)
- **Admin Authentication**: Dedicated administrator login route (`/admin/login`).
- **Dashboard Overview (`/admin` / `/admin/dashboard`)**: Key metrics (Total Revenue in ₹, Order Counts, Active Processing Dishes, Menu Count).
- **Add Items (`/admin/add`)**: Multipart image upload with preview, name, description, category dropdown, and price in ₹.
- **List Items (`/admin/list`)**: Food catalogue table with immediate delete actions.
- **Orders Management (`/admin/orders`)**: Real-time status dropdown (`Food Processing`, `Out for Delivery`, `Delivered`, `Cancelled`). Updates immediately reflect on the customer website.

---

## 🏗️ Architecture

```
cravekart/
├── backend/
│   ├── manage.py
│   ├── config/             # Settings, ASGI, WSGI, root URLs
│   ├── accounts/           # Custom User model, JWT authentication, serializers, views
│   ├── food/               # Food model, categories, search, admin food endpoints
│   ├── cart/               # Cart, CartItem models, persistent cart synchronization
│   ├── orders/             # Order & OrderItem models, snapshot pricing, admin status
│   ├── payments/           # Razorpay SDK service, order generation, signature verification
│   ├── promotions/         # PromoCode model, percentage/flat discount logic
│   ├── common/             # Permissions (IsAdminUserRole), seed management command
│   ├── media/              # Uploaded dish images
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment variables template
│   └── test_flow.py        # Automated E2E test suite
└── frontend/
    ├── index.html
    ├── vite.config.js      # Vite configuration with proxy to backend
    ├── package.json
    └── src/
        ├── assets/         # Categories and static data
        ├── components/     # Navbar, Hero, ExploreMenu, FoodDisplay, FoodItem, Footer, etc.
        ├── context/        # StoreContext (React Context API)
        ├── pages/          # Home, Cart, PlaceOrder, MyOrders, Admin/
        └── services/       # Axios API client
```

---

## ⚡ Quick Start

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env from template
copy .env.example .env

# Run database migrations
python manage.py makemigrations accounts food cart promotions orders
python manage.py migrate

# Seed initial admin, sample customer, promo codes, and 29 menu items
python manage.py seed_cravekart

# Start Django development server
python manage.py runserver 127.0.0.1:8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🐘 PostgreSQL Configuration

To switch from the default development SQLite to PostgreSQL:

1. Create a database in PostgreSQL:
   ```sql
   CREATE DATABASE cravekart_db;
   ```
2. In `backend/.env`, set your connection URL:
   ```env
   DATABASE_URL=postgresql://<username>:<password>@localhost:5432/cravekart_db
   ```
3. Run migrations and seed data:
   ```bash
   python manage.py migrate
   python manage.py seed_cravekart
   ```

---

## 💳 Razorpay Credentials Configuration

In `backend/.env`:
```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```
*Note: If placeholder credentials are used during development, CraveKart automatically enables the built-in interactive Razorpay Test Simulator mode with zero configuration needed.*

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@cravekart.com` | `AdminPassword@123` |
| **Demo Customer** | `customer@example.com` | `CustomerPassword@123` |

### Active Promo Codes
- **`CRAVE50`**: Flat ₹50 discount on orders over ₹200.
- **`FIRSTORDER`**: 20% discount on orders over ₹150.
- **`DELIGHT`**: Flat ₹100 discount on orders over ₹400.

---

## 🧪 Automated End-to-End Verification

To execute the automated end-to-end integration test suite:
```bash
python test_flow.py
```
This tests:
1. Customer registration & JWT issuance
2. Persistent cart addition & subtotal calculation
3. Promo code application
4. Order creation with backend database price enforcement
5. Razorpay order generation & signature verification
6. Cart clearing upon payment
7. Admin login & status transition (`Food Processing` ➔ `Out for Delivery`)
8. Customer order tracking reflection
