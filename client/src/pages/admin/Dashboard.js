import React, { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import API_BASE_URL from '../../config';
import { useUser } from '../../context/UserContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const KPI_Card = ({ title, value, icon, format }) => (
    <div className="admin-card kpi-card">
        <div className="kpi-icon">{icon}</div>
        <div className="kpi-content">
            <span className="kpi-title">{title}</span>
            <span className="kpi-value">{format(value)}</span>
        </div>
    </div>
);

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { getAuthToken } = useUser();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const token = getAuthToken();
                const response = await fetch(`${API_BASE_URL}/api/admin/dashboard-stats/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                setStats(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [getAuthToken]);

    if (loading) {
        return <div className="admin-loading">Loading Dashboard...</div>;
    }

    if (error) {
        return <div className="admin-error">Error: {error}</div>;
    }
    
    if (!stats) {
        return <div className="admin-empty">No data available to display.</div>;
    }

    const salesChart = {
        labels: stats.salesData.labels,
        datasets: [{
            label: 'Sales (KES)',
            data: stats.salesData.data,
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            borderColor: 'rgba(79, 70, 229, 1)',
            fill: true,
            tension: 0.4,
        }],
    };

    const categoryChart = {
        labels: stats.categoryData.labels,
        datasets: [{
            data: stats.categoryData.data,
            backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#6b7280', '#ef4444', '#3b82f6'],
            borderColor: '#ffffff',
            borderWidth: 2,
        }],
    };

    return (
        <div>
            <h1 className="admin-page-title">Dashboard</h1>
            <div className="admin-kpi-grid">
                <KPI_Card title="Total Sales" value={stats.kpiData.totalSales} icon="💰" format={(v) => `Ksh ${v.toLocaleString()}`} />
                <KPI_Card title="Total Orders" value={stats.kpiData.newOrders} icon="📦" format={(v) => v.toLocaleString()} />
                <KPI_Card title="Total Customers" value={stats.kpiData.newCustomers} icon="👥" format={(v) => v.toLocaleString()} />
                <KPI_Card title="Pending Orders" value={stats.kpiData.pendingOrders} icon="⏳" format={(v) => v.toLocaleString()} />
            </div>

            <div className="admin-charts-grid">
                <div className="admin-card">
                    <h3 className="admin-card-title">Sales Overview</h3>
                    <Line options={{ responsive: true, maintainAspectRatio: false }} data={salesChart} />
                </div>
                <div className="admin-card">
                    <h3 className="admin-card-title">Products by Category</h3>
                    <div className="doughnut-container">
                        <Doughnut data={categoryChart} options={{ responsive: true, maintainAspectRatio: false, cutout: '60%' }} />
                    </div>
                </div>
            </div>

            <div className="admin-card">
                 <h3 className="admin-card-title">Recent Orders</h3>
                 <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Total (Ksh)</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.recentOrders.map(order => (
                            <tr key={order.id}>
                                <td>{order.id}</td>
                                <td>{order.customer}</td>
                                <td>{order.total.toLocaleString()}</td>
                                <td><span className={`admin-status-badge status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                                <td><button className="admin-action-btn">View</button></td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>
        </div>
    );
}

export default Dashboard;