import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "../styles/Orders.css";
import Footer from "../components/Footer";
import API_BASE_URL from "../config";

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [selectedTab, setSelectedTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);

    const { isAuthenticated, user, logout, getAuthToken } = useUser();
    const navigate = useNavigate();

    // Order status options
    const orderStatuses = {
        pending: { label: 'Pending', color: '#d97706', bg: '#fef3c7' },
        confirmed: { label: 'Confirmed', color: '#059669', bg: '#d1fae5' },
        processing: { label: 'Processing', color: '#4f46e5', bg: '#ede9fe' },
        shipped: { label: 'Shipped', color: '#7c3aed', bg: '#f3e8ff' },
        delivered: { label: 'Delivered', color: '#059669', bg: '#dcfce7' },
        cancelled: { label: 'Cancelled', color: '#dc2626', bg: '#fee2e2' },
        refunded: { label: 'Refunded', color: '#6b7280', bg: '#f3f4f6' }
    };

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
    }, [isAuthenticated, navigate]);

    // Fetch orders based on user role
    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;

            setLoading(true);
            setError(null);

            try {
                const token = getAuthToken();
                const endpoint = user.role === 'vendor' 
                    ? `${API_BASE_URL}/api/orders/`
                    : `${API_BASE_URL}/api/orders/`;

                const response = await fetch(endpoint, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(data)
                    setOrders(data.results || []);
                } else {
                    throw new Error('Failed to fetch orders');
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
                setError(error.message);
                // Mock data for demonstration
                setOrders(generateMockOrders(user.role));
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user, getAuthToken]);
    
    // Generate mock orders for demonstration
    const generateMockOrders = (role) => {
        const baseOrders = [
            {
                id: '1001',
                order_number: 'ORD-2024-1001',
                customer_name: 'John Smith',
                customer_email: 'john@example.com',
                items: [
                    { name: 'Electric Meat Grinder', quantity: 1, price: 4200.00, vendor: 'TechKitchen Co.' },
                    { name: 'Silicon Ice Cube Tray', quantity: 2, price: 800.00, vendor: 'HomeWare Plus' }
                ],
                total_amount: 5800.00,
                status: 'delivered',
                order_date: '2024-06-10T10:30:00Z',
                shipping_address: '123 Main St, Nairobi, Kenya',
                payment_method: 'M-Pesa',
                tracking_number: 'TRK123456789'
            },
            {
                id: '1002',
                order_number: 'ORD-2024-1002',
                customer_name: 'Mary Johnson',
                customer_email: 'mary@example.com',
                items: [
                    { name: 'Heavy Metal Juice Extractor', quantity: 1, price: 3500.00, vendor: 'KitchenPro Ltd' }
                ],
                total_amount: 3500.00,
                status: 'processing',
                order_date: '2024-06-14T15:45:00Z',
                shipping_address: '456 Oak Ave, Mombasa, Kenya',
                payment_method: 'Credit Card',
                tracking_number: null
            },
            {
                id: '1003',
                order_number: 'ORD-2024-1003',
                customer_name: 'David Wilson',
                customer_email: 'david@example.com',
                items: [
                    { name: '2Pcs Stainless Steel Pots', quantity: 1, price: 2500.00, vendor: 'CookWare Masters' }
                ],
                total_amount: 2500.00,
                status: 'pending',
                order_date: '2024-06-15T09:20:00Z',
                shipping_address: '789 Pine Rd, Kisumu, Kenya',
                payment_method: 'Bank Transfer',
                tracking_number: null
            }
        ];

        if (role === 'vendor') {
            // For vendors, show orders that include their products
            return baseOrders.map(order => ({
                ...order,
                vendor_earnings: order.total_amount * 0.85, // 85% after platform fee
                commission_rate: 15
            }));
        }

        return baseOrders;
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

    // Filter orders based on search and filters
    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        const matchesDate = dateFilter === 'all' || checkDateFilter(order.order_date, dateFilter);

        return matchesSearch && matchesStatus && matchesDate;
    });

    // Check date filter
    const checkDateFilter = (orderDate, filter) => {
        const date = new Date(orderDate);
        const now = new Date();
        const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        switch (filter) {
            case 'today': return daysDiff === 0;
            case 'week': return daysDiff <= 7;
            case 'month': return daysDiff <= 30;
            case '3months': return daysDiff <= 90;
            default: return true;
        }
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        const firstName = user?.first_name || '';
        const lastName = user?.last_name || '';
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
    };

    // Handle order status update (for vendors)
    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}//api/vendor/orders/${orderId}/status/`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Update local state
                setOrders(orders.map(order => 
                    order.id === orderId ? { ...order, status: newStatus } : order
                ));
            } else {
                throw new Error('Failed to update order status');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            // For demo, update locally anyway
            setOrders(orders.map(order => 
                order.id === orderId ? { ...order, status: newStatus } : order
            ));
        }
    };

    // Show order details modal
    const showOrderDetailsModal = (order) => {
        setSelectedOrder(order);
        setShowOrderDetails(true);
    };

    // Close order details modal
    const closeOrderDetails = () => {
        setShowOrderDetails(false);
        setSelectedOrder(null);
    };

    if (!isAuthenticated || !user) {
        return (
            <div className="orders-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="orders-page">
            {/* Header */}
            <header className="orders-header">
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
                        <Link to="/cart" className="cart-icon">🛒</Link>
                        
                        {/* Profile Dropdown */}
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
                                    <Link to="/orders" className="menu-item active">
                                        📦 My Orders
                                    </Link>
                                    <Link to="/cart" className="menu-item">
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
                    </div>
                </div>
            </header>

            {/* Orders Content */}
            <main className="orders-main">
                <div className="orders-container">
                    {/* Page Header */}
                    <div className="page-header">
                        <div className="page-header-content">
                            <h1 className="page-title">
                                {user.role === 'vendor' ? 'Sales & Orders' : 'My Orders'}
                            </h1>
                            <p className="page-subtitle">
                                {user.role === 'vendor' 
                                    ? 'Manage your product sales and customer orders'
                                    : 'Track your orders and purchase history'
                                }
                            </p>
                        </div>
                        
                        {user.role === 'vendor' && (
                            <div className="page-actions">
                                <Link to="/vendor/products" className="btn btn-primary">
                                    📦 Manage Products
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Filters and Search */}
                    <div className="orders-filters">
                        <div className="filters-row">
                            <div className="search-group">
                                <input
                                    type="text"
                                    placeholder={`Search by order number, ${user.role === 'vendor' ? 'customer name...' : 'product name...'}`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                                <span className="search-icon">🔍</span>
                            </div>

                            <div className="filter-group">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="all">All Status</option>
                                    {Object.entries(orderStatuses).map(([key, status]) => (
                                        <option key={key} value={key}>{status.label}</option>
                                    ))}
                                </select>

                                <select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="3months">Last 3 Months</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Orders Summary (for vendors) */}
                    {user.role === 'vendor' && (
                        <div className="orders-summary">
                            <div className="summary-card">
                                <div className="summary-icon">📊</div>
                                <div className="summary-content">
                                    <h3>Total Orders</h3>
                                    <p className="summary-value">{filteredOrders.length}</p>
                                </div>
                            </div>
                            
                            <div className="summary-card">
                                <div className="summary-icon">💰</div>
                                <div className="summary-content">
                                    <h3>Total Revenue</h3>
                                    <p className="summary-value">
                                        {formatCurrency(filteredOrders.reduce((sum, order) => sum + order.total_amount, 0))}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="summary-card">
                                <div className="summary-icon">🎯</div>
                                <div className="summary-content">
                                    <h3>Your Earnings</h3>
                                    <p className="summary-value">
                                        {formatCurrency(filteredOrders.reduce((sum, order) => sum + (order.vendor_earnings || order.total_amount * 0.85), 0))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Orders List */}
                    <div className="orders-list">
                        {loading ? (
                            <div className="loading-container">
                                <div className="loading-spinner"></div>
                                <p>Loading orders...</p>
                            </div>
                        ) : error ? (
                            <div className="error-container">
                                <div className="error-icon">❌</div>
                                <h3>Error Loading Orders</h3>
                                <p>{error}</p>
                                <button 
                                    onClick={() => window.location.reload()} 
                                    className="btn btn-primary"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="empty-container">
                                <div className="empty-icon">📦</div>
                                <h3>No Orders Found</h3>
                                <p>
                                    {user.role === 'vendor' 
                                        ? 'No customer orders match your current filters.'
                                        : 'You haven\'t placed any orders yet.'
                                    }
                                </p>
                                {user.role !== 'vendor' && (
                                    <Link to="/products" className="btn btn-primary">
                                        Start Shopping
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="orders-grid">
                                {filteredOrders.map(order => (
                                    <div key={order.id} className="order-card">
                                        <div className="order-header">
                                            <div className="order-number">
                                                <strong>{order.order_number}</strong>
                                                <span className="order-date">
                                                    {formatDate(order.order_date)}
                                                </span>
                                            </div>
                                            <div className={`order-status status-${order.status}`}>
                                                {orderStatuses[order.status]?.label || order.status}
                                            </div>
                                        </div>

                                        <div className="order-content">
                                            {user.role === 'vendor' && (
                                                <div className="customer-info">
                                                    <div className="customer-name">
                                                        <strong>{order.customer_name}</strong>
                                                    </div>
                                                    <div className="customer-email">
                                                        {order.customer_email}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="order-items">
                                                <div className="items-header">
                                                    <span>Items ({order.items.length})</span>
                                                </div>
                                                <div className="items-list">
                                                    {order.items.slice(0, 2).map((item, index) => (
                                                        <div key={index} className="item">
                                                            <span className="item-name">{item.name}</span>
                                                            <span className="item-details">
                                                                Qty: {item.quantity} × {formatCurrency(item.price)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {order.items.length > 2 && (
                                                        <div className="more-items">
                                                            +{order.items.length - 2} more items
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="order-summary">
                                                <div className="order-total">
                                                    <span>Total: <strong>{formatCurrency(order.total_amount)}</strong></span>
                                                </div>
                                                {user.role === 'vendor' && order.vendor_earnings && (
                                                    <div className="vendor-earnings">
                                                        <span>Your Earnings: <strong>{formatCurrency(order.vendor_earnings)}</strong></span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="order-actions">
                                            <button 
                                                onClick={() => showOrderDetailsModal(order)}
                                                className="btn btn-secondary"
                                            >
                                                View Details
                                            </button>
                                            
                                            {user.role === 'vendor' && (
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                                    className="status-select"
                                                >
                                                    {Object.entries(orderStatuses).map(([key, status]) => (
                                                        <option key={key} value={key}>{status.label}</option>
                                                    ))}
                                                </select>
                                            )}
                                            
                                            {order.tracking_number && (
                                                <button className="btn btn-outline">
                                                    Track Package
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Order Details Modal */}
            {showOrderDetails && selectedOrder && (
                <div className="modal-overlay" onClick={closeOrderDetails}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Order Details</h2>
                            <button onClick={closeOrderDetails} className="modal-close">×</button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="order-details-grid">
                                <div className="details-section">
                                    <h3>Order Information</h3>
                                    <div className="detail-row">
                                        <span>Order Number:</span>
                                        <span>{selectedOrder.order_number}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>Order Date:</span>
                                        <span>{formatDate(selectedOrder.order_date)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>Status:</span>
                                        <span className={`order-status status-${selectedOrder.status}`}>
                                            {orderStatuses[selectedOrder.status]?.label || selectedOrder.status}
                                        </span>
                                    </div>
                                    {selectedOrder.tracking_number && (
                                        <div className="detail-row">
                                            <span>Tracking Number:</span>
                                            <span>{selectedOrder.tracking_number}</span>
                                        </div>
                                    )}
                                </div>

                                {user.role === 'vendor' && (
                                    <div className="details-section">
                                        <h3>Customer Information</h3>
                                        <div className="detail-row">
                                            <span>Name:</span>
                                            <span>{selectedOrder.customer_name}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span>Email:</span>
                                            <span>{selectedOrder.customer_email}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="details-section">
                                    <h3>Shipping Information</h3>
                                    <div className="detail-row">
                                        <span>Address:</span>
                                        <span>{selectedOrder.shipping_address}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>Payment Method:</span>
                                        <span>{selectedOrder.payment_method}</span>
                                    </div>
                                </div>

                                <div className="details-section full-width">
                                    <h3>Order Items</h3>
                                    <div className="items-table">
                                        <div className="table-header">
                                            <span>Product</span>
                                            <span>Quantity</span>
                                            <span>Price</span>
                                            <span>Total</span>
                                        </div>
                                        {selectedOrder.items.map((item, index) => (
                                            <div key={index} className="table-row">
                                                <span>{item.name}</span>
                                                <span>{item.quantity}</span>
                                                <span>{formatCurrency(item.price)}</span>
                                                <span>{formatCurrency(item.price * item.quantity)}</span>
                                            </div>
                                        ))}
                                        <div className="table-footer">
                                            <span></span>
                                            <span></span>
                                            <span><strong>Total:</strong></span>
                                            <span><strong>{formatCurrency(selectedOrder.total_amount)}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}

export default Orders;