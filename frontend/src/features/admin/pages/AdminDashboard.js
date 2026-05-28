// src/components/AdminDashboard.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setAuthToken } from '../../../shared/auth/AuthUtils';

const AdminDashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        setAuthToken(null);
        navigate('/login');
    };

    return (
        <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '40rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Admin Dashboard</h2>
                <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>Welcome, Administrator!</p>
                {/* Admin specific content */}
                <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li><Link to="/admin/users" style={{ color: '#2563eb', textDecoration: 'underline' }}>Manage Users</Link></li>
                    <li><Link to="/admin/settings" style={{ color: '#2563eb', textDecoration: 'underline' }}>Application Settings</Link></li>
                </ul>
                <button
                    onClick={handleLogout}
                    style={{
                        color: '#dc2626',
                        textDecoration: 'underline',
                        marginTop: '1rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: 0
                    }}
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default AdminDashboard;