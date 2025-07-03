import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config';
import { useUser } from '../../context/UserContext';

function ProductList() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { getAuthToken } = useUser();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const token = getAuthToken();
                const response = await fetch(`${API_BASE_URL}/api/admin/products/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch products');
                const data = await response.json();
                setProducts(data.results || data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [getAuthToken]);

    const handleDelete = async (productId) => {
        if (!window.confirm('Are you sure you want to permanently delete this product?')) return;
        
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 204) {
                setProducts(products.filter(p => p.id !== productId));
                alert('Product deleted successfully.');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to delete product');
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };
    
    if (loading) return <div className="admin-loading">Loading Products...</div>;
    if (error) return <div className="admin-error">Error: {error}</div>;

    return (
        <div>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Manage Products</h1>
                <button className="admin-btn-primary">+ Add New Product</button>
            </div>
            <div className="admin-card">
                {products.length === 0 ? (
                    <div className="admin-empty">No products found.</div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Price (Ksh)</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id}>
                                    <td>{product.id}</td>
                                    <td>{product.name}</td>
                                    <td>{product.category?.name || 'N/A'}</td>
                                    <td>{product.price.toLocaleString()}</td>
                                    <td>{product.stock_quantity > 0 ? product.stock_quantity : <span className="text-danger">Out of Stock</span>}</td>
                                    <td><span className={`admin-status-badge status-${product.in_stock ? 'published' : 'draft'}`}>{product.in_stock ? 'Published' : 'Draft'}</span></td>
                                    <td className="admin-table-actions">
                                        <button className="admin-action-btn">Edit</button>
                                        <button onClick={() => handleDelete(product.id)} className="admin-action-btn btn-danger">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default ProductList;