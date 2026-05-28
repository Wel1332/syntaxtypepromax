// app/layout/NotFoundRedirect.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '../../shared/auth/AuthUtils';

const NotFoundRedirect = () => {
    const navigate = useNavigate();
    const [seconds, setSeconds] = useState(3);

    useEffect(() => {
        const countdownTimer = setInterval(() => {
            setSeconds(prevSeconds => prevSeconds - 1);
        }, 1000);

        const redirectTimer = setTimeout(() => {
            clearInterval(countdownTimer);
            const token = getAuthToken();
            if (token) {
                navigate('/dashboard');
            } else {
                navigate('/login');
            }
        }, 3000);

        return () => {
            clearInterval(countdownTimer);
            clearTimeout(redirectTimer);
        };
    }, [navigate]);

    return (
        <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '28rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Page Not Found</h2>
                <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
                    The page you are looking for does not exist.
                </p>
                <p style={{ color: '#4b5563', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    Redirecting to the dashboard in {seconds} seconds...
                </p>
            </div>
        </div>
    );
};

export default NotFoundRedirect;
