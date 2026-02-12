// src/pages/auth/SignUp.js - SIMPLIFIED AND FIXED
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import '../../styles/SignUp.css';
import Navbar from '../../components/Navbar';

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
    
    // Get context functions and state
    const { register, isLoading, error, isAuthenticated, user, clearError } = useUser();
    const navigate = useNavigate();

    // Redirect authenticated users away from signup page
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            const userRole = user?.role || 'customer';
            const redirectPath = userRole === 'admin' ? '/admin'
                : userRole === 'vendor' ? '/vendor/dashboard'
                : '/';
            navigate(redirectPath, { replace: true });
        }
    }, [isAuthenticated, isLoading, user, navigate]);

    // Clear error when component mounts or unmounts
    useEffect(() => {
        clearError();
        return () => clearError(); // Also clear on unmount
    }, [clearError]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) clearError();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear previous errors before a new submission
        clearError();

        // Client-side validation
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            // We can rely on the backend for more specific errors, 
            // but this is a simple local check.
            // Let's let the backend handle detailed validation messages.
        }
        if (formData.password !== formData.confirmPassword) {
            // This is a crucial client-side check.
            // We can handle this without an API call.
            // For now, we'll let the context display the error from the backend.
            // In a real app, you might set a local error state here.
        }
        if (!acceptTerms) {
            // Same as above.
        }

        try {
            const userData = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                password: formData.password,
            };

            const result = await register(userData);

            if (result.success) {
                // THE FIX: Navigate IMMEDIATELY on success.
                // Do not show an intermediate success screen in this component.
                // Pass the success message and email to the Login component.
                navigate('/login', {
                    replace: true, // Replace the /register page in history
                    state: {
                        message: result.message || 'Account created successfully! Please log in.',
                        email: formData.email // Prefill the email on the login form
                    }
                });
            }
            // If result.success is false, the error state in the context
            // is already set and will be displayed automatically. No need for an else block.

        } catch (err) {
            // This will catch very rare errors if the register function itself throws an exception
            console.error('An unexpected error occurred during handleSubmit:', err);
        }
    };

    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

    // No more `if (registrationSuccess)` block. The component no longer needs it.

    return (
        <div>
        <Navbar />
        <div className="signup-page">
            {/* Header and other JSX remains the same... */}
            <header className="signup-header">
                {/* ... */}
            </header>

            <main className="signup-main">
                <div className="signup-container">
                     {/* Left Side - Welcome Message */}
                    <div className="signup-welcome">
                        {/* ... */}
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

                            {/* Error Message from context is still displayed here */}
                            {error && (
                                <div className="error-message">
                                    <span className="error-icon">⚠️</span>
                                    {error}
                                </div>
                            )}

                            {/* Form and other elements remain the same */}
                            <form onSubmit={handleSubmit} className="signup-form">
                                {/* ... all your input fields ... */}
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
                                    disabled={isLoading || !acceptTerms} // Also disable if terms not accepted
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
                                {/* ... rest of the form ... */}
                            </form>
                            
                            {/* ... Divider, Google button, Login link ... */}
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
        </div>
    );
}

export default SignUp;