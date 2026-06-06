import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Stack,
    Typography,
    TextField,
    Button,
    Chip,
    LinearProgress,
    Snackbar,
    Alert,
    useTheme,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import SchoolIcon from '@mui/icons-material/School';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { authFetch } from '../../../shared/api/authFetch';
import { API_BASE } from '../../../shared/api/client';

const gradientText = {
    background: 'linear-gradient(90deg, #C8456D 0%, #E78AAC 50%, #FFC700 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'inline-block',
};

const errorMessage = async (res, fallback) => {
    try {
        const body = await res.json();
        return body?.message || fallback;
    } catch {
        return fallback;
    }
};

const JoinClass = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const navigate = useNavigate();

    const [code, setCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [classes, setClasses] = useState([]);
    const [loadState, setLoadState] = useState('loading');
    const [toast, setToast] = useState(null);

    const notify = (severity, message) => setToast({ severity, message });

    const fetchEnrolled = useCallback(async () => {
        setLoadState('loading');
        try {
            const res = await authFetch(`${API_BASE}/api/classes/enrolled`);
            if (!res.ok) throw new Error('failed');
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];
            setClasses(list);
            setLoadState(list.length ? 'ok' : 'empty');
        } catch {
            setLoadState('error');
        }
    }, []);

    useEffect(() => {
        fetchEnrolled();
    }, [fetchEnrolled]);

    const handleJoin = async (e) => {
        e.preventDefault();
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) return;
        setJoining(true);
        try {
            const res = await authFetch(`${API_BASE}/api/classes/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classCode: trimmed }),
            });
            if (!res.ok) {
                notify('error', await errorMessage(res, 'Could not join that class.'));
                return;
            }
            const joined = await res.json();
            setCode('');
            notify('success', `Joined "${joined.name}"!`);
            fetchEnrolled();
        } catch {
            notify('error', 'Network error while joining the class.');
        } finally {
            setJoining(false);
        }
    };

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
            <Box
                sx={{
                    position: 'absolute',
                    top: -160,
                    right: -160,
                    width: 420,
                    height: 420,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #C8456D 0%, transparent 70%)',
                    opacity: isDark ? 0.22 : 0.14,
                    filter: 'blur(28px)',
                    pointerEvents: 'none',
                }}
            />
            <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 720, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 4, md: 6 } }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/dashboard')}
                    sx={{ mb: 1, color: 'text.secondary' }}
                    size="small"
                >
                    Back to Dashboard
                </Button>
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
                    Student
                </Typography>
                <Typography variant="h3" sx={{ color: 'text.primary', fontSize: { xs: '1.75rem', md: '2.5rem' }, mb: 0.5 }}>
                    Join a <Box component="span" sx={gradientText}>Class</Box>
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                    Enter the code your teacher gave you to join their class.
                </Typography>

                {/* Join form */}
                <Card sx={{ mb: 4 }}>
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Box component="form" onSubmit={handleJoin}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                                <TextField
                                    label="Class code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. 7K2QPX"
                                    required
                                    fullWidth
                                    inputProps={{ maxLength: 12, style: { letterSpacing: 4, fontFamily: 'monospace', textTransform: 'uppercase' } }}
                                />
                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={<LoginIcon />}
                                    disabled={joining || !code.trim()}
                                    sx={{ whiteSpace: 'nowrap', px: 3, py: 1.5 }}
                                >
                                    {joining ? 'Joining…' : 'Join'}
                                </Button>
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>

                {/* Enrolled classes */}
                <Typography variant="h5" sx={{ color: 'text.primary', mb: 2 }}>
                    My classes
                </Typography>
                {loadState === 'loading' && <LinearProgress />}
                {loadState === 'error' && (
                    <Typography sx={{ color: 'error.main', py: 2 }}>
                        Couldn't load your classes. Please try again.
                    </Typography>
                )}
                {loadState === 'empty' && (
                    <Typography sx={{ color: 'text.secondary', py: 2 }}>
                        You haven't joined any classes yet.
                    </Typography>
                )}
                {loadState === 'ok' && (
                    <Stack spacing={2}>
                        {classes.map((cls) => (
                            <Card key={cls.classroomId} variant="outlined">
                                <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <SchoolIcon sx={{ color: 'primary.main' }} />
                                            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
                                                {cls.name}
                                            </Typography>
                                        </Stack>
                                        {cls.description && (
                                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                                {cls.description}
                                            </Typography>
                                        )}
                                        {cls.createdByName && (
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Teacher: {cls.createdByName}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Chip label={cls.classCode} sx={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 }} />
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}
            </Box>

            <Snackbar
                open={!!toast}
                autoHideDuration={4000}
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {toast ? (
                    <Alert severity={toast.severity} onClose={() => setToast(null)} variant="filled">
                        {toast.message}
                    </Alert>
                ) : undefined}
            </Snackbar>
        </Box>
    );
};

export default JoinClass;
