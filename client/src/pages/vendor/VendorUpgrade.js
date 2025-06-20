// Fixed VendorUpgrade.js - Key changes in handleSubmit function

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import "../../styles/VendorUpgrade.css";
import Footer from "../../components/Footer";

function VendorUpgrade() {
    const [currentStep, setCurrentStep] = useState(1);
    const [upgradeLoading, setUpgradeLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    
    // Form data for upgrade process
    const [upgradeData, setUpgradeData] = useState({
        // Business basics
        business_name: '',
        business_type: '',
        business_description: '',
        
        // Contact information
        business_phone: '',
        business_email: '',
        business_address: '',
        website: '',
        
        // Business details
        tax_id: '',
        years_in_business: '',
        number_of_employees: '',
        expected_monthly_sales: '',
        
        // Policies
        shipping_policy: '',
        return_policy: '',
        
        // Social media
        social_media: {
            facebook: '',
            instagram: '',
            twitter: '',
            linkedin: ''
        },
        
        // Agreement
        agree_to_terms: false,
        agree_to_commission: false
    });

    const { isAuthenticated, user, updateUserProfile, getAuthToken, logout } = useUser();
    const navigate = useNavigate();

    // Redirect if not authenticated or already a vendor
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        
        if (user?.role === 'vendor') {
            navigate('/vendor/dashboard');
            return;
        }
        
        if (user?.role === 'admin') {
            navigate('/admin');
            return;
        }
    }, [isAuthenticated, user, navigate]);

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            setUpgradeData(prev => ({
                ...prev,
                business_name: user.business_name || `${user.first_name} ${user.last_name}'s Business`,
                business_email: user.email || '',
                business_phone: user.phone || ''
            }));
        }
    }, [user]);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name.includes('.')) {
            // Handle nested fields like social_media.facebook
            const keys = name.split('.');
            setUpgradeData(prev => {
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
            setUpgradeData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    // Handle step navigation
    const nextStep = () => {
        if (validateCurrentStep()) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
            setError(null);
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setError(null);
    };

    // Validate current step
    const validateCurrentStep = () => {
        switch (currentStep) {
            case 1:
                if (!upgradeData.business_name.trim()) {
                    setError('Business name is required');
                    return false;
                }
                if (!upgradeData.business_type) {
                    setError('Please select a business type');
                    return false;
                }
                break;
            case 2:
                if (!upgradeData.business_email.trim()) {
                    setError('Business email is required');
                    return false;
                }
                break;
            case 3:
                if (!upgradeData.shipping_policy.trim()) {
                    setError('Shipping policy is required');
                    return false;
                }
                if (!upgradeData.return_policy.trim()) {
                    setError('Return policy is required');
                    return false;
                }
                break;
            case 4:
                if (!upgradeData.agree_to_terms) {
                    setError('You must agree to the terms and conditions');
                    return false;
                }
                if (!upgradeData.agree_to_commission) {
                    setError('You must agree to the commission structure');
                    return false;
                }
                break;
            default:
                break;
        }
        return true;
    };

    // FIXED: Handle form submission
    const handleSubmit = async () => {
        if (!validateCurrentStep()) return;

        setUpgradeLoading(true);
        setError(null);

        try {
            const token = getAuthToken();
            const response = await fetch(`/api/auth/upgrade-to-vendor/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(upgradeData)
            });

            const result = await response.json();

            if (result.success) {
                // Update user context with new user data and tokens
                await updateUserProfile({
                    ...result.user,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken
                });
                
                setSuccess('Congratulations! Your vendor account has been created successfully.');
                
                // Redirect to vendor dashboard after 3 seconds
                setTimeout(() => {
                    navigate('/vendor/dashboard');
                }, 3000);
            } else {
                throw new Error(result.message || 'Failed to upgrade to vendor account');
            }
        } catch (error) {
            console.error('Error upgrading to vendor:', error);
            setError(error.message);
        } finally {
            setUpgradeLoading(false);
        }
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        const firstName = user?.first_name || '';
        const lastName = user?.last_name || '';
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
    };

    // Handle profile menu toggle
    const toggleProfileMenu = () => {
        setShowProfileMenu(!showProfileMenu);
    };

    // FIXED: Handle logout
    const handleLogout = async () => {
        await logout();
        navigate('/login');
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

    if (!isAuthenticated || !user) {
        return (
            <div className="vendor-upgrade-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="vendor-upgrade-page">
            {/* Header */}
            <header className="upgrade-header">
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
                                    <Link to="/orders" className="menu-item">
                                        📦 My Orders
                                    </Link>
                                    <Link to="/cart" className="menu-item">
                                        🛒 My Cart
                                    </Link>
                                    <Link to="/settings" className="menu-item">
                                        ⚙️ Settings
                                    </Link>
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

            {/* Main Content */}
            <main className="upgrade-main">
                <div className="upgrade-container">
                    {/* Page Header */}
                    <div className="page-header">
                        <h1 className="page-title">Become a Vendor</h1>
                        <p className="page-subtitle">
                            Join thousands of successful vendors and start selling your products today
                        </p>
                    </div>

                    {/* Benefits Cards */}
                    <div className="benefits-section">
                        <div className="benefits-grid">
                            <div className="benefit-item">
                                <div className="benefit-icon">📊</div>
                                <h3>Sales Analytics</h3>
                                <p>Track performance with detailed analytics</p>
                            </div>
                            <div className="benefit-item">
                                <div className="benefit-icon">📦</div>
                                <h3>Order Management</h3>
                                <p>Manage orders and inventory easily</p>
                            </div>
                            <div className="benefit-item">
                                <div className="benefit-icon">💰</div>
                                <h3>Secure Payments</h3>
                                <p>Get paid securely and on time</p>
                            </div>
                            <div className="benefit-item">
                                <div className="benefit-icon">🚚</div>
                                <h3>Shipping Tools</h3>
                                <p>Streamlined shipping solutions</p>
                            </div>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="progress-container">
                        <div className="step-indicators">
                            {[1, 2, 3, 4].map((step) => (
                                <div 
                                    key={step} 
                                    className={`step-indicator ${currentStep >= step ? 'active' : ''}`}
                                >
                                    <div className="step-circle">
                                        {currentStep > step ? '✓' : step}
                                    </div>
                                    <span className="step-label">
                                        {step === 1 && 'Business Info'}
                                        {step === 2 && 'Contact Details'}
                                        {step === 3 && 'Policies'}
                                        {step === 4 && 'Agreement'}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="progress-line">
                            <div 
                                className="progress-fill" 
                                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="alert alert-success">
                            <strong>Success!</strong> {success}
                            <br />
                            <small>Redirecting you to your vendor dashboard...</small>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="alert alert-error">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {/* Form Container */}
                    {!success && (
                        <div className="form-container">
                            <div className="form-header">
                                <h2>
                                    {currentStep === 1 && 'Business Information'}
                                    {currentStep === 2 && 'Contact Details'}
                                    {currentStep === 3 && 'Business Policies'}
                                    {currentStep === 4 && 'Terms & Agreement'}
                                </h2>
                                <p>
                                    {currentStep === 1 && 'Tell us about your business'}
                                    {currentStep === 2 && 'How can customers reach you?'}
                                    {currentStep === 3 && 'Set your business policies'}
                                    {currentStep === 4 && 'Review and accept our terms'}
                                </p>
                            </div>

                            <div className="form-content">
                                {/* Step 1: Business Information */}
                                {currentStep === 1 && (
                                    <div className="form-step">
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Business Name *</label>
                                                <input
                                                    type="text"
                                                    name="business_name"
                                                    value={upgradeData.business_name}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                    placeholder="Enter your business name"
                                                    required
                                                />
                                            </div>
                                            
                                            <div className="form-group">
                                                <label>Business Type *</label>
                                                <select
                                                    name="business_type"
                                                    value={upgradeData.business_type}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                    required
                                                >
                                                    <option value="">Select business type</option>
                                                    <option value="retail">Retail</option>
                                                    <option value="wholesale">Wholesale</option>
                                                    <option value="service">Service Provider</option>
                                                    <option value="manufacturing">Manufacturing</option>
                                                    <option value="restaurant">Restaurant/Food</option>
                                                    <option value="technology">Technology</option>
                                                    <option value="consulting">Consulting</option>
                                                    <option value="arts_crafts">Arts & Crafts</option>
                                                    <option value="fashion">Fashion & Clothing</option>
                                                    <option value="electronics">Electronics</option>
                                                    <option value="home_garden">Home & Garden</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div className="form-group">
                                            <label>Business Description</label>
                                            <textarea
                                                name="business_description"
                                                value={upgradeData.business_description}
                                                onChange={handleInputChange}
                                                className="form-control"
                                                placeholder="Describe what your business does..."
                                                rows="4"
                                            />
                                        </div>
                                        
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Years in Business</label>
                                                <select
                                                    name="years_in_business"
                                                    value={upgradeData.years_in_business}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                >
                                                    <option value="">Select experience</option>
                                                    <option value="new">Just starting</option>
                                                    <option value="1-2">1-2 years</option>
                                                    <option value="3-5">3-5 years</option>
                                                    <option value="6-10">6-10 years</option>
                                                    <option value="10+">10+ years</option>
                                                </select>
                                            </div>
                                            
                                            <div className="form-group">
                                                <label>Expected Monthly Sales (KES)</label>
                                                <select
                                                    name="expected_monthly_sales"
                                                    value={upgradeData.expected_monthly_sales}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                >
                                                    <option value="">Select range</option>
                                                    <option value="0-50000">0 - 50,000</option>
                                                    <option value="50000-100000">50,000 - 100,000</option>
                                                    <option value="100000-500000">100,000 - 500,000</option>
                                                    <option value="500000-1000000">500,000 - 1,000,000</option>
                                                    <option value="1000000+">1,000,000+</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Contact Information */}
                                {currentStep === 2 && (
                                    <div className="form-step">
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Business Email *</label>
                                                <input
                                                    type="email"
                                                    name="business_email"
                                                    value={upgradeData.business_email}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                    placeholder="business@example.com"
                                                    required
                                                />
                                            </div>
                                            
                                            <div className="form-group">
                                                <label>Business Phone</label>
                                                <input
                                                    type="tel"
                                                    name="business_phone"
                                                    value={upgradeData.business_phone}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                    placeholder="+254 700 000 000"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="form-group">
                                            <label>Business Address</label>
                                            <textarea
                                                name="business_address"
                                                value={upgradeData.business_address}
                                                onChange={handleInputChange}
                                                className="form-control"
                                                placeholder="Your business physical address"
                                                rows="3"
                                            />
                                        </div>
                                        
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Website (Optional)</label>
                                                <input
                                                    type="url"
                                                    name="website"
                                                    value={upgradeData.website}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                    placeholder="https://www.yourbusiness.com"
                                                />
                                            </div>
                                            
                                            <div className="form-group">
                                                <label>Tax ID / Business Registration</label>
                                                <input
                                                    type="text"
                                                    name="tax_id"
                                                    value={upgradeData.tax_id}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                    placeholder="Business registration number"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="social-media-section">
                                            <h4>Social Media (Optional)</h4>
                                            <div className="form-grid">
                                                <div className="form-group">
                                                    <label>Facebook</label>
                                                    <input
                                                        type="url"
                                                        name="social_media.facebook"
                                                        value={upgradeData.social_media.facebook}
                                                        onChange={handleInputChange}
                                                        className="form-control"
                                                        placeholder="https://facebook.com/yourbusiness"
                                                    />
                                                </div>
                                                
                                                <div className="form-group">
                                                    <label>Instagram</label>
                                                    <input
                                                        type="url"
                                                        name="social_media.instagram"
                                                        value={upgradeData.social_media.instagram}
                                                        onChange={handleInputChange}
                                                        className="form-control"
                                                        placeholder="https://instagram.com/yourbusiness"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Business Policies */}
                                {currentStep === 3 && (
                                    <div className="form-step">
                                        <div className="form-group">
                                            <label>Shipping Policy *</label>
                                            <textarea
                                                name="shipping_policy"
                                                value={upgradeData.shipping_policy}
                                                onChange={handleInputChange}
                                                className="form-control"
                                                placeholder="Describe your shipping methods, delivery times, and costs..."
                                                rows="6"
                                                required
                                            />
                                            <small className="form-help">
                                                Example: "We offer nationwide delivery within 3-7 business days. Free shipping on orders over KES 2,000."
                                            </small>
                                        </div>
                                        
                                        <div className="form-group">
                                            <label>Return & Refund Policy *</label>
                                            <textarea
                                                name="return_policy"
                                                value={upgradeData.return_policy}
                                                onChange={handleInputChange}
                                                className="form-control"
                                                placeholder="Describe your return conditions and refund process..."
                                                rows="6"
                                                required
                                            />
                                            <small className="form-help">
                                                Example: "30-day return policy for unused items. Customer pays return shipping."
                                            </small>
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Terms & Agreement */}
                                {currentStep === 4 && (
                                    <div className="form-step">
                                        <div className="commission-info">
                                            <h4>Commission Structure</h4>
                                            <div className="commission-card">
                                                <div className="commission-rate">15%</div>
                                                <div className="commission-details">
                                                    <p><strong>Platform Commission</strong></p>
                                                    <ul>
                                                        <li>Payment processing</li>
                                                        <li>Platform hosting & maintenance</li>
                                                        <li>Customer support</li>
                                                        <li>Marketing & promotion</li>
                                                        <li>Order management tools</li>
                                                        <li>Analytics & reporting</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="responsibilities-info">
                                            <h4>Vendor Responsibilities</h4>
                                            <ul>
                                                <li>Provide accurate product information</li>
                                                <li>Maintain adequate inventory levels</li>
                                                <li>Process orders within 24-48 hours</li>
                                                <li>Provide excellent customer service</li>
                                                <li>Honor shipping and return policies</li>
                                                <li>Comply with applicable laws</li>
                                            </ul>
                                        </div>
                                        
                                        <div className="agreement-section">
                                            <div className="checkbox-group">
                                                <label className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        name="agree_to_terms"
                                                        checked={upgradeData.agree_to_terms}
                                                        onChange={handleInputChange}
                                                    />
                                                    <span className="checkmark"></span>
                                                    I agree to the <Link to="/vendor-terms" target="_blank">Vendor Terms & Conditions</Link>
                                                </label>
                                                
                                                <label className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        name="agree_to_commission"
                                                        checked={upgradeData.agree_to_commission}
                                                        onChange={handleInputChange}
                                                    />
                                                    <span className="checkmark"></span>
                                                    I agree to the 15% commission structure
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="form-actions">
                                {currentStep > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={prevStep}
                                        className="btn btn-secondary"
                                        disabled={upgradeLoading}
                                    >
                                        Previous
                                    </button>
                                )}
                                
                                {currentStep < 4 ? (
                                    <button 
                                        type="button" 
                                        onClick={nextStep}
                                        className="btn btn-primary"
                                        disabled={upgradeLoading}
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button 
                                        type="button" 
                                        onClick={handleSubmit}
                                        className="btn btn-success"
                                        disabled={upgradeLoading || !upgradeData.agree_to_terms || !upgradeData.agree_to_commission}
                                    >
                                        {upgradeLoading ? (
                                            <>
                                                <span className="spinner"></span>
                                                Creating Account...
                                            </>
                                        ) : (
                                            'Create Vendor Account'
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Support Section */}
                    <div className="support-section">
                        <h3>Need Help?</h3>
                        <p>Our support team is here to help you get started</p>
                        <div className="support-links">
                            <a href="mailto:vendor-support@kipsunya.com" className="support-link">
                                Email Support
                            </a>
                            <a href="tel:+254700000000" className="support-link">
                                Call Us
                            </a>
                            <Link to="/vendor-faq" className="support-link">
                                FAQ
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default VendorUpgrade;