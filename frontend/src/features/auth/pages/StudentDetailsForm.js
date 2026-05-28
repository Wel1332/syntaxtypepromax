import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// IMPORTANT: Please ensure these paths are correct relative to StudentDetailsForm.js (src/pages/StudentDetailsForm.js)
// and that the files exist in src/utils/ with the correct casing.
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

const StudentDetailsForm = () => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState(null);

    // States for Student entity fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [universityEmail, setUniversityEmail] = useState('');
    const [course, setCourse] = useState('');
    const [yearLevel, setYearLevel] = useState('');
    const [className, setClassName] = useState('');
    const [section, setSection] = useState('');

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

            if (role !== 'STUDENT' || !id) {
                navigate('/dashboard');
            }
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const validateForm = () => {
        let tempErrors = {};
        if (!firstName) tempErrors.firstName = "First Name is required.";
        if (!lastName) tempErrors.lastName = "Last Name is required.";
        if (!universityEmail) tempErrors.universityEmail = "University Email is required.";
        if (!course) tempErrors.course = "Course is required.";
        if (!yearLevel) tempErrors.yearLevel = "Year Level is required.";
        if (!className) tempErrors.className = "Class Name is required.";
        if (!section) tempErrors.section = "Section is required.";
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
            await axios.post(`/api/students?userId=${userId}`, {
                firstName,
                lastName,
                universityEmail,
                course,
                yearLevel,
                className,
                section
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setMessage({ text: 'Student details saved successfully!', type: 'success' });
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (error) {
            console.error('Error saving student details:', error);
            let errorMessage = 'Failed to save student details. Please try again.';
            if (error.response && error.response.data) {
                errorMessage = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
            }
            setMessage({ text: errorMessage, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (userRole === null) {
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
                    Complete Your Student Profile
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
                    <Typography variant="h6" sx={{ mt: 1, mb: 1, color: '#1f2937' }}>Personal Details</Typography>

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="firstName"
                        label="First Name"
                        name="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        variant="outlined"
                        size="small"
                        error={!!errors.firstName}
                        helperText={errors.firstName}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="lastName"
                        label="Last Name"
                        name="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        variant="outlined"
                        size="small"
                        error={!!errors.lastName}
                        helperText={errors.lastName}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="universityEmail"
                        label="University Email"
                        name="universityEmail"
                        value={universityEmail}
                        onChange={(e) => setUniversityEmail(e.target.value)}
                        variant="outlined"
                        size="small"
                        error={!!errors.universityEmail}
                        helperText={errors.universityEmail}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="course"
                        label="Course"
                        name="course"
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        variant="outlined"
                        size="small"
                        error={!!errors.course}
                        helperText={errors.course}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="yearLevel"
                        label="Year Level"
                        name="yearLevel"
                        value={yearLevel}
                        onChange={(e) => setYearLevel(e.target.value)}
                        variant="outlined"
                        size="small"
                        error={!!errors.yearLevel}
                        helperText={errors.yearLevel}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="className"
                        label="Class Name"
                        name="className"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        variant="outlined"
                        size="small"
                        error={!!errors.className}
                        helperText={errors.className}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="section"
                        label="Section"
                        name="section"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        variant="outlined"
                        size="small"
                        error={!!errors.section}
                        helperText={errors.section}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{
                            mt: 3,
                            mb: 2,
                            backgroundColor: '#2563eb',
                            '&:hover': {
                                backgroundColor: '#1d4ed8',
                            },
                            borderRadius: '0.375rem',
                            textTransform: 'none',
                            padding: '0.5rem 1rem',
                        }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Details'}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default StudentDetailsForm;
