import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { CartProvider } from './context/CartContext';

import LandingPage from "./pages/LandingPage";
import Products from "./pages/Products";
import ProductCard from "./pages/ProductCard";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import About from "./pages/About";
import Profile from "./pages/Profile";
import VendorUpgrade from "./pages/vendor/VendorUpgrade";
import Dashboard from "./pages/vendor/Dashboard";
import Admin from "./pages/admin/Admin";
import { ProtectedRoute } from './context/RouteGuards';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <UserProvider>
      <CartProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductCard />} />
          <Route path="/about" element={<About />} />

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<SignUp />} />

          {/* Protected routes */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/upgrade-to-vendor" element={<ProtectedRoute allowedRoles={['customer']}><VendorUpgrade /></ProtectedRoute>} />
          <Route path="/vendor/dashboard" element={<ProtectedRoute allowedRoles={['vendor', 'admin']}><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Admin /></ProtectedRoute>} />
        </Routes>
      </CartProvider>
    </UserProvider>
  </BrowserRouter>
);

reportWebVitals();