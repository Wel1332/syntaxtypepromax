import React, { useState } from 'react';
import axios from 'axios';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import { API_BASE } from '../../../shared/api/client';

const RegisterPage = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const validateForm = () => {
        let tempErrors = {};
        if (!username) tempErrors.username = 'Username is required.';
        if (!email) tempErrors.email = 'Email is required.';
        if (!password) tempErrors.password = 'Password is required.';
        if (!confirmPassword) tempErrors.confirmPassword = 'Confirm Password is required.';
        if (password && confirmPassword && password !== confirmPassword) {
            tempErrors.confirmPassword = 'Passwords do not match.';
        }
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage({ text: '', type: '' });
        if (!validateForm()) return;
        setLoading(true);

        try {
            await axios.post(`${API_BASE}/api/auth/register/student`, {
                username,
                email,
                password,
            });
            setMessage({ text: 'Registration successful! Redirecting to login…', type: 'success' });
            setTimeout(() => navigate('/login'), 1800);
        } catch (error) {
            console.error('Registration error:', error);
            let errorMessage = 'Registration failed. Please try again.';
            if (error.response && error.response.data) {
                if (typeof error.response.data === 'object' && error.response.data !== null) {
                    errorMessage =
                        error.response.data.message ||
                        error.response.data.error ||
                        JSON.stringify(error.response.data);
                } else {
                    errorMessage = error.response.data;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            if (error.response && error.response.status === 409) {
                errorMessage = errorMessage.includes('username')
                    ? 'Username already exists.'
                    : errorMessage.includes('email')
                    ? 'Email already exists.'
                    : 'Username or email already exists.';
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
                    left: -150,
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
                    right: -180,
                    width: 460,
                    height: 460,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #FFC700 0%, transparent 70%)',
                    opacity: isDark ? 0.22 : 0.14,
                    filter: 'blur(28px)',
                },
            }}
        >
            <Card sx={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
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
                                Join the <Box component="span" sx={gradientText}>squad</Box>
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                                Create a free account and start climbing the board.
                            </Typography>
                        </Stack>

                        {message.text && (
                            <Alert
                                severity={message.type === 'success' ? 'success' : 'error'}
                                sx={{ width: '100%' }}
                            >
                                {message.text}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    required
                                    id="username"
                                    label="Username"
                                    name="username"
                                    autoComplete="username"
                                    autoFocus
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    error={!!errors.username}
                                    helperText={errors.username}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon sx={{ color: 'primary.main' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    required
                                    id="email"
                                    label="Email"
                                    name="email"
                                    autoComplete="email"
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
                                    autoComplete="new-password"
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
                                <TextField
                                    fullWidth
                                    required
                                    name="confirmPassword"
                                    label="Confirm Password"
                                    type={showConfirm ? 'text' : 'password'}
                                    id="confirmPassword"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    error={!!errors.confirmPassword}
                                    helperText={errors.confirmPassword}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon sx={{ color: 'primary.main' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowConfirm((s) => !s)}
                                                    edge="end"
                                                    size="small"
                                                    aria-label="toggle confirm password visibility"
                                                >
                                                    {showConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
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
                                    startIcon={loading ? null : <AppRegistrationIcon />}
                                    sx={{ py: 1.5, fontSize: '1rem', mt: 1 }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                                </Button>
                            </Stack>
                        </Box>

                        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                            Already have an account?{' '}
                            <Box
                                component={RouterLink}
                                to="/login"
                                sx={{
                                    color: 'primary.main',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' },
                                }}
                            >
                                Sign in →
                            </Box>
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};

export default RegisterPage;
