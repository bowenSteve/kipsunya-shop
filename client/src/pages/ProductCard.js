import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "../styles/ProductCard.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { FiStar, FiAlertCircle } from 'react-icons/fi';
import { IoDiamondOutline } from 'react-icons/io5';
import { FaStore } from 'react-icons/fa';
import API_BASE_URL from '../config'

// Icons
const PhoneIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg> );
const WhatsAppIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg> );
const LocationIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg> );

function ProductCard() {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [contactInfo, setContactInfo] = useState(null);
    const [revealingContact, setRevealingContact] = useState(false);
    const [revealError, setRevealError] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    // Contexts
    const { isAuthenticated, getAuthToken } = useUser();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch(`${API_BASE_URL}/api/products/${id}/`);
                
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const data = await response.json();
                
                if (data && data.success && data.product) {
                    setProduct(data.product);
                } else if (data && data.id) {
                    setProduct(data);
                } else {
                    throw new Error('Invalid product data format');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProduct();
        else {
            setError('No product ID provided');
            setLoading(false);
        }
    }, [id]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 2,
        }).format(price);
    };

    const handleRevealContact = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/product/${id}`, message: 'Please log in to view vendor contact information.' } });
            return;
        }

        setRevealingContact(true);
        setRevealError(null);

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/products/${id}/reveal-contact/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok && data.contact) {
                setContactInfo(data.contact);
            } else {
                setRevealError(data.error || 'Failed to retrieve contact information');
            }
        } catch (error) {
            console.error('Error revealing contact:', error);
            setRevealError('Network error. Please try again.');
        } finally {
            setRevealingContact(false);
        }
    };

    const handleBack = () => navigate(-1);

    if (loading) {
        return (
            <div className="product-card-page">
                <div className="product-card-loading">
                    <div className="product-card-spinner"></div>
                    <p>Loading Product Details...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="product-card-page">
                <div className="product-card-error">
                    <h2>Product Not Found</h2>
                    <p>{error || "The product you are looking for doesn't exist or has been removed."}</p>
                    <button onClick={handleBack} className="product-card-back-btn">Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
        <div className="product-card-page">
            <div className="product-card-container">
                <div className="product-card-breadcrumb">
                    <Link to="/">Home</Link>
                    <span>/</span>
                    <Link to="/products">Products</Link>
                    <span>/</span>
                    <span className="product-card-current">{product.name}</span>
                </div>

                <main className="product-card-main">
                    <div className="product-card-images">
                        <div className="product-card-main-image">
                            {product.vendor_tier === 'featured' && <span className="tier-badge featured-badge"><FiStar /> FEATURED</span>}
                            {product.vendor_tier === 'premium' && <span className="tier-badge premium-badge"><IoDiamondOutline /> PREMIUM</span>}
                            {product.vendor_tier === 'basic' && <span className="tier-badge basic-badge">BASIC</span>}
                            <img
                                src={product.image ? `${API_BASE_URL}${product.image}` : '/api/placeholder/600/600'}
                                alt={product.name}
                                onError={(e) => { e.target.src = '/api/placeholder/600/600'; }}
                            />
                        </div>
                    </div>

                    <div className="product-card-info">
                        {product.category && (
                            <span className="product-card-category">{product.category.name}</span>
                        )}
                        <h1 className="product-card-title">{product.name}</h1>
                        
                        <div className="product-card-price-stock-wrapper">
                            <span className="product-card-price">{formatPrice(product.price)}</span>
                            <div className="product-card-stock-info">
                                <span className={`product-card-stock-status ${product.in_stock ? 'in-stock' : 'out-of-stock'}`}>
                                    {product.in_stock ? 'In Stock' : 'Out of Stock'}
                                </span>
                                <span className="product-card-stock-count">({product.stock_quantity} available)</span>
                            </div>
                        </div>

                        <div className="product-card-description-short">
                            {product.description.split('\n')[0]}
                        </div>

                        {/* Vendor Information */}
                        {product.vendor_location && (
                            <div className="vendor-info-section">
                                <div className="vendor-info-item">
                                    <LocationIcon />
                                    <span>{product.vendor_location}</span>
                                </div>
                                {product.vendor_business && (
                                    <div className="vendor-info-item">
                                        <span className="business-name"><FaStore /> {product.vendor_business}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Contact Reveal Section */}
                        {!contactInfo ? (
                            <div className="contact-reveal-section">
                                {revealError && (
                                    <div className="product-card-message error">
                                        <FiAlertCircle /> {revealError}
                                    </div>
                                )}

                                {!isAuthenticated ? (
                                    <div className="contact-auth-prompt">
                                        <p><Link to="/login" state={{ from: `/product/${id}` }}>Log in</Link> or <Link to="/register">create an account</Link> to view vendor contact details.</p>
                                    </div>
                                ) : (
                                    <button
                                        className="reveal-contact-btn"
                                        onClick={handleRevealContact}
                                        disabled={revealingContact}
                                    >
                                        {revealingContact ? (
                                            <>
                                                <div className="product-card-button-spinner"></div>
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <PhoneIcon /> Show Vendor Contact
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="contact-info-revealed">
                                <h3>Vendor Contact Information</h3>
                                <div className="contact-details">
                                    {contactInfo.business_name && (
                                        <div className="contact-item">
                                            <span className="contact-label">Business:</span>
                                            <span className="contact-value">{contactInfo.business_name}</span>
                                        </div>
                                    )}
                                    {contactInfo.phone && (
                                        <div className="contact-item">
                                            <PhoneIcon />
                                            <a href={`tel:${contactInfo.phone}`} className="contact-link">
                                                {contactInfo.phone}
                                            </a>
                                        </div>
                                    )}
                                    {contactInfo.whatsapp && (
                                        <div className="contact-item">
                                            <WhatsAppIcon />
                                            <a
                                                href={`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="contact-link whatsapp"
                                            >
                                                {contactInfo.whatsapp}
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <p className="contact-hint">Click on phone or WhatsApp to contact the vendor directly</p>
                            </div>
                        )}
                    </div>
                </main>

                <section className="product-card-details-section">
                    <div className="product-card-description">
                        <h2>Product Description</h2>
                        <div className="product-card-description-content">
                            {product.description.split('\n').map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                        </div>
                    </div>

                    <div className="product-card-details">
                        <h2>Product Details</h2>
                        <div className="product-card-details-list">
                            <div className="product-card-detail-item">
                                <span>Product ID</span>
                                <span>{product.id}</span>
                            </div>
                            {product.category && (
                                <div className="product-card-detail-item">
                                    <span>Category</span>
                                    <span>{product.category.name}</span>
                                </div>
                            )}
                            <div className="product-card-detail-item">
                                <span>Availability</span>
                                <span>{product.stock_quantity} units</span>
                            </div>
                            {product.created_at && (
                                <div className="product-card-detail-item">
                                    <span>Date Added</span>
                                    <span>{new Date(product.created_at).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
            
            <Footer />
        </div>
        </div>
    );
}

export default ProductCard;