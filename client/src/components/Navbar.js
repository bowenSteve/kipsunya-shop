import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import "../styles/Navbar.css";

function Navbar() {
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    const navigate = useNavigate();
    const { isAuthenticated, user, userRole, logout, isLoading: authLoading } = useUser();

    // Use userRole from context, fallback to user.role, then default to 'customer'
    const currentRole = userRole || user?.role || 'customer';

    // Handle navigation
    const handleLoginClick = () => navigate('/login');
    const handleRegisterClick = () => navigate('/register');

    // Handle logout
    const handleLogoutClick = async () => {
        await logout();
        setShowProfileDropdown(false);
    };

    // Helper to get user initials
    const getInitials = (user) => {
        if (!user) return 'U';
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U';
    };
    
    // Effect to close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showProfileDropdown && !event.target.closest('.profile-dropdown-container')) {
                setShowProfileDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileDropdown]);
    
    return (
        <header className="header">
            <div className="header-container">
            <nav className="navigation">
                    <NavLink to="/" className="nav-link" end>Home</NavLink>
                    <NavLink to="/products" className="nav-link">Products</NavLink>
                    <NavLink to="/about" className="nav-link">About</NavLink>
                </nav>

                <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    ( Kipsunya ~ biz )
                </div>
                <div className="header-actions">
                    {authLoading ? (
                        <div className="auth-loading"><div className="loading-spinner"></div></div>
                    ) : isAuthenticated ? (
                        <div className="profile-dropdown-container">
                                <button 
                                    className="profile-button"
                                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                >
                                    <div className="profile-avatar">{getInitials(user)}</div>
                                    <span className="profile-name">{user?.first_name || user?.email}</span>
                                    <span className={`dropdown-arrow ${showProfileDropdown ? 'open' : ''}`}>▼</span>
                                </button>
                                {showProfileDropdown && (
                                     <div className="profile-dropdown-menu">
                                        <div className="profile-dropdown-header">
                                            <div className="profile-dropdown-avatar">{getInitials(user)}</div>
                                            <div className="profile-dropdown-info">
                                                <p className="profile-dropdown-name">{user?.first_name} {user?.last_name}</p>
                                                <p className="profile-dropdown-email">{user?.email}</p>
                                                <p className="profile-dropdown-role">{currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}</p>
                                            </div>
                                        </div>
                                        <div className="profile-dropdown-divider"></div>
                                        <div className="profile-dropdown-items">
                                            <button className="profile-dropdown-item" onClick={() => { navigate('/profile'); setShowProfileDropdown(false); }}>
                                                <span className="item-icon">👤</span> Profile Settings
                                            </button>
                                            {currentRole === 'vendor' ? (
                                                <button className="profile-dropdown-item" onClick={() => { navigate('/vendor/dashboard'); setShowProfileDropdown(false); }}>
                                                    <span className="item-icon">🏪</span> Vendor Dashboard
                                                </button>
                                            ) : currentRole === 'customer' ? (
                                                <button className="profile-dropdown-item" onClick={() => { navigate('/upgrade-to-vendor'); setShowProfileDropdown(false); }}>
                                                    <span className="item-icon">🚀</span> Become a Vendor
                                                </button>
                                            ) : null}
                                            {currentRole === 'admin' && (
                                                <button className="profile-dropdown-item" onClick={() => { navigate('/admin'); setShowProfileDropdown(false); }}>
                                                    <span className="item-icon">⚙️</span> Admin Panel
                                                </button>
                                            )}
                                            <div className="profile-dropdown-divider"></div>
                                            <button className="profile-dropdown-item logout-item" onClick={handleLogoutClick}>
                                                <span className="item-icon">🚪</span> Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <button className="login-btn" onClick={handleLoginClick}>Login</button>
                            <button className="register-btn" onClick={handleRegisterClick}>Sign Up</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Navbar;