import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar'; // Import the new Navbar
import Footer from '../components/Footer';
import "../styles/LandingPage.css";

function LandingPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    
    // Fetch products when component mounts
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await fetch('https://kipsunya-shop.onrender.com/api/all_products/');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                if (data && data.results && Array.isArray(data.results)) {
                    setProducts(data.results);
                } else if (Array.isArray(data)) {
                    setProducts(data);
                    console.log(data)
                } else {
                    throw new Error('Unexpected API response format.');
                }
            } catch (err) {
                console.error('Error fetching products:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Helper function to format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'KES'
        }).format(price);
    };

    // Helper function to truncate product name
    const truncateName = (name, maxLength = 50) => {
        return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
    };

    // Handle product click
    const handleProductClick = (product) => {
        navigate(`/product/${product.id}`);
    };

    return (
        <div className="landing-page">
            {/* The entire header section is now replaced by the Navbar component */}
            <Navbar />

            {/* Main Content - This is the core responsibility of the LandingPage */}
            <main className="main-content">
                <div className="products-header">
                    <h2 className="products-title">Shop Products</h2>
                    <button className="view-all-button" onClick={() => navigate('/products')}>
                        View All
                        <span className="arrow-icon">→</span>
                    </button>
                </div>

                {loading && (
                    <div className="loading-container"><p>Loading products...</p></div>
                )}

                {error && (
                    <div className="error-container">
                        <p>Error loading products: {error}</p>
                        <button onClick={() => window.location.reload()}>Try Again</button>
                    </div>
                )}

                {!loading && !error && (
                    <div className="products-grid">
                        {products.length === 0 ? (
                            <div className="no-products"><p>No products available.</p></div>
                        ) : (
                            products.slice(0, 15).map((product) => (
                                <div 
                                    key={product.id} 
                                    className="product-card"
                                    onClick={() => handleProductClick(product)}
                                >
                                    <div className="product-image-container">
                                        {product.featured && <span className="new-badge">FEATURED</span>}
                                        {product.image_url ? (
                                            <img 
                                                src={product.image_url} 
                                                alt={product.name}
                                                className="product-image"
                                            />
                                        ) : (
                                            <div className="product-placeholder">{product.name}</div>
                                        )}
                                    </div>
                                    <div className="product-info">
                                        <h3 className="product-title">{truncateName(product.name)}</h3>
                                        {product.category && <p className="product-category">{product.category.name}</p>}
                                        <div className="product-details">
                                            <p className="product-price">{formatPrice(product.price)}</p>
                                            <p className="product-availability">
                                                {product.in_stock ? `${product.stock_quantity} in stock` : 'Out of stock'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {!loading && !error && products.length > 15 && (
                    <div className="products-footer">
                        <p>Showing 15 of {products.length} products</p>
                        <button className="view-all-footer-button" onClick={() => navigate('/products')}>
                            View All {products.length} Products
                        </button>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

export default LandingPage;