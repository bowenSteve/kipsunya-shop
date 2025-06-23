import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import "../styles/Products.css";

function Products() {
    const [allProducts, setAllProducts] = useState([]);
    const [displayedProducts, setDisplayedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    
    // States for filtering and sorting
    const [searchTerm, setSearchTerm] = useState(""); // Live value from input
    const [appliedSearchTerm, setAppliedSearchTerm] = useState(""); // Value used for filtering
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentSort, setCurrentSort] = useState('name');
    
    // States for pagination
    const [itemsPerPage] = useState(30);
    const [currentPage, setCurrentPage] = useState(1);

    const navigate = useNavigate();

    // Effect to fetch initial data
    // Replace your existing initial data fetching useEffect with this one.

useEffect(() => {
    // This function will now handle fetching all pages from the paginated API
    const fetchAllProducts = async () => {
        try {
            setLoading(true);
            let allFetchedProducts = [];
            let nextUrl = '/api/all_products/'; // Start with the initial URL

            // Loop as long as there is a 'next' URL to follow
            while (nextUrl) {
                const response = await fetch(nextUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                // Add the results from the current page to our master list
                if (data.results && Array.isArray(data.results)) {
                    allFetchedProducts.push(...data.results);
                }
                
                // Update the nextUrl to the one provided in the API response.
                // If data.next is null, the loop will terminate.
                nextUrl = data.next;
            }

            // Now we have all 84 products
            setAllProducts(allFetchedProducts);

            // Derive categories from the complete list
            const uniqueCategories = [...new Set(allFetchedProducts.map(p => p.category?.name).filter(Boolean))];
            setCategories(uniqueCategories);

        } catch (err) {
            console.error('Error fetching all products:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    fetchAllProducts();
}, []); // This effect still only runs once on component mount
    
    // --- CHANGE 1: Add a useEffect to automatically reset the search ---
    // This hook watches the live searchTerm from the input.
    useEffect(() => {
        // If the user clears the input field, automatically reset the applied search term.
        if (searchTerm.trim() === "") {
            setAppliedSearchTerm("");
        }
    }, [searchTerm]);


    const activeProducts = useMemo(() => {
        let processedProducts = [...allProducts];

        if (selectedCategory !== 'all') {
            processedProducts = processedProducts.filter(p => p.category?.name === selectedCategory);
        }

        // This still filters based on the applied term, which is now controlled by both
        // the search button and the automatic reset effect.
        if (appliedSearchTerm.trim() !== '') {
            const lowercasedTerm = appliedSearchTerm.toLowerCase().trim();
            processedProducts = processedProducts.filter(p => 
                p.name.toLowerCase().includes(lowercasedTerm) || 
                (p.description || '').toLowerCase().includes(lowercasedTerm)
            );
        }

        switch (currentSort) {
            case 'price-low':
                processedProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                break;
            case 'price-high':
                processedProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                break;
            case 'newest':
                processedProducts.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                break;
            case 'name':
            default:
                processedProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }
        return processedProducts;
    }, [allProducts, selectedCategory, appliedSearchTerm, currentSort]);

    useEffect(() => {
        setDisplayedProducts(activeProducts.slice(0, itemsPerPage));
        setCurrentPage(1);
    }, [activeProducts, itemsPerPage]);

    // --- CHANGE 2: The search handler remains the same, focused on applying the term ---
    const handleSearch = () => {
        setAppliedSearchTerm(searchTerm);
    };

    const handleSortChange = (e) => setCurrentSort(e.target.value);
    const handleLoadMore = () => {
        setLoadingMore(true);
        setTimeout(() => {
            const nextPage = currentPage + 1;
            const endIndex = nextPage * itemsPerPage;
            setDisplayedProducts(activeProducts.slice(0, endIndex));
            setCurrentPage(nextPage);
            setLoadingMore(false);
        }, 500);
    };

    const hasMoreItems = displayedProducts.length < activeProducts.length;
    const formatPrice = (price) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KES' }).format(price);
    const truncateName = (name, maxLength = 50) => name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
    const handleProductClick = (product) => navigate(`/product/${product.id}`);
    
    return (
        <div className="products-page">
            <Navbar />
            <div className="products-controls">
                <div className="controls-container">
                    <div className="controls-left">
                        <Link to="/" className="back-to-home-link">← Back to Home</Link>
                        <div className="filter-container">
                            <select className="category-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                <option value="all">All Categories</option>
                                {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                            </select>
                        </div>
                    </div>
                    <div className="controls-center">
                        <div className="search-container">
                            <input 
                                type="text" 
                                placeholder="Search products..." 
                                className="search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                            />
                            <button className="search-button" onClick={handleSearch}>🔍</button>
                        </div>
                    </div>
                    <div className="controls-right">
                        <div className="sort-container">
                            <select className="sort-select" value={currentSort} onChange={handleSortChange}>
                                <option value="name">Sort by Name</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="newest">Newest First</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <main className="products-main">
                {/* ... (The rest of the JSX is unchanged and will work correctly) ... */}
                 {loading && <div className="loading-container"><p>Loading...</p></div>}
                {error && <div className="error-container"><p>Error: {error}</p></div>}
                {!loading && !error && (
                    <>
                        <div className="products-count">
                            Showing {displayedProducts.length} of {activeProducts.length} products
                        </div>
                        <div className="products-grid">
                            {displayedProducts.length > 0 ? (
                                displayedProducts.map((product) => (
                                    <div key={product.id} className="product-card" onClick={() => handleProductClick(product)}>
                                        <div className="product-image-container">
                                            {product.featured && <span className="new-badge">FEATURED</span>}
                                            {product.image_url ? <img src={product.image_url} alt={product.name} className="product-image" /> : <div className="product-placeholder">{product.name}</div>}
                                        </div>
                                        <div className="product-info">
                                            <div className="product-main-info">
                                                <h3 className="product-title">{truncateName(product.name)}</h3>
                                                {product.category && <p className="product-category">{product.category.name}</p>}
                                            </div>
                                            <div className="product-footer-details">
                                                <p className="product-price">{formatPrice(product.price)}</p>
                                                <p className="product-availability">{product.in_stock ? `${product.stock_quantity} in stock` : 'Out of stock'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-products-found">
                                    <h3>No products found</h3>
                                    <p>Try adjusting your search or filter criteria.</p>
                                </div>
                            )}
                        </div>
                        {hasMoreItems && (
                            <div className="load-more-container">
                                <button onClick={handleLoadMore} disabled={loadingMore} className="load-more-button">
                                    {loadingMore ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default Products;