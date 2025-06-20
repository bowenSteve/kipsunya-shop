import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext'; // Adjust import path as needed
import '../../styles/Dashboard.css'; 

const VendorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    lowStockItems: 0
  });

  const { user, getAuthToken, logout, isAuthenticated } = useUser();
  const navigate = useNavigate();

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock_quantity: '',
    image_url: '',
    featured: false,
    is_active: true
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    slug: ''
  });

  // Check if user is vendor
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'vendor') {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // API calls
  const apiCall = async (url, options = {}) => {
    const token = getAuthToken();
    const response = await fetch(`/api${url}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  };

  // Fetch vendor products
  const fetchProducts = async () => {
    try {
      // Use the new vendor-specific endpoint
      const data = await apiCall('/vendor/products/');
      const vendorProducts = data.products || [];
      
      setProducts(vendorProducts);
      
      // Calculate stats
      const calculatedStats = {
        totalProducts: vendorProducts.length,
        totalSales: vendorProducts.reduce((sum, p) => sum + (p.total_sold || 0), 0),
        totalRevenue: vendorProducts.reduce((sum, p) => sum + ((p.total_sold || 0) * parseFloat(p.price || 0)), 0),
        lowStockItems: vendorProducts.filter(p => p.stock_quantity < 10).length
      };
      setStats(calculatedStats);
      
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to generic products endpoint and filter
      try {
        const fallbackData = await apiCall('/products/');
        const allProducts = fallbackData.results || fallbackData.products || [];
        const vendorProducts = allProducts.filter(product => 
          product.vendor_id === user?.id || product.vendor === user?.id
        );
        setProducts(vendorProducts);
        
        const calculatedStats = {
          totalProducts: vendorProducts.length,
          totalSales: vendorProducts.reduce((sum, p) => sum + (p.total_sold || 0), 0),
          totalRevenue: vendorProducts.reduce((sum, p) => sum + ((p.total_sold || 0) * parseFloat(p.price || 0)), 0),
          lowStockItems: vendorProducts.filter(p => p.stock_quantity < 10).length
        };
        setStats(calculatedStats);
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
        // Mock data for development
        const mockProducts = [
          {
            id: 1,
            name: 'Sample Product 1',
            description: 'This is a sample product description for testing the vendor dashboard functionality.',
            category: { id: 1, name: 'Electronics' },
            price: '29.99',
            stock_quantity: 15,
            featured: true,
            is_active: true,
            image_url: 'https://via.placeholder.com/300x200',
            total_sold: 25,
            created_at: '2025-06-17T10:00:00Z'
          },
          {
            id: 2,
            name: 'Sample Product 2',
            description: 'Another sample product for demonstration purposes.',
            category: { id: 2, name: 'Kitchen Ware' },
            price: '49.99',
            stock_quantity: 5,
            featured: false,
            is_active: true,
            image_url: 'https://via.placeholder.com/300x200',
            total_sold: 10,
            created_at: '2025-06-16T15:30:00Z'
          }
        ];
        setProducts(mockProducts);
        setStats({
          totalProducts: 2,
          totalSales: 35,
          totalRevenue: 1249.65,
          lowStockItems: 1
        });
      }
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const data = await apiCall('/categories/');
      // Handle different response formats
      if (data.results) {
        setCategories(data.results);
      } else if (data.categories) {
        setCategories(data.categories);
      } else if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Mock data
      setCategories([
        { 
          id: 1, 
          name: 'Electronics', 
          slug: 'electronics', 
          description: 'Electronic devices and gadgets', 
          product_count: 15 
        },
        { 
          id: 2, 
          name: 'Kitchen Ware', 
          slug: 'kitchen-ware', 
          description: 'Kitchen appliances and utensils', 
          product_count: 8 
        },
        { 
          id: 3, 
          name: 'Drinks', 
          slug: 'drinks', 
          description: 'Beverages and alcoholic drinks', 
          product_count: 22 
        }
      ]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchCategories()]);
      setLoading(false);
    };
    
    if (isAuthenticated && user?.role === 'vendor') {
      loadData();
    }
  }, [isAuthenticated, user]);

  // Product CRUD operations
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct ? `/products/${editingProduct.id}/edit/` : '/products/';
      
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price),
        stock_quantity: parseInt(productForm.stock_quantity),
        category_id: parseInt(productForm.category)
      };

      const response = await apiCall(url, {
        method,
        body: JSON.stringify(productData)
      });

      // Handle response
      const savedProduct = response.product || response;
      
      if (editingProduct) {
        setProducts(products.map(p => p.id === editingProduct.id ? savedProduct : p));
      } else {
        setProducts([...products, savedProduct]);
      }

      resetProductForm();
      alert(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
      
      // Refresh the list to get updated data
      await fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      
      // Show more detailed error message
      let errorMessage = 'Error saving product. Please try again.';
      if (error.message.includes('400')) {
        errorMessage = 'Please check your input data. Make sure all required fields are filled correctly.';
      } else if (error.message.includes('403')) {
        errorMessage = 'You do not have permission to perform this action.';
      }
      
      alert(errorMessage);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await apiCall(`/products/${productId}/edit/`, { method: 'DELETE' });
      setProducts(products.filter(p => p.id !== productId));
      alert('Product deleted successfully!');
      
      // Refresh stats
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      
      let errorMessage = 'Error deleting product. Please try again.';
      if (error.message.includes('403')) {
        errorMessage = 'You do not have permission to delete this product.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Product not found or already deleted.';
      }
      
      alert(errorMessage);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      category: product.category?.id || product.category,
      price: product.price,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url || '',
      featured: product.featured,
      is_active: product.is_active
    });
    setShowProductForm(true);
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      category: '',
      price: '',
      stock_quantity: '',
      image_url: '',
      featured: false,
      is_active: true
    });
    setEditingProduct(null);
    setShowProductForm(false);
  };

  // Category CRUD operations
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory ? `/categories/${editingCategory.id}/` : '/categories/';
      
      const categoryData = {
        ...categoryForm,
        slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-')
      };

      const response = await apiCall(url, {
        method,
        body: JSON.stringify(categoryData)
      });

      // Handle response
      const savedCategory = response.category || response;
      
      if (editingCategory) {
        setCategories(categories.map(c => c.id === editingCategory.id ? savedCategory : c));
      } else {
        setCategories([...categories, savedCategory]);
      }

      resetCategoryForm();
      alert(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
      
      // Refresh the list to get updated data
      await fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      
      let errorMessage = 'Error saving category. Please try again.';
      if (error.message.includes('400')) {
        errorMessage = 'A category with this name may already exist. Please choose a different name.';
      } else if (error.message.includes('403')) {
        errorMessage = 'You do not have permission to perform this action.';
      }
      
      alert(errorMessage);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This will affect all products in this category.')) return;

    try {
      await apiCall(`/categories/${categoryId}/`, { method: 'DELETE' });
      setCategories(categories.filter(c => c.id !== categoryId));
      alert('Category deleted successfully!');
      
      // Refresh categories and products since category deletion affects products
      await Promise.all([fetchCategories(), fetchProducts()]);
    } catch (error) {
      console.error('Error deleting category:', error);
      
      let errorMessage = 'Error deleting category. Please try again.';
      if (error.message.includes('403')) {
        errorMessage = 'You do not have permission to delete this category.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Cannot delete category. There may be products still using this category.';
      }
      
      alert(errorMessage);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      slug: category.slug
    });
    setShowCategoryForm(true);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      slug: ''
    });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="vendor-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-container">
          <div className="header-left">
            <Link to="/" className="logo">
              ( Kipsunya ~ biz )
            </Link>
            <span className="divider">|</span>
            <span className="page-title">Vendor Dashboard</span>
          </div>
          
          <div className="header-right">
            <span className="welcome-text">
              Welcome, {user?.first_name} {user?.last_name}
            </span>
            <div className="header-actions">
              <Link to="/" className="btn btn-secondary">
                View Store
              </Link>
              <button onClick={logout} className="btn btn-danger">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Sidebar Navigation */}
        <nav className="dashboard-sidebar">
          <ul className="nav-list">
            <li>
              <button 
                className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                📊 Overview
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                📦 Products
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}
                onClick={() => setActiveTab('categories')}
              >
                📂 Categories
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                📈 Analytics
              </button>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="dashboard-main">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <h1>Dashboard Overview</h1>
              
              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Products</h3>
                  <p className="stat-value">{stats.totalProducts}</p>
                  <span className="stat-label">Active listings</span>
                </div>
                <div className="stat-card">
                  <h3>Total Sales</h3>
                  <p className="stat-value">{stats.totalSales}</p>
                  <span className="stat-label">Items sold</span>
                </div>
                <div className="stat-card">
                  <h3>Total Revenue</h3>
                  <p className="stat-value">{formatCurrency(stats.totalRevenue)}</p>
                  <span className="stat-label">All time</span>
                </div>
                <div className="stat-card warning">
                  <h3>Low Stock</h3>
                  <p className="stat-value">{stats.lowStockItems}</p>
                  <span className="stat-label">Items &lt; 10 units</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="action-buttons">
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setActiveTab('products');
                      setShowProductForm(true);
                    }}
                  >
                    ➕ Add New Product
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setActiveTab('categories');
                      setShowCategoryForm(true);
                    }}
                  >
                    📁 Add New Category
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setActiveTab('analytics')}
                  >
                    📊 View Analytics
                  </button>
                </div>
              </div>

              {/* Recent Products */}
              <div className="recent-products">
                <h2>Recent Products</h2>
                <div className="products-list">
                  {products.slice(0, 5).map(product => (
                    <div key={product.id} className="product-item">
                      <img 
                        src={product.image_url || 'https://via.placeholder.com/60x60'} 
                        alt={product.name}
                        className="product-image"
                      />
                      <div className="product-info">
                        <h4>{product.name}</h4>
                        <p>Stock: {product.stock_quantity} units</p>
                        <p className="product-price">{formatCurrency(product.price)}</p>
                      </div>
                      <div className="product-actions">
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEditProduct(product)}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="products-tab">
              <div className="tab-header">
                <h1>My Products</h1>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowProductForm(true)}
                >
                  ➕ Add Product
                </button>
              </div>

              {/* Product Form Modal */}
              {showProductForm && (
                <div className="modal-overlay">
                  <div className="modal">
                    <div className="modal-header">
                      <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                      <button 
                        className="close-btn"
                        onClick={resetProductForm}
                      >
                        ✕
                      </button>
                    </div>
                    
                    <form onSubmit={handleProductSubmit} className="product-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Product Name *</label>
                          <input
                            type="text"
                            value={productForm.name}
                            onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                            required
                            placeholder="Enter product name"
                          />
                        </div>
                        <div className="form-group">
                          <label>Category *</label>
                          <select
                            value={productForm.category}
                            onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                            required
                          >
                            <option value="">Select a category</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Description *</label>
                        <textarea
                          value={productForm.description}
                          onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                          required
                          rows={4}
                          placeholder="Describe your product..."
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Price (KES) *</label>
                          <input
                            type="number"
                            step="0.01"
                            value={productForm.price}
                            onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                            required
                            placeholder="0.00"
                          />
                        </div>
                        <div className="form-group">
                          <label>Stock Quantity *</label>
                          <input
                            type="number"
                            value={productForm.stock_quantity}
                            onChange={(e) => setProductForm({...productForm, stock_quantity: e.target.value})}
                            required
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Image URL</label>
                        <input
                          type="url"
                          value={productForm.image_url}
                          onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group checkbox-group">
                          <label>
                            <input
                              type="checkbox"
                              checked={productForm.featured}
                              onChange={(e) => setProductForm({...productForm, featured: e.target.checked})}
                            />
                            Featured Product
                          </label>
                        </div>
                        <div className="form-group checkbox-group">
                          <label>
                            <input
                              type="checkbox"
                              checked={productForm.is_active}
                              onChange={(e) => setProductForm({...productForm, is_active: e.target.checked})}
                            />
                            Active
                          </label>
                        </div>
                      </div>

                      <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={resetProductForm}>
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                          {editingProduct ? 'Update Product' : 'Create Product'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Products Grid */}
              <div className="products-grid">
                {products.map(product => (
                  <div key={product.id} className="product-card">
                    <div className="product-image-container">
                      <img 
                        src={product.image_url || 'https://via.placeholder.com/300x200'} 
                        alt={product.name}
                        className="product-image"
                      />
                      {product.featured && <span className="featured-badge">Featured</span>}
                      {!product.is_active && <span className="inactive-badge">Inactive</span>}
                    </div>
                    
                    <div className="product-details">
                      <h3 className="product-title">{product.name}</h3>
                      <p className="product-category">
                        {product.category?.name || 'No category'}
                      </p>
                      <p className="product-price">{formatCurrency(product.price)}</p>
                      <p className="product-stock">
                        Stock: {product.stock_quantity} units
                        {product.stock_quantity < 10 && (
                          <span className="low-stock-warning"> (Low Stock!)</span>
                        )}
                      </p>
                      <p className="product-date">
                        Added: {formatDate(product.created_at)}
                      </p>
                    </div>
                    
                    <div className="product-actions">
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEditProduct(product)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {products.length === 0 && (
                <div className="empty-state">
                  <h3>No products yet</h3>
                  <p>Start by adding your first product to your store.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowProductForm(true)}
                  >
                    Add Your First Product
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="categories-tab">
              <div className="tab-header">
                <h1>Categories</h1>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCategoryForm(true)}
                >
                  ➕ Add Category
                </button>
              </div>

              {/* Category Form Modal */}
              {showCategoryForm && (
                <div className="modal-overlay">
                  <div className="modal">
                    <div className="modal-header">
                      <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                      <button 
                        className="close-btn"
                        onClick={resetCategoryForm}
                      >
                        ✕
                      </button>
                    </div>
                    
                    <form onSubmit={handleCategorySubmit} className="category-form">
                      <div className="form-group">
                        <label>Category Name *</label>
                        <input
                          type="text"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                          required
                          placeholder="Enter category name"
                        />
                      </div>

                      <div className="form-group">
                        <label>Slug</label>
                        <input
                          type="text"
                          value={categoryForm.slug}
                          onChange={(e) => setCategoryForm({...categoryForm, slug: e.target.value})}
                          placeholder="category-slug (auto-generated if empty)"
                        />
                        <small>URL-friendly version of the name. Leave empty to auto-generate.</small>
                      </div>

                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                          rows={3}
                          placeholder="Describe this category..."
                        />
                      </div>

                      <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={resetCategoryForm}>
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                          {editingCategory ? 'Update Category' : 'Create Category'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Categories List */}
              <div className="categories-list">
                {categories.map(category => (
                  <div key={category.id} className="category-card">
                    <div className="category-info">
                      <h3>{category.name}</h3>
                      <p className="category-slug">/{category.slug}</p>
                      <p className="category-description">
                        {category.description || 'No description'}
                      </p>
                      <p className="category-stats">
                        {category.product_count || 0} products
                      </p>
                    </div>
                    
                    <div className="category-actions">
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEditCategory(category)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {categories.length === 0 && (
                <div className="empty-state">
                  <h3>No categories yet</h3>
                  <p>Create categories to organize your products.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowCategoryForm(true)}
                  >
                    Create Your First Category
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="analytics-tab">
              <h1>Analytics & Reports</h1>
              
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h3>Sales Performance</h3>
                  <div className="chart-placeholder">
                    <p>📊 Sales chart would go here</p>
                    <p>Total Sales: {stats.totalSales} items</p>
                    <p>Revenue: {formatCurrency(stats.totalRevenue)}</p>
                  </div>
                </div>
                
                <div className="analytics-card">
                  <h3>Top Products</h3>
                  <div className="top-products-list">
                    {products
                      .sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0))
                      .slice(0, 5)
                      .map((product, index) => (
                        <div key={product.id} className="top-product-item">
                          <span className="rank">#{index + 1}</span>
                          <span className="product-name">{product.name}</span>
                          <span className="sales-count">{product.total_sold || 0} sold</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                <div className="analytics-card">
                  <h3>Inventory Status</h3>
                  <div className="inventory-stats">
                    <div className="inventory-item">
                      <span className="label">Total Products:</span>
                      <span className="value">{stats.totalProducts}</span>
                    </div>
                    <div className="inventory-item warning">
                      <span className="label">Low Stock Items:</span>
                      <span className="value">{stats.lowStockItems}</span>
                    </div>
                    <div className="inventory-item">
                      <span className="label">Active Products:</span>
                      <span className="value">
                        {products.filter(p => p.is_active).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default VendorDashboard;