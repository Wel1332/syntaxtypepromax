import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Stack,
    Typography,
    TextField,
    Button,
    IconButton,
    Tooltip,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    LinearProgress,
    Snackbar,
    Alert,
    useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { authFetch } from '../../../shared/api/authFetch';
import { API_BASE } from '../../../shared/api/client';

const gradientText = {
    background: 'linear-gradient(90deg, #C8456D 0%, #E78AAC 50%, #FFC700 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'inline-block',
};

const fullName = (s) =>
    [s.firstName, s.lastName].filter(Boolean).join(' ').trim() ||
    s.user?.username ||
    s.universityEmail ||
    `Student #${s.studentId}`;

const errorMessage = async (res, fallback) => {
    try {
        const body = await res.json();
        return body?.message || fallback;
    } catch {
        return fallback;
    }
};

const TeacherClasses = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const navigate = useNavigate();

    const [classes, setClasses] = useState([]);
    const [loadState, setLoadState] = useState('loading');

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [creating, setCreating] = useState(false);

    const [roster, setRoster] = useState(null); // { classroom, students, loading }
    const [toast, setToast] = useState(null);   // { severity, message }
    const [needsProfile, setNeedsProfile] = useState(false);

    const notify = (severity, message) => setToast({ severity, message });

    const fetchClasses = useCallback(async () => {
        setLoadState('loading');
        try {
            const res = await authFetch(`${API_BASE}/api/classes/mine`);
            if (res.status === 403) {
                // No Teacher profile yet — the account hasn't finished setup.
                setNeedsProfile(true);
                setLoadState('empty');
                return;
            }
            if (!res.ok) throw new Error('failed');
            setNeedsProfile(false);
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];
            setClasses(list);
            setLoadState(list.length ? 'ok' : 'empty');
        } catch {
            setLoadState('error');
        }
    }, []);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setCreating(true);
        try {
            const res = await authFetch(`${API_BASE}/api/classes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
            });
            if (res.status === 403) {
                setNeedsProfile(true);
                notify('error', 'Finish setting up your teacher profile before creating a class.');
                return;
            }
            if (!res.ok) {
                notify('error', await errorMessage(res, 'Could not create the class.'));
                return;
            }
            const created = await res.json();
            setName('');
            setDescription('');
            notify('success', `Class "${created.name}" created. Code: ${created.classCode}`);
            fetchClasses();
        } catch {
            notify('error', 'Network error while creating the class.');
        } finally {
            setCreating(false);
        }
    };

    const copyCode = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
            notify('success', `Copied code ${code} to clipboard.`);
        } catch {
            notify('info', `Class code: ${code}`);
        }
    };

    const openRoster = async (cls) => {
        setRoster({ classroom: cls, students: [], loading: true });
        try {
            const res = await authFetch(`${API_BASE}/api/classes/${cls.classroomId}/students`);
            const students = res.ok ? await res.json() : [];
            setRoster({ classroom: cls, students: Array.isArray(students) ? students : [], loading: false });
        } catch {
            setRoster({ classroom: cls, students: [], loading: false });
        }
    };

    const removeStudent = async (studentId) => {
        if (!roster) return;
        const { classroom } = roster;
        try {
            const res = await authFetch(
                `${API_BASE}/api/classes/${classroom.classroomId}/students/${studentId}`,
                { method: 'DELETE' }
            );
            if (!res.ok && res.status !== 204) {
                notify('error', await errorMessage(res, 'Could not remove the student.'));
                return;
            }
            setRoster((r) => ({ ...r, students: r.students.filter((s) => s.studentId !== studentId) }));
            fetchClasses();
        } catch {
            notify('error', 'Network error while removing the student.');
        }
    };

    const deleteClass = async (cls) => {
        if (!window.confirm(`Delete "${cls.name}"? Enrolled students will be unenrolled.`)) return;
        try {
            const res = await authFetch(`${API_BASE}/api/classes/${cls.classroomId}`, { method: 'DELETE' });
            if (!res.ok && res.status !== 204) {
                notify('error', await errorMessage(res, 'Could not delete the class.'));
                return;
            }
            notify('success', `Deleted "${cls.name}".`);
            fetchClasses();
        } catch {
            notify('error', 'Network error while deleting the class.');
        }
    };

    const totalStudents = useMemo(
        () => classes.reduce((acc, c) => acc + (c.studentCount || 0), 0),
        [classes]
    );

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
            <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 4, md: 6 } }}>
                {/* Header */}
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} sx={{ mb: 4 }}>
                    <Box>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate('/dashboard')}
                            sx={{ mb: 1, color: 'text.secondary' }}
                            size="small"
                        >
                            Back to Dashboard
                        </Button>
                        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
                            Teacher View
                        </Typography>
                        <Typography variant="h3" sx={{ color: 'text.primary', fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
                            My <Box component="span" sx={gradientText}>Classes</Box>
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            Create a class, share its code, and watch students enroll.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Chip icon={<GroupsIcon />} label={`${totalStudents} enrolled`} sx={{ fontWeight: 700 }} />
                        <Tooltip title="Refresh">
                            <IconButton onClick={fetchClasses} sx={{ border: '1.5px solid', borderColor: 'primary.main', color: 'primary.main' }}>
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>

                {/* Profile-incomplete guard */}
                {needsProfile && (
                    <Alert
                        severity="warning"
                        sx={{ mb: 4 }}
                        action={
                            <Button color="inherit" size="small" onClick={() => navigate('/teacher-details-form')}>
                                Complete profile
                            </Button>
                        }
                    >
                        Your teacher profile isn't set up yet. Complete it first, then you can create classes and join codes.
                    </Alert>
                )}

                {/* Create class */}
                <Card sx={{ mb: 4 }}>
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Typography variant="h5" sx={{ color: 'text.primary', mb: 2 }}>
                            Create a new class
                        </Typography>
                        <Box component="form" onSubmit={handleCreate}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>
                                <TextField
                                    label="Class name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    fullWidth
                                    size="small"
                                />
                                <TextField
                                    label="Description (optional)"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    disabled={creating || !name.trim() || needsProfile}
                                    sx={{ whiteSpace: 'nowrap', px: 3, py: 1 }}
                                >
                                    {creating ? 'Creating…' : 'Create'}
                                </Button>
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>

                {/* Class list */}
                {loadState === 'loading' && (
                    <Stack spacing={1} sx={{ py: 4 }}>
                        <LinearProgress />
                        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mt: 1 }}>
                            Loading your classes…
                        </Typography>
                    </Stack>
                )}
                {loadState === 'error' && (
                    <Typography sx={{ color: 'error.main', textAlign: 'center', py: 4 }}>
                        Couldn't load your classes. Make sure you're signed in as a teacher.
                    </Typography>
                )}
                {loadState === 'empty' && (
                    <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                        You haven't created any classes yet. Create one above to get a join code.
                    </Typography>
                )}
                {loadState === 'ok' && (
                    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' } }}>
                        {classes.map((cls) => (
                            <Card key={cls.classroomId}>
                                <CardContent sx={{ p: 3 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                        <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
                                            {cls.name}
                                        </Typography>
                                        <Tooltip title="Delete class">
                                            <IconButton size="small" onClick={() => deleteClass(cls)} sx={{ color: 'text.secondary' }}>
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                    {cls.description && (
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                            {cls.description}
                                        </Typography>
                                    )}

                                    <Box
                                        sx={{
                                            mt: 2,
                                            p: 1.5,
                                            borderRadius: 2,
                                            border: '1.5px dashed',
                                            borderColor: 'primary.main',
                                            bgcolor: 'rgba(200,69,109,0.08)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', lineHeight: 1 }}>
                                                Class code
                                            </Typography>
                                            <Typography
                                                variant="h5"
                                                sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 3, fontFamily: 'monospace' }}
                                            >
                                                {cls.classCode}
                                            </Typography>
                                        </Box>
                                        <Tooltip title="Copy code">
                                            <IconButton onClick={() => copyCode(cls.classCode)} sx={{ color: 'primary.main' }}>
                                                <ContentCopyIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                                        <Chip
                                            icon={<GroupsIcon />}
                                            label={`${cls.studentCount || 0} student${(cls.studentCount || 0) === 1 ? '' : 's'}`}
                                            size="small"
                                            sx={{ fontWeight: 700 }}
                                        />
                                        <Button size="small" onClick={() => openRoster(cls)}>
                                            View roster
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}
            </Box>

            {/* Roster dialog */}
            <Dialog open={!!roster} onClose={() => setRoster(null)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {roster?.classroom?.name} — Roster
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Code: {roster?.classroom?.classCode}
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    {roster?.loading ? (
                        <LinearProgress />
                    ) : roster?.students?.length ? (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Student</TableCell>
                                    <TableCell>Course</TableCell>
                                    <TableCell align="right">Remove</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {roster.students.map((s) => (
                                    <TableRow key={s.studentId}>
                                        <TableCell sx={{ fontWeight: 600 }}>{fullName(s)}</TableCell>
                                        <TableCell sx={{ color: 'text.secondary' }}>{s.course || '—'}</TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Remove from class">
                                                <IconButton size="small" onClick={() => removeStudent(s.studentId)} sx={{ color: 'text.secondary' }}>
                                                    <PersonRemoveIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <Typography sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
                            No students have joined yet. Share the code <b>{roster?.classroom?.classCode}</b> with your class.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRoster(null)}>Close</Button>
                </DialogActions>
            </Dialog>

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

export default TeacherClasses;
