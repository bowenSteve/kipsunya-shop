// src/pages/auth/Login.js - Fixed to redirect to HOME page, not dashboard
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext'; // Your correct path
import '../../styles/Login.css';

function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    
    // Get context functions and state
    const { login, isLoading, error, isAuthenticated, clearError } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get success message and email from signup redirect
    const signupMessage = location.state?.message;
    const prefillEmail = location.state?.email;

    // Redirect if already authenticated - GO TO HOME PAGE
    useEffect(() => {
        if (isAuthenticated) {
            console.log('Login - User already authenticated, redirecting to HOME');
            navigate('/', { replace: true }); // ALWAYS go to HOME page
        }
    }, [isAuthenticated, navigate]);

    // Clear error when component mounts and prefill email if coming from signup
    useEffect(() => {
        clearError();
        if (prefillEmail) {
            setFormData(prev => ({ ...prev, email: prefillEmail }));
        }
    }, [clearError, prefillEmail]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) clearError();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            console.log('Login - Starting login process');
            
            // Basic validation
            if (!formData.email || !formData.password) {
                throw new Error('Please fill in all fields');
            }

            if (!formData.email.includes('@')) {
                throw new Error('Please enter a valid email address');
            }

            // Use the login function from context
            const result = await login(formData);
            
            console.log('Login - Login result:', result);
            
            if (result.success) {
                console.log('Login - Success! Redirecting to HOME PAGE');
                
                // CRITICAL: Always redirect to HOME page (/) not dashboard
                navigate('/', { 
                    replace: true,
                    state: { 
                        loginSuccess: true,
                        user: result.user 
                    }
                });
            }
            // Error handling is done by the context
            
        } catch (err) {
            // Handle client-side validation errors
            console.error('Login - Client-side error:', err.message);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            console.log('Initiating Google login...');
            alert('Google login integration coming soon!');
        } catch (err) {
            console.error('Google login failed:', err);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="login-page">
            {/* Debug Panel */}
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
                Login Debug: Auth={isAuthenticated ? 'true' : 'false'}, 
                Loading={isLoading ? 'true' : 'false'}
            </div>

            {/* Header */}
            <header className="login-header">
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

            {/* Main Content */}
            <main className="login-main">
                <div className="login-container">
                    {/* Left Side - Welcome Message */}
                    <div className="login-welcome">
                        <div className="welcome-content">
                            <h1 className="welcome-title">Welcome Back!</h1>
                            <p className="welcome-subtitle">
                                Sign in to your account to access exclusive products, 
                                track your orders, and enjoy personalized shopping experience.
                            </p>
                            <div className="welcome-features">
                                <div className="feature-item">
                                    <span className="feature-icon">🛒</span>
                                    <span>Easy Shopping Experience</span>
                                </div>
                                <div className="feature-item">
                                    <span className="feature-icon">📦</span>
                                    <span>Order Tracking</span>
                                </div>
                                <div className="feature-item">
                                    <span className="feature-icon">💎</span>
                                    <span>Exclusive Deals</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Login Form */}
                    <div className="login-form-section">
                        <div className="login-form-container">
                            <div className="form-header">
                                <h2 className="form-title">Sign In</h2>
                                <p className="form-subtitle">
                                    Enter your credentials to access your account
                                </p>
                            </div>

                            {/* Success Message from Signup */}
                            {signupMessage && (
                                <div className="success-message" style={{
                                    backgroundColor: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    color: '#166534',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span>✅</span>
                                    {signupMessage}
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="error-message">
                                    <span className="error-icon">⚠️</span>
                                    {error}
                                </div>
                            )}

                            {/* Login Form */}
                            <form onSubmit={handleSubmit} className="login-form">
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
                                            placeholder="Enter your password"
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

                                <div className="form-options">
                                    <label className="remember-me">
                                        <input type="checkbox" disabled={isLoading} />
                                        <span className="checkmark"></span>
                                        Remember me
                                    </label>
                                    <Link to="/forgot-password" className="forgot-link">
                                        Forgot Password?
                                    </Link>
                                </div>

                                <button
                                    type="submit"
                                    className="login-button"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="button-spinner"></div>
                                            Signing In...
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="divider">
                                <span className="divider-text">or continue with</span>
                            </div>

                            {/* Google Login */}
                            <button
                                onClick={handleGoogleLogin}
                                className="google-login-button"
                                disabled={isLoading}
                            >
                                <img 
                                    src="data:image/svg+xml,%3Csvg width='18' height='18' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z' fill='%234285F4'/%3E%3Cpath d='M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z' fill='%2334A853'/%3E%3Cpath d='M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z' fill='%23FBBC05'/%3E%3Cpath d='M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z' fill='%23EA4335'/%3E%3C/g%3E%3C/svg%3E" 
                                    alt="Google"
                                    className="google-icon"
                                />
                                Continue with Google
                            </button>

                            {/* Sign Up Link */}
                            <div className="signup-link">
                                Don't have an account? 
                                <span className="signup-text" onClick={() => navigate('/register')}>
                                    Sign up
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Login;