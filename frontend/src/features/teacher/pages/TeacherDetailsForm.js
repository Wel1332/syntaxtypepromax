// src/pages/TeacherDetailsForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthToken } from '../../../shared/auth/AuthUtils';
import { getUserId, getUserRole } from '../../../shared/auth/JwtUtils';

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

const TeacherDetailsForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState(null);

    // States for Teacher entity fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [institution, setInstitution] = useState('');
    const [subject, setSubject] = useState('');

    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({}); // State to hold validation errors

    useEffect(() => {
        const token = getAuthToken();
        if (token) {
            const id = getUserId(token);
            const role = getUserRole(token);
            setUserId(id);
            setUserRole(role);

            if (role !== 'TEACHER' || !id) {
                // If not a teacher or no ID, redirect to dashboard
                // This could happen if a non-teacher somehow lands here
                navigate('/dashboard');
            }
        } else {
            // No token, redirect to login
            navigate('/login');
        }
    }, [navigate]);

    const validateForm = () => {
        let tempErrors = {};
        if (!firstName) tempErrors.firstName = "First Name is required.";
        if (!lastName) tempErrors.lastName = "Last Name is required.";
        if (!institution) tempErrors.institution = "Institution is required.";
        if (!subject) tempErrors.subject = "Subject is required.";
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage({ text: '', type: '' });

        if (!validateForm()) {
            return; // Stop if validation fails
        }

        setLoading(true);

        if (!userId) {
            setMessage({ text: 'User ID not found. Please log in again.', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const token = getAuthToken();
            // Assuming your backend API for creating/updating teacher details is /api/teachers
            // And it expects userId as a query parameter or in the body.
            // Adjust the endpoint and payload as per your backend API design.
            await axios.post(`/api/teachers?userId=${userId}`, {
                firstName,
                lastName,
                institution,
                subject
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setMessage({ text: 'Teacher details saved successfully!', type: 'success' });
            // Redirect to dashboard or a 'from' location if available
            const from = location.state?.from?.pathname || '/dashboard';
            setTimeout(() => navigate(from, { replace: true }), 2000);

        } catch (error) {
            console.error('Error saving teacher details:', error);
            let errorMessage = 'Failed to save teacher details. Please try again.';
            if (error.response && error.response.data) {
                errorMessage = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
            }
            setMessage({ text: errorMessage, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (userRole === null) { // Still determining user role
        return (
            <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading...</Typography>
            </div>
        );
    }

    return (
        <Container
            component="main"
            maxWidth="sm"
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#f3f4f6',
                padding: '1rem',
            }}
        >
            <Box
                sx={{
                    backgroundColor: '#ffffff',
                    padding: '2rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography
                    component="h1"
                    variant="h5"
                    sx={{
                        fontWeight: 'bold',
                        textAlign: 'center',
                        marginBottom: '1.5rem',
                        color: '#1f2937',
                    }}
                >
                    Complete Your Teacher Profile
                </Typography>

                {message.text && (
                    <Alert
                        severity={message.type === 'success' ? 'success' : 'error'}
                        sx={{ width: '100%', marginBottom: '1rem' }}
                    >
                        {message.text}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                    <TextField margin="normal" required fullWidth id="firstName" label="First Name" name="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} variant="outlined" size="small" error={!!errors.firstName} helperText={errors.firstName} />
                    <TextField margin="normal" required fullWidth id="lastName" label="Last Name" name="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} variant="outlined" size="small" error={!!errors.lastName} helperText={errors.lastName} />
                    <TextField margin="normal" required fullWidth id="institution" label="Institution/School" name="institution" value={institution} onChange={(e) => setInstitution(e.target.value)} variant="outlined" size="small" error={!!errors.institution} helperText={errors.institution} />
                    <TextField margin="normal" required fullWidth id="subject" label="Subject Taught" name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} variant="outlined" size="small" error={!!errors.subject} helperText={errors.subject} />

                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, backgroundColor: '#2563eb', '&:hover': { backgroundColor: '#1d4ed8' }, borderRadius: '0.375rem', textTransform: 'none', padding: '0.5rem 1rem' }} disabled={loading}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Details'}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default TeacherDetailsForm;