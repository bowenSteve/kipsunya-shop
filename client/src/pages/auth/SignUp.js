// src/pages/auth/SignUp.js - FINAL FIX to prevent dashboard redirect
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext'; // Your correct path
import '../../styles/SignUp.css';

function SignUp() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [hasJustRegistered, setHasJustRegistered] = useState(false); // CRITICAL: Track registration
    
    // Get context functions and state
    const { register, isLoading, error, isAuthenticated, clearError } = useUser();
    const navigate = useNavigate();

    // CRITICAL: Only redirect if already authenticated AND not just registered
    useEffect(() => {
        // Only redirect to home if user was already authenticated before visiting this page
        // NOT if they just completed registration
        if (isAuthenticated && !hasJustRegistered && !registrationSuccess) {
            console.log('User already authenticated, redirecting to home');
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, hasJustRegistered, registrationSuccess, navigate]);

    // Clear error when component mounts
    useEffect(() => {
        clearError();
    }, [clearError]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) clearError();
    };

    const validateForm = () => {
        if (!formData.firstName.trim()) {
            throw new Error('First name is required');
        }
        if (!formData.lastName.trim()) {
            throw new Error('Last name is required');
        }
        if (!formData.email || !formData.email.includes('@')) {
            throw new Error('Please enter a valid email address');
        }
        if (formData.password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }
        if (formData.password !== formData.confirmPassword) {
            throw new Error('Passwords do not match');
        }
        if (!acceptTerms) {
            throw new Error('Please accept the terms and conditions');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            console.log('Starting registration...');
            
            // Client-side validation
            validateForm();

            // CRITICAL: Set flag before registration
            setHasJustRegistered(true);

            // Prepare user data for registration
            const userData = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                password: formData.password,
            };

            // Use the register function from context
            const result = await register(userData);
            
            console.log('Registration result:', result);
            
            if (result.success) {
                console.log('Registration successful, showing success screen');
                
                // Show success message
                setRegistrationSuccess(true);
                
                // Wait and redirect to login
                setTimeout(() => {
                    console.log('Redirecting to login page');
                    navigate('/login', { 
                        replace: true,
                        state: { 
                            message: 'Account created successfully! Please log in to continue.',
                            email: formData.email 
                        }
                    });
                }, 1500);
            } else {
                // Reset flag on error
                setHasJustRegistered(false);
            }
            
        } catch (err) {
            console.error('Registration error:', err.message);
            // Reset flag on error
            setHasJustRegistered(false);
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            console.log('Initiating Google sign up...');
            alert('Google sign up integration coming soon!');
        } catch (err) {
            console.error('Google sign up failed:', err);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    // Show success message - PREVENT any auth-based redirects here
    if (registrationSuccess) {
        return (
            <div className="signup-page">
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
                        <div className="text-6xl text-green-500 mb-4">✅</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Created!</h2>
                        <p className="text-gray-600 mb-4">
                            Your account has been successfully created. 
                            Redirecting you to the login page...
                        </p>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="signup-page">
            {/* Header */}
            <header className="signup-header">
                <div className="header-container">
                    <Link to="/" className="logo">
                        ( Kipsunya ~ biz )
                    </Link>
                    <nav className="header-nav">
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/products" className="nav-link">Products</Link>
                        <Link to="/about" className="nav-link">About</Link>
                    </nav>
                </div>
            </header>

            {/* Debug Info */}
            <div style={{ 
                position: 'fixed', 
                top: 0, 
                right: 0, 
                background: 'black', 
                color: 'white', 
                padding: '10px', 
                fontSize: '12px',
                zIndex: 9999 
            }}>
                Debug: Auth={isAuthenticated ? 'true' : 'false'}, 
                Loading={isLoading ? 'true' : 'false'}, 
                JustReg={hasJustRegistered ? 'true' : 'false'},
                Success={registrationSuccess ? 'true' : 'false'}
            </div>

            {/* Main Content */}
            <main className="signup-main">
                <div className="signup-container">
                    {/* Left Side - Welcome Message */}
                    <div className="signup-welcome">
                        <div className="welcome-content">
                            <h1 className="welcome-title">Join Kipsunya!</h1>
                            <p className="welcome-subtitle">
                                Create your account to unlock exclusive deals, 
                                track your orders, and become part of our amazing community.
                            </p>
                            <div className="welcome-features">
                                <div className="feature-item">
                                    <span className="feature-icon">🎁</span>
                                    <span>Exclusive Member Deals</span>
                                </div>
                                <div className="feature-item">
                                    <span className="feature-icon">🚚</span>
                                    <span>Free Shipping Perks</span>
                                </div>
                                <div className="feature-item">
                                    <span className="feature-icon">⭐</span>
                                    <span>Early Access to Sales</span>
                                </div>
                                <div className="feature-item">
                                    <span className="feature-icon">💰</span>
                                    <span>Loyalty Rewards</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Sign Up Form */}
                    <div className="signup-form-section">
                        <div className="signup-form-container">
                            <div className="form-header">
                                <h2 className="form-title">Create Account</h2>
                                <p className="form-subtitle">
                                    Fill in your details to get started
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="error-message">
                                    <span className="error-icon">⚠️</span>
                                    {error}
                                </div>
                            )}

                            {/* Sign Up Form */}
                            <form onSubmit={handleSubmit} className="signup-form">
                                <div className="name-row">
                                    <div className="form-group">
                                        <label htmlFor="firstName" className="form-label">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            placeholder="Enter your first name"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="lastName" className="form-label">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            placeholder="Enter your last name"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email" className="form-label">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="Enter your email"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password" className="form-label">
                                        Password
                                    </label>
                                    <div className="password-input-container">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            placeholder="Create a password (min. 8 characters)"
                                            required
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={togglePasswordVisibility}
                                            className="password-toggle"
                                            disabled={isLoading}
                                        >
                                            {showPassword ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword" className="form-label">
                                        Confirm Password
                                    </label>
                                    <div className="password-input-container">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            placeholder="Confirm your password"
                                            required
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={toggleConfirmPasswordVisibility}
                                            className="password-toggle"
                                            disabled={isLoading}
                                        >
                                            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                    </div>
                                </div>

                                <div className="terms-checkbox">
                                    <label className="terms-label">
                                        <input 
                                            type="checkbox" 
                                            checked={acceptTerms}
                                            onChange={(e) => setAcceptTerms(e.target.checked)}
                                            disabled={isLoading}
                                        />
                                        <span className="checkmark"></span>
                                        I agree to the <Link to="/terms" className="terms-link">Terms of Service</Link> and <Link to="/privacy" className="terms-link">Privacy Policy</Link>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className="signup-button"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="button-spinner"></div>
                                            Creating Account...
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="divider">
                                <span className="divider-text">or sign up with</span>
                            </div>

                            {/* Google Sign Up */}
                            <button
                                onClick={handleGoogleSignUp}
                                className="google-signup-button"
                                disabled={isLoading}
                            >
                                <img 
                                    src="data:image/svg+xml,%3Csvg width='18' height='18' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z' fill='%234285F4'/%3E%3Cpath d='M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z' fill='%2334A853'/%3E%3Cpath d='M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z' fill='%23FBBC05'/%3E%3Cpath d='M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z' fill='%23EA4335'/%3E%3C/g%3E%3C/svg%3E" 
                                    alt="Google"
                                    className="google-icon"
                                />
                                Continue with Google
                            </button>

                            {/* Login Link */}
                            <div className="login-link">
                                Already have an account? 
                                <span className="signup-text" onClick={() => navigate('/login')}>
                                    Sign in
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default SignUp;