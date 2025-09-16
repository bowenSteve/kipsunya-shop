import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useCart } from "../context/CartContext";
import "../styles/ProductCard.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API_BASE_URL from '../config'

// Icons used within the product card body
const BuyNowIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg> );
const AddToCartIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> );

function ProductCard() {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    // Contexts
    const { isAuthenticated } = useUser();
    const { addToCart, loading: cartLoading, getProductQuantityInCart, isInCart } = useCart();

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

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/product/${id}`, message: 'Please log in to add items to your cart.' } });
            return;
        }

        const result = await addToCart(product.id, quantity, {
            onSuccess: (message) => {
                setSuccessMessage(message);
                setErrorMessage(null);
                setTimeout(() => setSuccessMessage(null), 3000);
            },
            onError: (error) => {
                setErrorMessage(error);
                setSuccessMessage(null);
                setTimeout(() => setErrorMessage(null), 5000);
            }
        });
    };

    const handleBuyNow = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/product/${id}`, message: 'Please log in to purchase items.' } });
            return;
        }
        
        navigate('/checkout', { state: { product, quantity: quantity, directPurchase: true } });
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
                            {product.featured && <span className="product-card-featured-badge">Featured</span>}
                            <img 
                                src={product.image_url || '/api/placeholder/600/600'} 
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

                        {/* Success/Error Messages */}
                        {successMessage && (
                            <div className="product-card-message success">
                                ✅ {successMessage}
                            </div>
                        )}
                        {errorMessage && (
                            <div className="product-card-message error">
                                ❌ {errorMessage}
                            </div>
                        )}

                        {/* Cart Status */}
                        {isAuthenticated && isInCart(product.id) && (
                            <div className="product-card-cart-status">
                                🛒 {getProductQuantityInCart(product.id)} in cart
                            </div>
                        )}

                        {product.in_stock ? (
                            <div className="product-card-purchase-section">
                                <div className="product-card-quantity-selector">
                                    <label htmlFor="quantity">Quantity</label>
                                    <div className="product-card-quantity-controls">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            disabled={quantity <= 1}
                                            className="quantity-btn decrease"
                                        >
                                            −
                                        </button>
                                        <input
                                            id="quantity"
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => {
                                                const value = Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1));
                                                setQuantity(value);
                                            }}
                                            min="1"
                                            max={product.stock_quantity}
                                            className="quantity-input"
                                        />
                                        <button
                                            onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                                            disabled={quantity >= product.stock_quantity}
                                            className="quantity-btn increase"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="quantity-info">
                                        {quantity > 1 && (
                                            <span className="quantity-total">
                                                Total: {formatPrice(product.price * quantity)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="product-card-action-buttons">
                                    <button
                                        className="product-card-add-to-cart"
                                        onClick={handleAddToCart}
                                        disabled={cartLoading}
                                    >
                                        {cartLoading ? (
                                            <>
                                                <div className="product-card-button-spinner"></div>
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <AddToCartIcon />
                                                Add to Cart
                                            </>
                                        )}
                                    </button>
                                    <button className="product-card-buy-now" onClick={handleBuyNow}>
                                        <BuyNowIcon />
                                        Buy Now
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button className="product-card-out-of-stock" disabled>Out of Stock</button>
                        )}
                         {!isAuthenticated && (
                            <div className="product-card-auth-prompt">
                                <p><Link to="/login" state={{ from: `/product/${id}` }}>Log in</Link> or <Link to="/register">create an account</Link> to purchase.</p>
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