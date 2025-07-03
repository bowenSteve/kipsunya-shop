import React from 'react';
import { Routes, Route, NavLink, Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

// Import the sub-components
import Dashboard from './Dashboard';
import ProductList from './ProductList';
import OrderList from './OrderList';
import CustomerList from './CustomerList';

import '../../styles/Admin.css';

// SVG Icons
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25A2.25 2.25 0 0 1 13.5 8.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>;
const ProductIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0-2.25l2.25 1.313M12 12.75l-2.25 1.313M21 14.25v2.25a2.25 2.25 0 01-2.25 2.25h-5.25a2.25 2.25 0 01-2.25-2.25v-2.25m3.75-3.75l-2.25-1.313M4.125 18.75h15.75a2.25 2.25 0 002.25-2.25v-2.25" /></svg>;
const OrderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75Z" /></svg>;
const CustomerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-8.262 9.337 9.337 0 00-4.121-8.262 9.38 9.38 0 00-2.625.372M6.375 21a9.337 9.337 0 01-4.12-8.262 9.337 9.337 0 014.12-8.262 9.383 9.383 0 012.625.372M16.125 12a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0Z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>;

function Admin() {
    const { user, logout } = useUser();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/'); // Redirect to home page after logout
    };

    return (
        <div className="admin-page">
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <Link to="/" className="admin-logo">( Kipsunya ~ biz )</Link>
                    <span className="admin-panel-title">Admin Panel</span>
                </div>
                <nav className="admin-nav">
                    <NavLink to="/admin" end><DashboardIcon /><span>Dashboard</span></NavLink>
                    <NavLink to="/admin/products"><ProductIcon /><span>Products</span></NavLink>
                    <NavLink to="/admin/orders"><OrderIcon /><span>Orders</span></NavLink>
                    <NavLink to="/admin/customers"><CustomerIcon /><span>Customers</span></NavLink>
                </nav>
                <div className="admin-sidebar-footer">
                    <div className="admin-user-info">
                        <span className="admin-user-avatar">{user?.first_name?.charAt(0) || 'A'}</span>
                        <div className="admin-user-details">
                            <span className="admin-user-name">{user?.first_name || 'Admin'} {user?.last_name || ''}</span>
                            <span className="admin-user-email">{user?.email}</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="admin-logout-btn">
                        <LogoutIcon />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
            <main className="admin-content">
                <div className="admin-content-inner">
                   <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="products" element={<ProductList />} />
                        <Route path="orders" element={<OrderList />} />
                        <Route path="customers" element={<CustomerList />} />
                   </Routes>
                </div>
            </main>
        </div>
    );
}

export default Admin;