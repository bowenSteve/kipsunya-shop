import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import "../styles/Navbar.css"; 

function Navbar() {
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [cartItemCount, setCartItemCount] = useState(0);
    
    const navigate = useNavigate();
    // Assuming getAuthToken is now part of your context as shown in your code
    const { isAuthenticated, user, logout, isLoading: authLoading, getAuthToken } = useUser();

    useEffect(() => {
        const fetchCartData = async () => {
            // 1. Get the token from the context.
            const token = getAuthToken ? getAuthToken() : null;

            // --- THIS IS THE FIX ---
            // 2. Check if the token itself exists. If not, stop.
            if (!token) {
                // This is expected if the user is not logged in.
                return;
            }

            // 3. The incorrect 'if' statement is now gone, so the code proceeds.
            try {
                const response = await fetch('/api/cart/', {
                    headers: {
                        'Content-Type': 'application/json',
                        // Use the token we just confirmed exists.
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && typeof data.total_items === 'number') {
                        setCartItemCount(data.total_items);
                    } else {
                        setCartItemCount(0);
                    }
                } else if (response.status === 404) {
                    setCartItemCount(0);
                } else {
                    console.error('Failed to fetch cart data:', response.statusText);
                    setCartItemCount(0);
                }
            } catch (error) {
                console.error('Error fetching cart data:', error);
                setCartItemCount(0);
            }
        };

        // This condition is now the single gatekeeper.
        if (isAuthenticated) {
            fetchCartData();
        } else {
            setCartItemCount(0);
        }
    
    // Updated dependency array. The effect runs when auth status changes.
    }, [isAuthenticated, getAuthToken]);

    // ... The rest of your component remains the same ...

    // Handle navigation
    const handleLoginClick = () => navigate('/login');
    const handleRegisterClick = () => navigate('/register');
    const handleCart = () => navigate('/cart');

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
                    <div className="header-icons">
                         <button className="icon-button-with-badge" onClick={handleCart}>
                            🛒
                            {cartItemCount > 0 && (
                                <span className="badge badge-red">{cartItemCount}</span>
                            )}
                        </button>
                    </div>
                    
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
                                                <p className="profile-dropdown-role">{user?.role || 'Customer'}</p>
                                            </div>
                                        </div>
                                        <div className="profile-dropdown-divider"></div>
                                        <div className="profile-dropdown-items">
                                            <button className="profile-dropdown-item" onClick={() => { navigate('/profile'); setShowProfileDropdown(false); }}>
                                                <span className="item-icon">👤</span> Profile Settings
                                            </button>
                                            <button className="profile-dropdown-item" onClick={() => { navigate('/orders'); setShowProfileDropdown(false); }}>
                                                <span className="item-icon">📦</span> My Orders
                                            </button>
                                            {user?.role === 'vendor' && (
                                                <button className="profile-dropdown-item" onClick={() => { navigate('/vendor/dashboard'); setShowProfileDropdown(false); }}>
                                                    <span className="item-icon">🏪</span> Vendor Dashboard
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