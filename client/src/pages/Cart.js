import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "../styles/Cart.css";
import Footer from "../components/Footer";
import API_BASE_URL from "../config";

function Cart() {
    const [cartItems, setCartItems] = useState([]);
    const [cartSummary, setCartSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [processingCheckout, setProcessingCheckout] = useState(false);

    const { isAuthenticated, user, logout, getAuthToken } = useUser();
    const navigate = useNavigate();

    // Fetch cart items from API
    useEffect(() => {
        fetchCartItems();
    }, []);

    const fetchCartItems = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const headers = {};
            const token = getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/api/cart/`, {
                headers
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Cart data:', data);
                setCartItems(data.items || []);
                setCartSummary({
                    total_items: data.total_items || 0,
                    subtotal: data.subtotal || 0,
                    total_amount: data.total_amount || 0
                });
                setSelectedItems(new Set(data.items?.map(item => item.id) || []));
            } else {
                throw new Error('Failed to fetch cart items');
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
            setError('Failed to load cart items');
        } finally {
            setLoading(false);
        }
    };

    // Handle profile menu toggle
    const toggleProfileMenu = () => {
        setShowProfileMenu(!showProfileMenu);
    };

    // Handle logout
    const handleLogout = async () => {
        await logout();
        setShowProfileMenu(false);
        navigate('/');
    };

    // Close profile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showProfileMenu && !event.target.closest('.profile-dropdown')) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showProfileMenu]);

    // Update item quantity
    const updateQuantity = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;

        try {
            setUpdating(true);
            setError(null);
            
            const headers = {
                'Content-Type': 'application/json'
            };
            const token = getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/api/cart/items/${itemId}/`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ quantity: newQuantity })
            });

            if (response.ok) {
                const responseData = await response.json();
                
                setCartItems(prev => 
                    prev.map(item => 
                        item.id === itemId 
                            ? { ...item, quantity: newQuantity, total_price: responseData.cart_item?.total_price || (item.unit_price * newQuantity) }
                            : item
                    )
                );
                
                if (responseData.cart_summary) {
                    setCartSummary(responseData.cart_summary);
                }
                
                setSuccess('Quantity updated successfully');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update quantity');
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            setError(error.message || 'Failed to update item quantity');
            setTimeout(() => setError(null), 5000);
        } finally {
            setUpdating(false);
        }
    };

    // Remove item from cart
    const removeItem = async (itemId) => {
        try {
            setUpdating(true);
            setError(null);
            
            const headers = {};
            const token = getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/api/cart/items/${itemId}/remove/`, {
                method: 'DELETE',
                headers
            });

            if (response.ok) {
                const responseData = await response.json();
                
                setCartItems(prev => prev.filter(item => item.id !== itemId));
                setSelectedItems(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(itemId);
                    return newSet;
                });
                
                if (responseData.cart_summary) {
                    setCartSummary(responseData.cart_summary);
                }
                
                setSuccess(responseData.message || 'Item removed from cart');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to remove item');
            }
        } catch (error) {
            console.error('Error removing item:', error);
            setError(error.message || 'Failed to remove item from cart');
            setTimeout(() => setError(null), 5000);
        } finally {
            setUpdating(false);
        }
    };

    // Handle item selection for checkout
    const toggleItemSelection = (itemId) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    // Select/Deselect all items
    const toggleSelectAll = () => {
        if (selectedItems.size === cartItems.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(cartItems.map(item => item.id)));
        }
    };

    // Calculate totals for selected items
    const getSelectedItems = () => cartItems.filter(item => selectedItems.has(item.id));
    const getSubtotal = () => getSelectedItems().reduce((total, item) => total + (item.unit_price * item.quantity), 0);
    const getTax = () => getSubtotal() * 0.16; // 16% VAT
    const getShipping = () => getSelectedItems().length > 0 ? 0 : 0; // Free shipping for now
    const getTotal = () => getSubtotal() + getTax() + getShipping();

    // Simple checkout function
    const handleCheckout = async () => {
        if (selectedItems.size === 0) {
            setError('Please select items to checkout');
            setTimeout(() => setError(null), 5000);
            return;
        }

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            setProcessingCheckout(true);
            setError(null);
            
            const token = getAuthToken();
            
            // Simple checkout data - you can enhance this with a form later
            const checkoutData = {
                payment_method: 'mpesa',
                shipping_address: '123 Test Street, Nairobi CBD',
                shipping_city: 'Nairobi',
                shipping_country: 'Kenya',
                shipping_phone: '+254700000000',
                notes: 'Order from cart',
                special_instructions: ''
            };

            console.log('Sending checkout data:', checkoutData);

            const response = await fetch(`${API_BASE_URL}/api/cart/checkout/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(checkoutData)
            });

            const responseData = await response.json();
            console.log('Checkout response:', responseData);

            if (response.ok) {
                setSuccess(`Order ${responseData.order.order_number} created successfully!`);
                
                // Clear selected items and refresh cart
                setSelectedItems(new Set());
                await fetchCartItems();
                
                // Navigate to orders page after a short delay
                setTimeout(() => {
                    navigate('/orders');
                }, 2000);
            } else {
                console.error('Checkout error:', responseData);
                throw new Error(responseData.error || 'Failed to proceed to checkout');
            }
        } catch (error) {
            console.error('Error during checkout:', error);
            setError(error.message || 'Failed to proceed to checkout');
            setTimeout(() => setError(null), 5000);
        } finally {
            setProcessingCheckout(false);
        }
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user) return 'G'; // Guest
        const firstName = user?.first_name || '';
        const lastName = user?.last_name || '';
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount || 0);
    };

    return (
        <div className="cart-page">
            {/* Header */}
            <header className="cart-header">
                <div className="header-container">
                    <Link to="/" className="logo">
                        ( Kipsunya ~ biz )
                    </Link>
                    
                    <nav className="header-nav">
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/products" className="nav-link">Products</Link>
                        <Link to="/about" className="nav-link">About</Link>
                    </nav>

                    <div className="header-actions">
                        <Link to="/search" className="search-icon">🔍</Link>
                        <Link to="/cart" className="cart-icon active">
                            🛒
                            {cartItems.length > 0 && (
                                <span className="cart-count">{cartItems.length}</span>
                            )}
                        </Link>
                        
                        {/* Profile Dropdown */}
                        {isAuthenticated ? (
                            <div className="profile-dropdown">
                                <button 
                                    className="profile-button"
                                    onClick={toggleProfileMenu}
                                >
                                    <span className="profile-avatar">
                                        {getUserInitials()}
                                    </span>
                                    <span className="profile-name">
                                        {user?.first_name || 'User'}
                                    </span>
                                    <span className="dropdown-arrow">▼</span>
                                </button>
                                
                                {showProfileMenu && (
                                    <div className="profile-menu">
                                        <div className="profile-info">
                                            <p className="profile-email">{user?.email}</p>
                                            <p className="profile-role">{user?.role || 'Customer'}</p>
                                        </div>
                                        <hr />
                                        <Link to="/profile" className="menu-item">
                                            👤 My Profile
                                        </Link>
                                        <Link to="/orders" className="menu-item">
                                            📦 My Orders
                                        </Link>
                                        <Link to="/cart" className="menu-item active">
                                            🛒 My Cart
                                        </Link>
                                        <Link to="/settings" className="menu-item">
                                            ⚙️ Settings
                                        </Link>
                                        {user?.role === 'vendor' && (
                                            <>
                                                <hr />
                                                <Link to="/vendor/dashboard" className="menu-item">
                                                    🏪 Vendor Dashboard
                                                </Link>
                                            </>
                                        )}
                                        {user?.role === 'admin' && (
                                            <>
                                                <hr />
                                                <Link to="/admin" className="menu-item">
                                                    🛡️ Admin Panel
                                                </Link>
                                            </>
                                        )}
                                        <hr />
                                        <button onClick={handleLogout} className="menu-item logout-item">
                                            🚪 Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="auth-buttons">
                                <Link to="/login" className="login-btn">Login</Link>
                                <Link to="/register" className="register-btn">Sign Up</Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Cart Content */}
            <main className="cart-main">
                <div className="cart-container">
                    {/* Cart Header */}
                    <div className="cart-header-section">
                        <h1 className="cart-title">My Shopping Cart</h1>
                        <p className="cart-subtitle">
                            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
                        </p>
                    </div>

                    {/* Success/Error Messages */}
                    {success && (
                        <div className="message success-message">
                            ✅ {success}
                        </div>
                    )}
                    
                    {error && (
                        <div className="message error-message">
                            ❌ {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading cart items...</p>
                        </div>
                    ) : cartItems.length === 0 ? (
                        <div className="empty-cart">
                            <div className="empty-cart-icon">🛒</div>
                            <h2 className="empty-cart-title">Your cart is empty</h2>
                            <p className="empty-cart-message">
                                Start shopping to add items to your cart
                            </p>
                            <Link to="/products" className="start-shopping-button">
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="cart-content">
                            {/* Cart Items Section */}
                            <div className="cart-items-section">
                                {/* Select All Controls */}
                                <div className="cart-controls">
                                    <label className="select-all-container">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.size === cartItems.length && cartItems.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                        <span className="checkmark"></span>
                                        Select All ({cartItems.length} items)
                                    </label>
                                    
                                    {selectedItems.size > 0 && (
                                        <span className="selected-count">
                                            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                                        </span>
                                    )}
                                </div>

                                {/* Cart Items List */}
                                <div className="cart-items-list">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="cart-item">
                                            <div className="item-select">
                                                <label className="checkbox-container">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.has(item.id)}
                                                        onChange={() => toggleItemSelection(item.id)}
                                                    />
                                                    <span className="checkmark"></span>
                                                </label>
                                            </div>

                                            <div className="item-image">
                                                <img 
                                                    src={item.product_image || '/api/placeholder/80/80'} 
                                                    alt={item.product_name}
                                                    onError={(e) => {
                                                        e.target.src = '/api/placeholder/80/80';
                                                    }}
                                                />
                                            </div>

                                            <div className="item-details">
                                                <h3 className="item-name">
                                                    <Link to={`/products/${item.product_id}`}>
                                                        {item.product_name}
                                                    </Link>
                                                </h3>
                                                <p className="item-vendor">
                                                    by {item.vendor_name}
                                                </p>
                                                <p className="item-description">
                                                    {item.product_description?.substring(0, 100)}
                                                    {item.product_description?.length > 100 && '...'}
                                                </p>
                                                <div className="item-specs">
                                                    <span className="item-spec">
                                                        SKU: {item.product_slug}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="item-price">
                                                <span className="current-price">
                                                    {formatCurrency(item.unit_price)}
                                                </span>
                                            </div>

                                            <div className="item-quantity">
                                                <button 
                                                    className="quantity-btn decrease"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1 || updating}
                                                >
                                                    −
                                                </button>
                                                <span className="quantity-value">{item.quantity}</span>
                                                <button 
                                                    className="quantity-btn increase"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    disabled={updating}
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <div className="item-total">
                                                {formatCurrency(item.unit_price * item.quantity)}
                                            </div>

                                            <div className="item-actions">
                                                <button 
                                                    className="remove-btn"
                                                    onClick={() => removeItem(item.id)}
                                                    disabled={updating}
                                                    title="Remove from cart"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cart Summary Section */}
                            <div className="cart-summary-section">
                                <div className="cart-summary">
                                    <h3 className="summary-title">Order Summary</h3>
                                    
                                    <div className="summary-details">
                                        <div className="summary-row">
                                            <span className="summary-label">
                                                Subtotal ({selectedItems.size} items):
                                            </span>
                                            <span className="summary-value">
                                                {formatCurrency(getSubtotal())}
                                            </span>
                                        </div>
                                        
                                        <div className="summary-row">
                                            <span className="summary-label">Tax (16% VAT):</span>
                                            <span className="summary-value">
                                                {formatCurrency(getTax())}
                                            </span>
                                        </div>
                                        
                                        <div className="summary-row">
                                            <span className="summary-label">Shipping:</span>
                                            <span className="summary-value">
                                                {getShipping() === 0 ? 'Free' : formatCurrency(getShipping())}
                                            </span>
                                        </div>
                                        
                                        <hr className="summary-divider" />
                                        
                                        <div className="summary-row total">
                                            <span className="summary-label">Total:</span>
                                            <span className="summary-value total-amount">
                                                {formatCurrency(getTotal())}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="checkout-section">
                                        <button 
                                            className="checkout-button"
                                            onClick={handleCheckout}
                                            disabled={selectedItems.size === 0 || processingCheckout}
                                        >
                                            {processingCheckout ? (
                                                <>
                                                    <div className="button-spinner"></div>
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    Proceed to Checkout
                                                    <span className="checkout-icon">→</span>
                                                </>
                                            )}
                                        </button>
                                        
                                        <Link to="/products" className="continue-shopping">
                                            ← Continue Shopping
                                        </Link>
                                    </div>

                                    {/* Payment Methods */}
                                    <div className="payment-methods">
                                        <p className="payment-title">We accept:</p>
                                        <div className="payment-icons">
                                            <span className="payment-icon">💳</span>
                                            <span className="payment-icon">📱</span>
                                            <span className="payment-icon">🏧</span>
                                        </div>
                                    </div>

                                    {/* Security Badge */}
                                    <div className="security-badge">
                                        <span className="security-icon">🔒</span>
                                        <span className="security-text">Secure Checkout</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default Cart;