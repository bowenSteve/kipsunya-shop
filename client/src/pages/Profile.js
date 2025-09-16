import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "../styles/Profile.css";
import Footer from "../components/Footer";
import API_BASE_URL from "../config";

function Profile() {
    const [activeTab, setActiveTab] = useState('personal');
    const [editingField, setEditingField] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    
    // Form data state
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', phone: '', address: '', city: '', country: '',
        date_of_birth: '', bio: '', business_name: '', business_description: '', business_type: '',
        tax_id: '', business_phone: '', business_email: '', business_address: '', website: ''
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
                business_address: user.business_address || '', website: user.website || ''
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

    
    // Inline editing functions
    const handleEditField = (fieldName) => setEditingField(fieldName);
    const handleCancelEdit = () => setEditingField(null);

    const handleFieldUpdate = async (fieldName, value) => {
        setUpdating(true);
        setError(null);
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ [fieldName]: value })
            });

            if (response.ok) {
                const updatedUser = await response.json();
                await updateUserProfile(updatedUser);
                setFormData(prev => ({ ...prev, [fieldName]: value }));
                setEditingField(null);
                setSuccess(`${fieldName.replace('_', ' ')} updated successfully!`);
                setTimeout(() => setSuccess(null), 3000);
            } else {
                throw new Error('Failed to update field');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setUpdating(false);
        }
    };

    // Helper functions for formatting and display
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : null;
    const getUserInitials = () => `${user?.first_name?.charAt(0) || ''}${user?.last_name?.charAt(0) || ''}`.toUpperCase() || 'U';
    
    const getDisplayName = () => {
        if (user.role === 'vendor' && user.business_name) return user.business_name;
        if (user.first_name || user.last_name) return `${user.first_name} ${user.last_name}`.trim();
        return 'Your Profile';
    };

    // Enhanced display component with inline editing
    const EditableField = ({ label, fieldName, value, type = 'text', placeholder = 'Not provided', options = null }) => {
        const isEditing = editingField === fieldName;
        const [tempValue, setTempValue] = useState(value || '');

        useEffect(() => {
            setTempValue(value || '');
        }, [value]);

        const handleSave = () => {
            if (tempValue !== value) {
                handleFieldUpdate(fieldName, tempValue);
            } else {
                setEditingField(null);
            }
        };

        const handleKeyPress = (e) => {
            if (e.key === 'Enter' && type !== 'textarea') {
                handleSave();
            } else if (e.key === 'Escape') {
                setTempValue(value || '');
                handleCancelEdit();
            }
        };

        return (
            <div className="editable-field">
                <div className="field-header">
                    <label className="field-label">{label}</label>
                    {!isEditing && (
                        <button
                            className="edit-field-btn"
                            onClick={() => handleEditField(fieldName)}
                            title={`Edit ${label}`}
                        >
                            ✏️
                        </button>
                    )}
                </div>
                <div className="field-content">
                    {isEditing ? (
                        <div className="field-edit-container">
                            {type === 'select' ? (
                                <select
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    className="field-edit-input"
                                    autoFocus
                                >
                                    <option value="">Select {label.toLowerCase()}</option>
                                    {options?.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            ) : type === 'textarea' ? (
                                <textarea
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    className="field-edit-input field-edit-textarea"
                                    rows="3"
                                    autoFocus
                                />
                            ) : (
                                <input
                                    type={type}
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    className="field-edit-input"
                                    autoFocus
                                />
                            )}
                            <div className="field-edit-actions">
                                <button
                                    className="field-save-btn"
                                    onClick={handleSave}
                                    disabled={updating}
                                >
                                    {updating ? '💾' : '✅'}
                                </button>
                                <button
                                    className="field-cancel-btn"
                                    onClick={handleCancelEdit}
                                >
                                    ❌
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="field-display">
                            {value ? (
                                <span className="field-value">{value}</span>
                            ) : (
                                <span className="field-placeholder">{placeholder}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

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
                {success && <div className="message success-message">✅ {success}</div>}
                {error && <div className="message error-message">❌ {error}</div>}

                <div className="profile-layout">
                    {/* Sidebar */}
                    <aside className="profile-sidebar">
                        <div className="profile-summary">
                            <div className="profile-avatar-large">{getUserInitials()}</div>
                            <div className="profile-summary-info">
                                <h2 className="profile-name">{getDisplayName()}</h2>
                                <p className="profile-email">{user.email}</p>
                                <div className="profile-badges">
                                    <span className="profile-role-badge">{user.role || 'Customer'}</span>
                                    {user.role === 'vendor' && user.business_type && (
                                        <span className="business-type-badge">{user.business_type}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <nav className="profile-nav">
                            <button
                                className={`nav-tab ${activeTab === 'personal' ? 'active' : ''}`}
                                onClick={() => setActiveTab('personal')}
                            >
                                👤 Personal Info
                            </button>
                            {user.role === 'vendor' && (
                                <button
                                    className={`nav-tab ${activeTab === 'business' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('business')}
                                >
                                    🏪 Business Info
                                </button>
                            )}
                            <button
                                className={`nav-tab ${activeTab === 'account' ? 'active' : ''}`}
                                onClick={() => setActiveTab('account')}
                            >
                                ⚙️ Account Settings
                            </button>
                        </nav>

                        {user.role === 'customer' && (
                            <div className="upgrade-banner">
                                <div className="upgrade-banner-content">
                                    <h4>🏪 Become a Vendor</h4>
                                    <p>Start selling on Kipsunya Biz today</p>
                                    <button className="upgrade-banner-btn" onClick={handleVendorUpgrade}>
                                        Get Started
                                    </button>
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* Main Content */}
                    <div className="profile-content">

                        {/* Personal Information Tab */}
                        {activeTab === 'personal' && (
                            <div className="tab-content">
                                <div className="content-header">
                                    <h2>Personal Information</h2>
                                    <p>Manage your personal details and contact information.</p>
                                </div>

                                <div className="profile-section">
                                    <h3>Basic Information</h3>
                                    <div className="field-grid">
                                        <EditableField
                                            label="First Name"
                                            fieldName="first_name"
                                            value={formData.first_name}
                                            placeholder="Enter your first name"
                                        />
                                        <EditableField
                                            label="Last Name"
                                            fieldName="last_name"
                                            value={formData.last_name}
                                            placeholder="Enter your last name"
                                        />
                                    </div>
                                    <div className="field-grid">
                                        <EditableField
                                            label="Email Address"
                                            fieldName="email"
                                            value={formData.email}
                                            type="email"
                                            placeholder="Enter your email"
                                        />
                                        <EditableField
                                            label="Phone Number"
                                            fieldName="phone"
                                            value={formData.phone}
                                            type="tel"
                                            placeholder="Enter your phone number"
                                        />
                                    </div>
                                    <EditableField
                                        label="Date of Birth"
                                        fieldName="date_of_birth"
                                        value={formData.date_of_birth}
                                        type="date"
                                        placeholder="Select your date of birth"
                                    />
                                </div>

                                <div className="profile-section">
                                    <h3>Location</h3>
                                    <EditableField
                                        label="Address"
                                        fieldName="address"
                                        value={formData.address}
                                        type="textarea"
                                        placeholder="Enter your address"
                                    />
                                    <div className="field-grid">
                                        <EditableField
                                            label="City"
                                            fieldName="city"
                                            value={formData.city}
                                            placeholder="Enter your city"
                                        />
                                        <EditableField
                                            label="Country"
                                            fieldName="country"
                                            value={formData.country}
                                            placeholder="Enter your country"
                                        />
                                    </div>
                                </div>

                                {showAdvanced && (
                                    <div className="profile-section">
                                        <h3>Additional Information</h3>
                                        <EditableField
                                            label="Bio"
                                            fieldName="bio"
                                            value={formData.bio}
                                            type="textarea"
                                            placeholder="Tell us about yourself"
                                        />
                                    </div>
                                )}

                                <button
                                    className="show-advanced-btn"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                >
                                    {showAdvanced ? '🔼 Show Less' : '🔽 Show More'}
                                </button>
                            </div>
                        )}

                        {/* Business Information Tab */}
                        {activeTab === 'business' && user.role === 'vendor' && (
                            <div className="tab-content">
                                <div className="content-header">
                                    <h2>Business Information</h2>
                                    <p>Manage your business details and settings.</p>
                                </div>

                                <div className="profile-section">
                                    <h3>Business Details</h3>
                                    <EditableField
                                        label="Business Name"
                                        fieldName="business_name"
                                        value={formData.business_name}
                                        placeholder="Enter your business name"
                                    />
                                    <div className="field-grid">
                                        <EditableField
                                            label="Business Type"
                                            fieldName="business_type"
                                            value={formData.business_type}
                                            type="select"
                                            options={['Retail', 'Service', 'Wholesale', 'Manufacturing', 'Other']}
                                            placeholder="Select business type"
                                        />
                                        <EditableField
                                            label="Tax ID"
                                            fieldName="tax_id"
                                            value={formData.tax_id}
                                            placeholder="Enter tax identification number"
                                        />
                                    </div>
                                    <EditableField
                                        label="Business Description"
                                        fieldName="business_description"
                                        value={formData.business_description}
                                        type="textarea"
                                        placeholder="Describe your business"
                                    />
                                </div>

                                <div className="profile-section">
                                    <h3>Contact Information</h3>
                                    <div className="field-grid">
                                        <EditableField
                                            label="Business Phone"
                                            fieldName="business_phone"
                                            value={formData.business_phone}
                                            type="tel"
                                            placeholder="Enter business phone"
                                        />
                                        <EditableField
                                            label="Business Email"
                                            fieldName="business_email"
                                            value={formData.business_email}
                                            type="email"
                                            placeholder="Enter business email"
                                        />
                                    </div>
                                    <EditableField
                                        label="Business Address"
                                        fieldName="business_address"
                                        value={formData.business_address}
                                        type="textarea"
                                        placeholder="Enter business address"
                                    />
                                    <EditableField
                                        label="Website"
                                        fieldName="website"
                                        value={formData.website}
                                        type="url"
                                        placeholder="Enter website URL"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Account Settings Tab */}
                        {activeTab === 'account' && (
                            <div className="tab-content">
                                <div className="content-header">
                                    <h2>Account Settings</h2>
                                    <p>View your account information and manage settings.</p>
                                </div>

                                <div className="profile-section">
                                    <h3>Account Information</h3>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <span className="info-label">Member since</span>
                                            <span className="info-value">{formatDate(user.date_joined) || 'Unknown'}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Last login</span>
                                            <span className="info-value">{formatDate(user.last_login) || 'Unknown'}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Account status</span>
                                            <span className="status-badge active">Active</span>
                                        </div>
                                        {user.role === 'vendor' && (
                                            <>
                                                <div className="info-item">
                                                    <span className="info-label">Business verified</span>
                                                    <span className={`status-badge ${user.business_verified ? 'active' : 'pending'}`}>
                                                        {user.business_verified ? 'Verified' : 'Pending'}
                                                    </span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">Total products</span>
                                                    <span className="info-value">{user.product_count || '0'}</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">Total orders</span>
                                                    <span className="info-value">{user.order_count || '0'}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="profile-section">
                                    <h3>Quick Actions</h3>
                                    <div className="quick-actions">
                                        <button className="action-btn secondary">
                                            🔐 Change Password
                                        </button>
                                        <button className="action-btn secondary">
                                            📧 Update Email
                                        </button>
                                        <button className="action-btn secondary">
                                            📱 Two-Factor Auth
                                        </button>
                                        <button className="action-btn secondary">
                                            📄 Download Data
                                        </button>
                                        {user.role === 'customer' && (
                                            <button className="action-btn primary" onClick={handleVendorUpgrade}>
                                                🏪 Become a Vendor
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default Profile;