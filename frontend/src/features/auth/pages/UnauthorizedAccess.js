// src/pages/UnauthorizedAccess.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '../../../shared/auth/AuthUtils';
import { getUserRole } from '../../../shared/auth/JwtUtils';

const UnauthorizedAccess = () => {
    const navigate = useNavigate();
    const [seconds, setSeconds] = useState(3); // Start countdown from 5 seconds
    const [userRole, setUserRole] = useState(null);
    const [username, setUsername] = useState(null);

    useEffect(() => {
        const token = getAuthToken();
        if (token) {
            setUserRole(getUserRole(token));
            // Assuming getUsername extracts from JWT, otherwise fetch from backend if needed
            setUsername(username || 'User'); // Fallback to 'User' if username not available immediately
        } else {
            // If no token, redirect to login page after message
            navigate('/login');
            return;
        }

        // Countdown timer
        const countdownInterval = setInterval(() => {
            setSeconds(prevSeconds => prevSeconds - 1);
        }, 1000);

        // Redirect timer
        const redirectTimeout = setTimeout(() => {
            clearInterval(countdownInterval); // Stop the countdown
            navigate('/dashboard'); // Redirect to the dashboard
        }, 3000); // Redirect after e seconds

        // Cleanup function
        return () => {
            clearInterval(countdownInterval);
            clearTimeout(redirectTimeout);
        };
    }, [navigate, username]); // Include username in dependency array if it can change dynamically

    return (
        <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '28rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#ef4444' }}>Access Denied</h2>
                <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
                    Hello {username || 'there'}! Your role (<span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{userRole ? userRole.toLowerCase() : 'N/A'}</span>) does not have permission to view this page.
                </p>
                <p style={{ color: '#4b5563', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    Redirecting to your dashboard in {seconds} seconds...
                </p>
            </div>
        </div>
    );
};

export default UnauthorizedAccess;