// src/routes.js - Fixed version without duplicate declaration
import LandingPage from "./pages/LandingPage";
import Products from "./pages/Products";
import ProductCard from "./pages/ProductCard";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import About from "./pages/About";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import Cart from "./pages/Cart";
import VendorUpgrade from "./pages/vendor/VendorUpgrade";
import Dashboard from "./pages/vendor/Dashboard";

import { ProtectedRoute, PublicRoute } from './context/RouteGuards';

// Define and export routes array
export default [
  // ========== PUBLIC ROUTES ==========
  // These routes are accessible to everyone
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/products",
    element: <Products />,
  },
  {
    path: "/product/:id",
    element: <ProductCard />,
  },
  {
    path: "/about",
    element: <About />,
  },
  
  // ========== AUTH ROUTES ==========
  // These redirect authenticated users away
  {
    path: "/login",
    element: <PublicRoute><Login /></PublicRoute>,
  },
  {
    path: "/register", 
    element: <PublicRoute><SignUp /></PublicRoute>,
  },
  
  // ========== PROTECTED ROUTES ==========
  // These require authentication
  
  // General authenticated routes (any logged-in user)
  // {
  //   path: "/dashboard",
  //   element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
  // },
  {
    path: "/profile",
    element: <ProtectedRoute><Profile /></ProtectedRoute>,
  },
  {
    path: "/orders",
    element: <ProtectedRoute><Orders /></ProtectedRoute>,
  },
  {
    path: "/cart",
    element: <ProtectedRoute><Cart /></ProtectedRoute>,
  },
  {
    path: "/upgrade-to-vendor",
    element: <ProtectedRoute><VendorUpgrade /></ProtectedRoute>,
  },
  // {
  //   path: "/settings",
  //   element: <ProtectedRoute><Settings /></ProtectedRoute>,
  // },
  
  // Vendor-only routes
  {
    path: "/vendor/dashboard",
    element: <ProtectedRoute allowedRoles={['vendor', 'admin']}><Dashboard /></ProtectedRoute>,
  },
  
  // Customer-only routes
  // {
  //   path: "/customer/dashboard",
  //   element: <ProtectedRoute allowedRoles={['customer', 'admin']}><Dashboard /></ProtectedRoute>,
  // },
  
  // Admin-only routes
  // {
  //   path: "/admin",
  //   element: <ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>,
  // },
];