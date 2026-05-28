import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Stack,
    Typography,
    Button,
    Chip,
    LinearProgress,
    Divider,
    useTheme,
} from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BoltIcon from '@mui/icons-material/Bolt';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PendingIcon from '@mui/icons-material/Pending';
import { getAuthToken } from '../../../shared/auth/AuthUtils';
import { getUserRole } from '../../../shared/auth/JwtUtils';
import { authFetch } from '../../../shared/api/authFetch';
import { API_BASE } from '../../../shared/api/client';

const gradientText = {
    background: 'linear-gradient(90deg, #C8456D 0%, #E78AAC 50%, #FFC700 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'inline-block',
};

const STATUS_META = {
    completed: { label: 'COMPLETED', color: '#2D7A3A', icon: <CheckCircleIcon /> },
    'in-progress': { label: 'IN PROGRESS', color: '#B45309', icon: <HourglassEmptyIcon /> },
    pending: { label: 'PENDING', color: '#9B2E54', icon: <PendingIcon /> },
};

const Dashboard = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const navigate = useNavigate();

    const token = getAuthToken();
    const userRole = useMemo(() => {
        try {
            return token ? getUserRole(token) : 'STUDENT';
        } catch (e) {
            return 'STUDENT';
        }
    }, [token]);

    const userName = localStorage.getItem('userName') || 'Player';

    const [classStats, setClassStats] = useState(null);

    useEffect(() => {
        if (userRole !== 'TEACHER' && userRole !== 'ADMIN') return;
        let cancelled = false;
        (async () => {
            try {
                const [sRes, lRes] = await Promise.all([
                    authFetch(`${API_BASE}/api/students`),
                    authFetch(`${API_BASE}/api/lessons`),
                ]);
                const students = sRes.ok ? await sRes.json() : [];
                const lessons = lRes.ok ? await lRes.json() : [];
                const list = Array.isArray(students) ? students : [];
                const lessonCount = Array.isArray(lessons) ? lessons.length : 0;
                const userIds = list.map((s) => s.user?.userId).filter((id) => id != null);

                const statEntries = await Promise.all(
                    userIds.map(async (uid) => {
                        try {
                            const r = await authFetch(`${API_BASE}/api/user-statistics/user?userId=${uid}`);
                            if (!r.ok) return null;
                            const body = await r.json();
                            return body && body.value ? body.value : body && body.userId != null ? body : null;
                        } catch {
                            return null;
                        }
                    })
                );

                const valid = statEntries.filter(Boolean);
                const avg = (key) =>
                    valid.length ? Math.round(valid.reduce((a, s) => a + (s[key] || 0), 0) / valid.length) : 0;

                if (!cancelled) {
                    setClassStats({
                        totalStudents: list.length,
                        totalLessons: lessonCount,
                        averageWPM: avg('wordsPerMinute'),
                        accuracy: avg('accuracy'),
                    });
                }
            } catch {
                // leave classStats null → cards show 0
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [userRole]);

    const stats = {
        totalLessons: classStats?.totalLessons ?? 12,
        completedLessons: 8,
        averageWPM: classStats?.averageWPM ?? 0,
        accuracy: classStats?.accuracy ?? 0,
        totalStudents: classStats?.totalStudents ?? 0,
        totalTeachers: 0,
    };

    const recentActivities = [
        { id: 1, title: 'Basic Typing Fundamentals', date: '2024-01-15', status: 'completed' },
        { id: 2, title: 'Speed Test Challenge', date: '2024-01-14', status: 'in-progress' },
        { id: 3, title: 'Advanced Key Combinations', date: '2024-01-13', status: 'pending' },
    ];

    const statCards = useMemo(() => {
        if (userRole === 'ADMIN') {
            return [
                { label: 'Total Users', value: stats.totalStudents + stats.totalTeachers, icon: <GroupsIcon />, accent: '#C8456D' },
                { label: 'Students', value: stats.totalStudents, icon: <SchoolIcon />, accent: '#FFC700' },
                { label: 'Teachers', value: stats.totalTeachers, icon: <SchoolIcon />, accent: '#E78AAC' },
                { label: 'Lessons', value: stats.totalLessons, icon: <MenuBookIcon />, accent: '#9B2E54' },
            ];
        }
        if (userRole === 'TEACHER') {
            return [
                { label: 'Students', value: stats.totalStudents, icon: <GroupsIcon />, accent: '#C8456D' },
                { label: 'Total Lessons', value: stats.totalLessons, icon: <MenuBookIcon />, accent: '#FFC700' },
                { label: 'Class Avg WPM', value: stats.averageWPM, icon: <BoltIcon />, accent: '#E78AAC' },
                { label: 'Class Accuracy', value: `${stats.accuracy}%`, icon: <CenterFocusStrongIcon />, accent: '#9B2E54' },
            ];
        }
        return [
            { label: 'Lessons Done', value: `${stats.completedLessons}/${stats.totalLessons}`, icon: <MenuBookIcon />, accent: '#C8456D' },
            { label: 'Average WPM', value: stats.averageWPM, icon: <BoltIcon />, accent: '#FFC700' },
            { label: 'Accuracy', value: `${stats.accuracy}%`, icon: <CenterFocusStrongIcon />, accent: '#E78AAC' },
            { label: 'Progress', value: `${Math.round((stats.completedLessons / stats.totalLessons) * 100)}%`, icon: <TrendingUpIcon />, accent: '#9B2E54' },
        ];
    }, [userRole, stats.totalStudents, stats.totalTeachers, stats.totalLessons, stats.averageWPM, stats.accuracy, stats.completedLessons]);

    const quickActions = useMemo(() => {
        const base = [
            { label: 'Typing Test', path: '/typingtest', icon: <KeyboardIcon /> },
            { label: 'Falling Code', path: '/fallingtypingtest', icon: <CloudDownloadIcon /> },
            { label: 'Galaxy Mode', path: '/galaxy-new', icon: <RocketLaunchIcon /> },
            { label: 'All Lessons', path: '/lessons/all', icon: <MenuBookIcon /> },
        ];
        const extras = {
            STUDENT: [
                { label: 'Leaderboard', path: '/leaderboard', icon: <EmojiEventsIcon /> },
                { label: 'My Profile', path: '/student-details-form', icon: <ManageAccountsIcon /> },
            ],
            TEACHER: [
                { label: 'My Class', path: '/teacher/class', icon: <GroupsIcon /> },
                { label: 'Instructor', path: '/instructor', icon: <SchoolIcon /> },
                { label: 'Create Lesson', path: '/lesson', icon: <EditNoteIcon /> },
                { label: 'Challenges', path: '/challenges', icon: <BoltIcon /> },
                { label: 'My Profile', path: '/teacher-details-form', icon: <ManageAccountsIcon /> },
            ],
            ADMIN: [
                { label: 'My Class', path: '/teacher/class', icon: <GroupsIcon /> },
                { label: 'Manage Users', path: '/admin/users', icon: <GroupsIcon /> },
                { label: 'Instructor', path: '/instructor', icon: <SchoolIcon /> },
                { label: 'Create Lesson', path: '/lesson', icon: <EditNoteIcon /> },
                { label: 'Challenges', path: '/challenges', icon: <BoltIcon /> },
            ],
        };
        return [...base, ...(extras[userRole] || [])];
    }, [userRole]);

    const progressPct = Math.round((stats.completedLessons / stats.totalLessons) * 100);

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
            {/* Ambient blobs */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -160,
                    right: -160,
                    width: 420,
                    height: 420,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #C8456D 0%, transparent 70%)',
                    opacity: isDark ? 0.25 : 0.15,
                    filter: 'blur(28px)',
                    pointerEvents: 'none',
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: -200,
                    left: -200,
                    width: 480,
                    height: 480,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #FFC700 0%, transparent 70%)',
                    opacity: isDark ? 0.18 : 0.12,
                    filter: 'blur(32px)',
                    pointerEvents: 'none',
                }}
            />

            <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 4, md: 6 } }}>
                {/* Welcome Card */}
                <Card sx={{ mb: 4 }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ md: 'center' }} justifyContent="space-between">
                            <Box>
                                <Chip
                                    label={userRole}
                                    sx={{
                                        bgcolor: 'rgba(200,69,109,0.12)',
                                        color: 'primary.main',
                                        fontWeight: 700,
                                        border: '1.5px solid',
                                        borderColor: 'primary.main',
                                        mb: 1.5,
                                    }}
                                />
                                <Typography variant="h3" sx={{ color: 'text.primary', fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
                                    Welcome back, <Box component="span" sx={gradientText}>{userName}</Box>
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
                                    Ready to climb the leaderboard? Pick a game and let's go.
                                </Typography>
                            </Box>
                            {userRole === 'STUDENT' && (
                                <Box sx={{ minWidth: { md: 240 } }}>
                                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700 }}>Course Progress</Typography>
                                        <Typography variant="overline" sx={{ color: 'text.primary', fontWeight: 700 }}>{progressPct}%</Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={progressPct}
                                        sx={{
                                            height: 10,
                                            borderRadius: 999,
                                            bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                            '& .MuiLinearProgress-bar': {
                                                background: 'linear-gradient(90deg, #C8456D 0%, #FFC700 100%)',
                                                borderRadius: 999,
                                            },
                                        }}
                                    />
                                </Box>
                            )}
                        </Stack>
                    </CardContent>
                </Card>

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
                        <Card key={s.label} sx={{ transition: 'transform 200ms', '&:hover': { transform: 'translate(-2px,-2px)' } }}>
                            <CardContent sx={{ p: 3 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
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
                                        }}
                                    >
                                        {s.icon}
                                    </Box>
                                </Stack>
                                <Typography variant="h3" sx={{ color: 'text.primary', fontSize: { xs: '1.75rem', md: '2.25rem' }, lineHeight: 1 }}>
                                    {s.value}
                                </Typography>
                                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, mt: 1, display: 'block' }}>
                                    {s.label}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>

                {/* Quick Actions */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
                        Quick Actions
                    </Typography>
                    <Typography variant="h4" sx={{ color: 'text.primary', mb: 3 }}>
                        Pick your <Box component="span" sx={gradientText}>battle</Box>
                    </Typography>
                    <Box
                        sx={{
                            display: 'grid',
                            gap: 2,
                            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
                        }}
                    >
                        {quickActions.map((a) => (
                            <Button
                                key={a.label}
                                onClick={() => navigate(a.path)}
                                variant="contained"
                                color="primary"
                                startIcon={a.icon}
                                sx={{
                                    py: 1.75,
                                    px: 2,
                                    fontSize: { xs: '0.85rem', md: '0.95rem' },
                                    justifyContent: 'flex-start',
                                    textAlign: 'left',
                                }}
                            >
                                {a.label}
                            </Button>
                        ))}
                    </Box>
                </Box>

                {/* Recent Activities */}
                <Card>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="h5" sx={{ color: 'text.primary' }}>
                                Recent Activity
                            </Typography>
                            <Chip
                                icon={<EmojiEventsIcon sx={{ fontSize: 16 }} />}
                                label={`${recentActivities.length} entries`}
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(255,199,0,0.15)',
                                    color: 'warning.main',
                                    fontWeight: 700,
                                    border: '1.5px solid',
                                    borderColor: 'warning.main',
                                }}
                            />
                        </Stack>
                        <Stack divider={<Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />}>
                            {recentActivities.map((a) => {
                                const meta = STATUS_META[a.status] || STATUS_META.pending;
                                return (
                                    <Stack
                                        key={a.id}
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        sx={{ py: 2 }}
                                    >
                                        <Box>
                                            <Typography sx={{ color: 'text.primary', fontWeight: 700 }}>{a.title}</Typography>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{a.date}</Typography>
                                        </Box>
                                        <Chip
                                            icon={React.cloneElement(meta.icon, { sx: { fontSize: 16, color: `${meta.color} !important` } })}
                                            label={meta.label}
                                            size="small"
                                            sx={{
                                                bgcolor: `${meta.color}22`,
                                                color: meta.color,
                                                fontWeight: 700,
                                                border: '1.5px solid',
                                                borderColor: meta.color,
                                                '& .MuiChip-icon': { color: meta.color },
                                            }}
                                        />
                                    </Stack>
                                );
                            })}
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default Dashboard;
