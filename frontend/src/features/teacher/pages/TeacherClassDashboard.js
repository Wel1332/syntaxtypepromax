import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Stack,
    Typography,
    Chip,
    LinearProgress,
    TextField,
    InputAdornment,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableSortLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Tooltip,
    Button,
    useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';
import BoltIcon from '@mui/icons-material/Bolt';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import TimerIcon from '@mui/icons-material/Timer';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
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

const fullName = (s) =>
    [s.firstName, s.lastName].filter(Boolean).join(' ').trim() ||
    s.user?.username ||
    s.universityEmail ||
    `Student #${s.studentId}`;

const TeacherClassDashboard = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const navigate = useNavigate();

    const [students, setStudents] = useState([]);
    const [statsByUserId, setStatsByUserId] = useState({});
    const [loadState, setLoadState] = useState('loading');
    const [search, setSearch] = useState('');
    const [orderBy, setOrderBy] = useState('name');
    const [order, setOrder] = useState('asc');
    const [selected, setSelected] = useState(null);

    const fetchRoster = async () => {
        setLoadState('loading');
        try {
            const res = await authFetch(`${API_BASE}/api/students`);
            if (!res.ok) throw new Error('students fetch failed');
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];
            setStudents(list);

            const userIds = list
                .map((s) => s.user?.userId)
                .filter((id) => id != null);

            const statsEntries = await Promise.all(
                userIds.map(async (uid) => {
                    try {
                        const r = await authFetch(`${API_BASE}/api/user-statistics/user?userId=${uid}`);
                        if (!r.ok) return [uid, null];
                        const body = await r.json();
                        // backend wraps in Optional → may come as { present, value } or plain object
                        const stat =
                            body && body.value
                                ? body.value
                                : body && body.userId != null
                                ? body
                                : null;
                        return [uid, stat];
                    } catch {
                        return [uid, null];
                    }
                })
            );

            const map = {};
            statsEntries.forEach(([uid, s]) => {
                if (s) map[uid] = s;
            });
            setStatsByUserId(map);
            setLoadState(list.length ? 'ok' : 'empty');
        } catch (e) {
            setLoadState('error');
        }
    };

    useEffect(() => {
        fetchRoster();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const rows = useMemo(() => {
        const built = students.map((s) => {
            const uid = s.user?.userId;
            const stat = uid != null ? statsByUserId[uid] : null;
            return {
                studentId: s.studentId,
                userId: uid,
                name: fullName(s),
                course: s.course || '—',
                section: [s.className, s.section].filter(Boolean).join(' · ') || '—',
                wpm: stat?.wordsPerMinute ?? 0,
                accuracy: stat?.accuracy ?? 0,
                tests: stat?.totalTestsTaken ?? 0,
                errors: stat?.totalErrors ?? 0,
                time: stat?.totalTimeSpent ?? 0,
                hasStats: !!stat,
            };
        });

        const term = search.trim().toLowerCase();
        const filtered = term
            ? built.filter(
                  (r) =>
                      r.name.toLowerCase().includes(term) ||
                      r.course.toLowerCase().includes(term) ||
                      r.section.toLowerCase().includes(term)
              )
            : built;

        const dir = order === 'asc' ? 1 : -1;
        return [...filtered].sort((a, b) => {
            const av = a[orderBy];
            const bv = b[orderBy];
            if (typeof av === 'string') return av.localeCompare(bv) * dir;
            return ((av ?? 0) - (bv ?? 0)) * dir;
        });
    }, [students, statsByUserId, search, orderBy, order]);

    const summary = useMemo(() => {
        const withStats = rows.filter((r) => r.hasStats);
        const n = withStats.length;
        const avg = (key) =>
            n ? Math.round(withStats.reduce((acc, r) => acc + (r[key] || 0), 0) / n) : 0;
        return {
            count: students.length,
            activeCount: n,
            avgWpm: avg('wpm'),
            avgAcc: avg('accuracy'),
            totalTests: withStats.reduce((acc, r) => acc + (r.tests || 0), 0),
        };
    }, [rows, students.length]);

    const handleSort = (key) => {
        if (orderBy === key) {
            setOrder(order === 'asc' ? 'desc' : 'asc');
        } else {
            setOrderBy(key);
            setOrder(key === 'name' ? 'asc' : 'desc');
        }
    };

    const statCards = [
        { label: 'Total Students', value: summary.count, icon: <GroupsIcon />, accent: '#C8456D' },
        { label: 'Active (with stats)', value: summary.activeCount, icon: <CenterFocusStrongIcon />, accent: '#FFC700' },
        { label: 'Class Avg WPM', value: summary.avgWpm, icon: <BoltIcon />, accent: '#E78AAC' },
        { label: 'Class Avg Accuracy', value: `${summary.avgAcc}%`, icon: <TimerIcon />, accent: '#9B2E54' },
    ];

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
            <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1280, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 4, md: 6 } }}>
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
                            My <Box component="span" sx={gradientText}>Class</Box>
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            Real-time view of every student's typing progress.
                        </Typography>
                    </Box>
                    <Tooltip title="Refresh">
                        <IconButton onClick={fetchRoster} sx={{ border: '1.5px solid', borderColor: 'primary.main', color: 'primary.main' }}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>

                {/* Stat Grid */}
                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                        mb: 4,
                    }}
                >
                    {statCards.map((s) => (
                        <Card key={s.label}>
                            <CardContent sx={{ p: 3 }}>
                                <Box
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: `${s.accent}22`,
                                        color: s.accent,
                                        border: '2px solid',
                                        borderColor: s.accent,
                                        mb: 2,
                                    }}
                                >
                                    {s.icon}
                                </Box>
                                <Typography
                                    variant="h3"
                                    sx={{
                                        color: 'text.primary',
                                        fontSize: { xs: '1.75rem', md: '2.25rem' },
                                        lineHeight: 1,
                                        fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
                                        fontVariantNumeric: 'tabular-nums',
                                    }}
                                >
                                    {s.value}
                                </Typography>
                                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, mt: 1, display: 'block' }}>
                                    {s.label}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>

                {/* Roster Card */}
                <Card>
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
                            <Typography variant="h5" sx={{ color: 'text.primary' }}>
                                Roster
                            </Typography>
                            <TextField
                                size="small"
                                placeholder="Search by name, course, section…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ minWidth: { sm: 320 } }}
                            />
                        </Stack>

                        {loadState === 'loading' && (
                            <Stack spacing={1} sx={{ py: 4 }}>
                                <LinearProgress />
                                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mt: 1 }}>
                                    Loading roster…
                                </Typography>
                            </Stack>
                        )}
                        {loadState === 'error' && (
                            <Typography sx={{ color: 'error.main', textAlign: 'center', py: 4 }}>
                                Couldn't load students. Make sure you're signed in as a teacher and the backend is reachable.
                            </Typography>
                        )}
                        {loadState === 'empty' && (
                            <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                                No students have signed up yet.
                            </Typography>
                        )}
                        {loadState === 'ok' && (
                            <Box sx={{ overflowX: 'auto' }}>
                                <Table size="small" sx={{ minWidth: 720 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>
                                                <TableSortLabel active={orderBy === 'name'} direction={order} onClick={() => handleSort('name')}>Student</TableSortLabel>
                                            </TableCell>
                                            <TableCell>
                                                <TableSortLabel active={orderBy === 'course'} direction={order} onClick={() => handleSort('course')}>Course</TableSortLabel>
                                            </TableCell>
                                            <TableCell>Section</TableCell>
                                            <TableCell align="right">
                                                <TableSortLabel active={orderBy === 'wpm'} direction={order} onClick={() => handleSort('wpm')}>WPM</TableSortLabel>
                                            </TableCell>
                                            <TableCell align="right">
                                                <TableSortLabel active={orderBy === 'accuracy'} direction={order} onClick={() => handleSort('accuracy')}>Acc</TableSortLabel>
                                            </TableCell>
                                            <TableCell align="right">
                                                <TableSortLabel active={orderBy === 'tests'} direction={order} onClick={() => handleSort('tests')}>Tests</TableSortLabel>
                                            </TableCell>
                                            <TableCell align="right">
                                                <TableSortLabel active={orderBy === 'errors'} direction={order} onClick={() => handleSort('errors')}>Errors</TableSortLabel>
                                            </TableCell>
                                            <TableCell align="center">Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {rows.map((r) => (
                                            <TableRow
                                                key={r.studentId}
                                                hover
                                                onClick={() => setSelected(r)}
                                                sx={{ cursor: 'pointer' }}
                                            >
                                                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{r.name}</TableCell>
                                                <TableCell sx={{ color: 'text.secondary' }}>{r.course}</TableCell>
                                                <TableCell sx={{ color: 'text.secondary' }}>{r.section}</TableCell>
                                                <TableCell align="right" sx={{ color: r.wpm > 0 ? 'primary.main' : 'text.secondary', fontWeight: r.wpm > 0 ? 700 : 400 }}>
                                                    {r.wpm}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: 'text.primary' }}>{r.accuracy}%</TableCell>
                                                <TableCell align="right" sx={{ color: 'text.secondary' }}>{r.tests}</TableCell>
                                                <TableCell align="right" sx={{ color: 'text.secondary' }}>{r.errors}</TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        size="small"
                                                        label={r.hasStats ? 'Active' : 'No activity'}
                                                        sx={{
                                                            bgcolor: r.hasStats ? 'rgba(45,122,58,0.15)' : 'rgba(0,0,0,0.06)',
                                                            color: r.hasStats ? '#2D7A3A' : 'text.secondary',
                                                            fontWeight: 700,
                                                            border: '1.5px solid',
                                                            borderColor: r.hasStats ? '#2D7A3A' : 'rgba(0,0,0,0.12)',
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {rows.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={8} sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
                                                    No matches.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Box>

            {/* Drill-down dialog */}
            <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ pr: 6 }}>
                    {selected?.name}
                    <IconButton onClick={() => setSelected(null)} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selected && (
                        <Stack spacing={1.5}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Course</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected.course}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Section</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected.section}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Words / minute</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>{selected.wpm}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Accuracy</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected.accuracy}%</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Total tests taken</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected.tests}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Total errors</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected.errors}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Total time (seconds)</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected.time}</Typography>
                            </Stack>
                            {!selected.hasStats && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', pt: 1 }}>
                                    This student hasn't played any games yet.
                                </Typography>
                            )}
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default TeacherClassDashboard;
