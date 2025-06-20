import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "../styles/Profile.css";
import Footer from "../components/Footer";

function Profile() {
    const [isEditing, setIsEditing] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    
    // Form data state
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', phone: '', address: '', city: '', country: '',
        date_of_birth: '', bio: '', business_name: '', business_description: '', business_type: '',
        tax_id: '', business_phone: '', business_email: '', business_address: '', website: '',
        social_media: { facebook: '', twitter: '', instagram: '', linkedin: '' },
        business_hours: {
            monday: { open: '09:00', close: '17:00', closed: false },
            tuesday: { open: '09:00', close: '17:00', closed: false },
            wednesday: { open: '09:00', close: '17:00', closed: false },
            thursday: { open: '09:00', close: '17:00', closed: false },
            friday: { open: '09:00', close: '17:00', closed: false },
            saturday: { open: '09:00', close: '17:00', closed: false },
            sunday: { open: '', close: '', closed: true }
        },
        shipping_policy: '', return_policy: '', terms_conditions: ''
    });

    const { isAuthenticated, user, logout, updateUserProfile, getAuthToken } = useUser();
    const navigate = useNavigate();

    // Redirect if not authenticated and initialize form
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (user) {
            setFormData({
                first_name: user.first_name || '', last_name: user.last_name || '',
                email: user.email || '', phone: user.phone || '', address: user.address || '',
                city: user.city || '', country: user.country || '',
                date_of_birth: user.date_of_birth || '', bio: user.bio || '',
                business_name: user.business_name || '', business_description: user.business_description || '',
                business_type: user.business_type || '', tax_id: user.tax_id || '',
                business_phone: user.business_phone || '', business_email: user.business_email || '',
                business_address: user.business_address || '', website: user.website || '',
                social_media: user.social_media || { facebook: '', twitter: '', instagram: '', linkedin: '' },
                business_hours: user.business_hours || {
                    monday: { open: '09:00', close: '17:00', closed: false },
                    tuesday: { open: '09:00', close: '17:00', closed: false },
                    wednesday: { open: '09:00', close: '17:00', closed: false },
                    thursday: { open: '09:00', close: '17:00', closed: false },
                    friday: { open: '09:00', close: '17:00', closed: false },
                    saturday: { open: '09:00', close: '17:00', closed: false },
                    sunday: { open: '', close: '', closed: true }
                },
                shipping_policy: user.shipping_policy || '', return_policy: user.return_policy || '',
                terms_conditions: user.terms_conditions || ''
            });
        }
    }, [isAuthenticated, navigate, user]);

    const handleVendorUpgrade = () => navigate('/upgrade-to-vendor');
    const toggleProfileMenu = () => setShowProfileMenu(!showProfileMenu);
    
    const handleLogout = async () => {
        await logout();
        setShowProfileMenu(false);
        navigate('/');
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showProfileMenu && !event.target.closest('.profile-dropdown')) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showProfileMenu]);

    // Handle form input changes (including nested objects)
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.includes('.')) {
            const keys = name.split('.');
            setFormData(prev => {
                const newData = { ...prev };
                let current = newData;
                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) current[keys[i]] = {};
                    current = current[keys[i]];
                }
                current[keys[keys.length - 1]] = type === 'checkbox' ? checked : value;
                return newData;
            });
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    // Handle form submission to update profile
    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError(null);
        setSuccess(null);
        try {
            const token = getAuthToken();
            const response = await fetch(`/api/auth/profile/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                const updatedUser = await response.json();
                await updateUserProfile(updatedUser);
                setSuccess('Profile updated successfully!');
                setIsEditing(false);
                setTimeout(() => setSuccess(null), 3000);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setError(error.message);
        } finally {
            setUpdating(false);
        }
    };
    
    // Toggle between edit and view mode
    const handleEditToggle = () => setIsEditing(!isEditing);

    // Helper functions for formatting and display
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : null;
    const getUserInitials = () => `${user?.first_name?.charAt(0) || ''}${user?.last_name?.charAt(0) || ''}`.toUpperCase() || 'U';
    
    const getDisplayName = () => {
        if (user.role === 'vendor' && user.business_name) return user.business_name;
        if (user.first_name || user.last_name) return `${user.first_name} ${user.last_name}`.trim();
        return 'Your Profile';
    };

    // Helper component for displaying data or a placeholder text
    const DisplayField = ({ value, placeholder = 'Not provided' }) => (
        <div className="form-display">
            {value ? value : <span className="placeholder-text">{placeholder}</span>}
        </div>
    );

    // Loading state
    if (!isAuthenticated || !user) {
        return (
            <div className="profile-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <header className="profile-header">
                <div className="header-container">
                    <Link to="/" className="logo">( Kipsunya ~ biz )</Link>
                    <nav className="header-nav">
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/products" className="nav-link">Products</Link>
                        <Link to="/about" className="nav-link">About</Link>
                    </nav>
                    <div className="header-actions">
                        <Link to="/search" className="search-icon">🔍</Link>
                        <Link to="/cart" className="cart-icon">🛒</Link>
                        <div className="profile-dropdown">
                            <button className="profile-button" onClick={toggleProfileMenu}>
                                <span className="profile-avatar">{getUserInitials()}</span>
                                <span className="profile-name">{user?.first_name || 'User'}</span>
                                <span className="dropdown-arrow">▼</span>
                            </button>
                            {showProfileMenu && (
                                <div className="profile-menu">
                                    <div className="profile-info">
                                        <p className="profile-email">{user?.email}</p>
                                        <p className="profile-role">{user?.role || 'Customer'}</p>
                                    </div>
                                    <hr />
                                    <Link to="/profile" className="menu-item active">👤 My Profile</Link>
                                    <Link to="/orders" className="menu-item">📦 My Orders</Link>
                                    <Link to="/cart" className="menu-item">🛒 My Cart</Link>
                                    <Link to="/settings" className="menu-item">⚙️ Settings</Link>
                                    {user?.role === 'vendor' && <><hr /><Link to="/vendor/dashboard" className="menu-item">🏪 Vendor Dashboard</Link></>}
                                    {user?.role === 'admin' && <><hr /><Link to="/admin" className="menu-item">🛡️ Admin Panel</Link></>}
                                    <hr />
                                    <button onClick={handleLogout} className="menu-item logout-item">🚪 Logout</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="profile-main">
                <div className="profile-container">
                    <div className="profile-card profile-header-section">
                        <div className="profile-avatar-large">{getUserInitials()}</div>
                        <div className="profile-header-info">
                            <h1 className="profile-title">{getDisplayName()}
                                {user.role === 'vendor' && user.business_name && user.first_name && (
                                    <span className="business-subtitle">{user.first_name} {user.last_name}</span>
                                )}
                            </h1>
                            <p className="profile-email-display">{user.email}</p>
                            <div className="profile-badges">
                                <span className="profile-role-badge">{user.role || 'Customer'}</span>
                                {user.role === 'vendor' && user.business_type && (
                                    <span className="business-type-badge">{user.business_type}</span>
                                )}
                            </div>
                        </div>
                        <div className="profile-actions">
                            <button className={`edit-button ${isEditing ? 'cancel' : 'edit'}`} onClick={handleEditToggle} disabled={updating}>
                                {isEditing ? '✕ Cancel' : '✏️ Edit Profile'}
                            </button>
                            {user.role === 'customer' && (
                                <button className="upgrade-vendor-button" onClick={handleVendorUpgrade}>
                                    🏪 Become a Vendor
                                </button>
                            )}
                        </div>
                    </div>

                    {success && <div className="message success-message">✅ {success}</div>}
                    {error && <div className="message error-message">❌ {error}</div>}

                    {user.role === 'customer' && !isEditing && (
                        <div className="upgrade-card">
                            <div className="upgrade-icon">🏪</div>
                            <div className="upgrade-content">
                                <h3>Start Selling on Kipsunya Biz</h3>
                                <p>Join thousands of vendors and start selling your products today. Get access to our powerful vendor dashboard, analytics, and reach customers across Kenya.</p>
                                <div className="upgrade-features">
                                    <span className="feature">📊 Sales Analytics</span>
                                    <span className="feature">📦 Order Management</span>
                                    <span className="feature">💰 Secure Payments</span>
                                    <span className="feature">🚚 Shipping Tools</span>
                                </div>
                            </div>
                            <div className="upgrade-action">
                                <button className="upgrade-cta-button" onClick={handleVendorUpgrade}>
                                    🚀 Upgrade Now <span className="upgrade-arrow">→</span>
                                </button>
                                <p className="upgrade-note">Free to start • 15% commission</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* PERSONAL INFORMATION CARD */}
                        <div className="profile-card form-section">
                            <h3 className="section-title">Personal Information</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="first_name">First Name</label>
                                    {isEditing ? <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} className="form-input" placeholder="Enter first name" /> : <DisplayField value={formData.first_name} />}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="last_name">Last Name</label>
                                    {isEditing ? <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleInputChange} className="form-input" placeholder="Enter last name" /> : <DisplayField value={formData.last_name} />}
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    {isEditing ? <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className="form-input" placeholder="Enter email address" required /> : <DisplayField value={formData.email} />}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number</label>
                                    {isEditing ? <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" placeholder="Enter phone number" /> : <DisplayField value={formData.phone} />}
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="date_of_birth">Date of Birth</label>
                                {isEditing ? <input type="date" id="date_of_birth" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} className="form-input" /> : <DisplayField value={formatDate(formData.date_of_birth)} />}
                            </div>
                        </div>

                        {/* LOCATION CARD */}
                        <div className="profile-card form-section">
                             <h3 className="section-title">{user.role === 'vendor' ? 'Personal Address' : 'Location'}</h3>
                             <div className="form-group">
                                <label htmlFor="address">Address</label>
                                {isEditing ? <textarea id="address" name="address" value={formData.address} onChange={handleInputChange} className="form-textarea" placeholder="Enter your address" rows="3" /> : <DisplayField value={formData.address} />}
                             </div>
                             <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="city">City</label>
                                    {isEditing ? <input type="text" id="city" name="city" value={formData.city} onChange={handleInputChange} className="form-input" placeholder="Enter city" /> : <DisplayField value={formData.city} />}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="country">Country</label>
                                    {isEditing ? <input type="text" id="country" name="country" value={formData.country} onChange={handleInputChange} className="form-input" placeholder="Enter country" /> : <DisplayField value={formData.country} />}
                                </div>
                             </div>
                        </div>
                        
                        {/* VENDOR INFORMATION CARD */}
                        {user.role === 'vendor' && (
                            <div className="profile-card form-section">
                                <h3 className="section-title">Business Information</h3>
                                <div className="form-group">
                                    <label htmlFor="business_name">Business Name</label>
                                    {isEditing ? <input type="text" id="business_name" name="business_name" value={formData.business_name} onChange={handleInputChange} className="form-input" placeholder="Enter business name"/> : <DisplayField value={formData.business_name}/>}
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="business_type">Business Type</label>
                                        {isEditing ? (
                                            <select id="business_type" name="business_type" value={formData.business_type} onChange={handleInputChange} className="form-input">
                                                <option value="">Select business type</option>
                                                <option value="Retail">Retail</option>
                                                <option value="Service">Service</option>
                                                <option value="Wholesale">Wholesale</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        ) : <DisplayField value={formData.business_type}/>}
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="tax_id">Tax ID</label>
                                        {isEditing ? <input type="text" id="tax_id" name="tax_id" value={formData.tax_id} onChange={handleInputChange} className="form-input" placeholder="Enter tax ID"/> : <DisplayField value={formData.tax_id ? '••••••••' : null} placeholder="Not provided"/>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {isEditing && (
                            <div className="form-actions">
                                <button type="submit" className="save-button" disabled={updating}>
                                    {updating ? (<><div className="button-spinner"></div>Saving...</>) : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </form>
                    
                    {!isEditing && (
                        <div className="profile-card account-info-section">
                            <h3 className="section-title">Account Information</h3>
                            <div className="account-info-grid">
                                <div className="info-item"><span className="info-label">Member since:</span><span className="info-value"><DisplayField value={formatDate(user.date_joined)} placeholder="Unknown" /></span></div>
                                <div className="info-item"><span className="info-label">Last login:</span><span className="info-value"><DisplayField value={formatDate(user.last_login)} placeholder="Unknown" /></span></div>
                                <div className="info-item"><span className="info-label">Account status:</span><span className="info-value"><span className="status-badge active">Active</span></span></div>
                                {user.role === 'vendor' && (
                                    <>
                                        <div className="info-item"><span className="info-label">Business verified:</span><span className="info-value"><span className={`status-badge ${user.business_verified ? 'active' : 'pending'}`}>{user.business_verified ? 'Verified' : 'Pending'}</span></span></div>
                                        <div className="info-item"><span className="info-label">Total products:</span><span className="info-value">{user.product_count || '0'}</span></div>
                                        <div className="info-item"><span className="info-label">Total orders:</span><span className="info-value">{user.order_count || '0'}</span></div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default Profile;