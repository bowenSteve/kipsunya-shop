import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config';
import { useUser } from '../../context/UserContext';

function OrderList() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { getAuthToken } = useUser();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const token = getAuthToken();
                const response = await fetch(`${API_BASE_URL}/api/admin/orders/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch orders');
                const data = await response.json();
                setOrders(data.results || data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [getAuthToken]);
    
    if (loading) return <div className="admin-loading">Loading Orders...</div>;
    if (error) return <div className="admin-error">Error: {error}</div>;

    return (
        <div>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Manage All Orders</h1>
            </div>
            <div className="admin-card">
                {orders.length === 0 ? (
                    <div className="admin-empty">No orders found.</div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Total (Ksh)</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id}>
                                    <td className="font-medium text-primary">{order.order_number || `ORD-${order.id}`}</td>
                                    <td>{order.customer_name || `${order.user?.first_name} ${order.user?.last_name}`}</td>
                                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td>{order.total_price.toLocaleString()}</td>
                                    <td><span className={`admin-status-badge status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                                    <td className="admin-table-actions">
                                        <button className="admin-action-btn">View Details</button>
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

export default OrderList;