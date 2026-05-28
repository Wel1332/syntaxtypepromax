// src/pages/TeacherSetupAccountPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getAuthToken, setAuthToken } from '../../../shared/auth/AuthUtils'; // Import setAuthToken
import { getUserId, getUserRole, getIsTempPassword } from '../../../shared/auth/JwtUtils';

// Material-UI Imports
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress
    
} from '@mui/material';

const TeacherSetupAccountPage = () => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState(null);

    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const token = getAuthToken();
        if (token) {
            const id = getUserId(token);
            const role = getUserRole(token);
            const isTemp = getIsTempPassword(token);

            setUserId(id);

            if (role !== 'TEACHER' || !id) {
                navigate('/dashboard'); // Should not happen if ProtectedRoute works
                return;
            }
            if (!isTemp) {
                // If password is not temporary, redirect away from this page
                navigate('/teacher-details-form'); // Or /dashboard
            }
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const validateForm = () => {
        let tempErrors = {};
        if (!newUsername) tempErrors.newUsername = "New Username is required.";
        if (!newPassword) tempErrors.newPassword = "New Password is required.";
        else if (newPassword.length < 6) tempErrors.newPassword = "Password must be at least 6 characters.";
        if (!confirmPassword) tempErrors.confirmPassword = "Confirm Password is required.";
        if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            tempErrors.confirmPassword = "Passwords do not match.";
        }
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage({ text: '', type: '' });

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        if (!userId) {
            setMessage({ text: 'User ID not found. Please log in again.', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const token = getAuthToken();
            // Backend endpoint to update username and password for a user with a temporary password.
            // This endpoint should ideally verify the user via their current token.
            const response = await axios.put(`/api/users/update-temp-teacher/${userId}`, {
                username: newUsername,
                password: newPassword,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data && response.data.token) {
                setAuthToken(response.data.token); // Update the token in AuthUtils
                setMessage({ text: 'Account setup successful! Please complete your profile.', type: 'success' });
                // Navigate to the next step, ProtectedRoute will re-evaluate with the new token
                setTimeout(() => navigate('/teacher-details-form', { replace: true }), 2000);
            } else {
                // This case should ideally not happen if backend is correctly implemented
                setMessage({ text: 'Account setup successful, but failed to retrieve updated session. Please log in again.', type: 'warning' });
                setTimeout(() => navigate('/login', { replace: true }), 3000);
            }

        } catch (error) {
            console.error('Error setting up account:', error);
            let errorMessage = 'Failed to update account details. Please try again.';
            if (error.response && error.response.data) {
                errorMessage = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
                 if (error.response.status === 409 && errorMessage.toLowerCase().includes("username")) {
                    setErrors(prev => ({...prev, newUsername: "Username already taken."}));
                }
            }
            setMessage({ text: errorMessage, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '1rem' }}>
            <Box sx={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '1.5rem', color: '#1f2937' }}>
                    Setup Your Teacher Account
                </Typography>
                <Typography variant="body2" sx={{ textAlign: 'center', marginBottom: '1.5rem', color: '#4b5563' }}>
                    Please set your new username and password.
                </Typography>

                {message.text && (
                    <Alert severity={message.type} sx={{ width: '100%', marginBottom: '1rem' }}>
                        {message.text}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                    <TextField margin="normal" required fullWidth id="newUsername" label="New Username" name="newUsername" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} variant="outlined" size="small" error={!!errors.newUsername} helperText={errors.newUsername} />
                    <TextField margin="normal" required fullWidth name="newPassword" label="New Password" type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} variant="outlined" size="small" error={!!errors.newPassword} helperText={errors.newPassword} />
                    <TextField margin="normal" required fullWidth name="confirmPassword" label="Confirm New Password" type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} variant="outlined" size="small" error={!!errors.confirmPassword} helperText={errors.confirmPassword} />

                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, backgroundColor: '#2563eb', '&:hover': { backgroundColor: '#1d4ed8' }, borderRadius: '0.375rem', textTransform: 'none', padding: '0.5rem 1rem' }} disabled={loading}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Save and Continue'}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default TeacherSetupAccountPage;