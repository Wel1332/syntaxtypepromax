import React, { useState } from 'react';
import axios from 'axios';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { setAuthToken } from '../../../shared/auth/AuthUtils';
import { getUserId, getUserRole } from '../../../shared/auth/JwtUtils';
import {
    Box,
    Card,
    CardContent,
    Stack,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    useTheme,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';

import { API_BASE } from '../../../shared/api/client';

const LoginPage = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const validateForm = () => {
        const tempErrors = {};
        if (!email) tempErrors.email = 'Email is required.';
        if (!password) tempErrors.password = 'Password is required.';
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage({ text: '', type: '' });
        if (!validateForm()) return;
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
            const token = response.data.token;

            if (token) {
                setAuthToken(token);
                const userId = getUserId(token);
                const userRole = getUserRole(token);
                sessionStorage.setItem('token', token);
                sessionStorage.setItem('userId', userId);
                sessionStorage.setItem('role', userRole);

                if (userRole === 'STUDENT' && userId) {
                    try {
                        const studentDetailsResponse = await axios.get(
                            `/api/students/user/${userId}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        const studentData = studentDetailsResponse.data;
                        if (!studentData || Object.keys(studentData).length === 0) {
                            setMessage({ text: 'Please complete your student profile.', type: 'info' });
                            navigate('/student-details-form');
                        } else {
                            setMessage({ text: 'Login successful!', type: 'success' });
                            navigate('/dashboard');
                        }
                    } catch (studentError) {
                        if (studentError.response?.status === 404) {
                            setMessage({ text: 'Please complete your student profile.', type: 'info' });
                            navigate('/student-details-form');
                        } else {
                            setMessage({
                                text: 'Login successful, but profile check failed. Proceeding to dashboard.',
                                type: 'warning',
                            });
                            navigate('/dashboard');
                        }
                    }
                } else {
                    setMessage({ text: 'Login successful!', type: 'success' });
                    navigate('/dashboard');
                }
            } else {
                setMessage({ text: 'Login successful, but no token received.', type: 'error' });
            }
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Login failed. Please check your credentials.';
            if (error.response?.data) {
                const data = error.response.data;
                if (typeof data === 'object' && data !== null) {
                    errorMessage = data.message || data.error || JSON.stringify(data);
                } else {
                    errorMessage = data;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            setMessage({ text: errorMessage, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const gradientText = {
        background: 'linear-gradient(90deg, #C8456D 0%, #E78AAC 50%, #FFC700 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        display: 'inline-block',
    };

    return (
        <Box
            sx={{
                bgcolor: 'background.default',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                px: 2,
                py: 6,
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -150,
                    right: -150,
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #C8456D 0%, transparent 70%)',
                    opacity: isDark ? 0.3 : 0.18,
                    filter: 'blur(24px)',
                },
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -180,
                    left: -180,
                    width: 460,
                    height: 460,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #FFC700 0%, transparent 70%)',
                    opacity: isDark ? 0.22 : 0.14,
                    filter: 'blur(28px)',
                },
            }}
        >
            <Card sx={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
                <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
                    <Stack spacing={3} alignItems="center">
                        <Box
                            component={RouterLink}
                            to="/"
                            sx={{ display: 'block', lineHeight: 0 }}
                        >
                            <Box
                                component="img"
                                src="/images/syntaxtypelogo1.png"
                                alt="SyntaxType"
                                sx={{
                                    width: 240,
                                    maxWidth: '100%',
                                    height: 'auto',
                                    imageRendering: 'pixelated',
                                    filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.35))',
                                }}
                            />
                        </Box>

                        <Stack spacing={0.5} alignItems="center">
                            <Typography variant="h4" sx={{ color: 'text.primary' }}>
                                Welcome <Box component="span" sx={gradientText}>back</Box>
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Sign in to keep climbing the leaderboard.
                            </Typography>
                        </Stack>

                        {message.text && (
                            <Alert severity={message.type || 'info'} sx={{ width: '100%' }}>
                                {message.text}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    required
                                    id="email"
                                    label="Email"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    error={!!errors.email}
                                    helperText={errors.email}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon sx={{ color: 'primary.main' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    required
                                    name="password"
                                    label="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    error={!!errors.password}
                                    helperText={errors.password}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon sx={{ color: 'primary.main' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword((s) => !s)}
                                                    edge="end"
                                                    size="small"
                                                    aria-label="toggle password visibility"
                                                >
                                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    disabled={loading}
                                    startIcon={loading ? null : <LoginIcon />}
                                    sx={{ py: 1.5, fontSize: '1rem', mt: 1 }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                                </Button>
                            </Stack>
                        </Box>

                        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                            New to SyntaxType?{' '}
                            <Box
                                component={RouterLink}
                                to="/register"
                                sx={{
                                    color: 'primary.main',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' },
                                }}
                            >
                                Create an account →
                            </Box>
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};

export default LoginPage;
