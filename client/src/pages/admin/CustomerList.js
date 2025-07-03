import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config';
import { useUser } from '../../context/UserContext';

function CustomerList() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { getAuthToken } = useUser();

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                setLoading(true);
                const token = getAuthToken();
                const response = await fetch(`${API_BASE_URL}/api/admin/customers/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch customers');
                const data = await response.json();
                setCustomers(data.results || data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, [getAuthToken]);

    if (loading) return <div className="admin-loading">Loading Customers...</div>;
    if (error) return <div className="admin-error">Error: {error}</div>;

    return (
        <div>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Manage Customers</h1>
            </div>
            <div className="admin-card">
                {customers.length === 0 ? (
                     <div className="admin-empty">No customers found.</div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Member Since</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map(customer => (
                                <tr key={customer.id}>
                                    <td>{customer.id}</td>
                                    <td>{customer.first_name} {customer.last_name}</td>
                                    <td><a href={`mailto:${customer.email}`} className="text-primary">{customer.email}</a></td>
                                    <td><span className={`admin-role-badge role-${customer.role.toLowerCase()}`}>{customer.role}</span></td>
                                    <td>{new Date(customer.date_joined).toLocaleDateString()}</td>
                                    <td className="admin-table-actions">
                                        <button className="admin-action-btn">View Details</button>
                                        <button className="admin-action-btn btn-danger">Suspend</button>
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

export default CustomerList;