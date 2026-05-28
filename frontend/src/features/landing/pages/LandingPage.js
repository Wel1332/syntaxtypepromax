import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Stack,
    Typography,
    Chip,
    useTheme,
} from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ExtensionIcon from '@mui/icons-material/Extension';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import TerminalIcon from '@mui/icons-material/Terminal';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

const FEATURES = [
    {
        icon: <KeyboardIcon fontSize="large" />,
        title: 'Typing Test',
        desc: 'Sharpen speed and accuracy with code snippets and curated word lists.',
    },
    {
        icon: <GpsFixedIcon fontSize="large" />,
        title: 'Syntax Sniper',
        desc: 'Fill-in-the-blank speedrun. Snipe the missing punctuation before the timer drops.',
    },
    {
        icon: <TerminalIcon fontSize="large" />,
        title: 'Translation Terminal',
        desc: 'English-to-C RPG combat. Translate prompts to code to slay pixel-art enemies.',
    },
    {
        icon: <CloudDownloadIcon fontSize="large" />,
        title: 'Falling Code',
        desc: 'Catch keywords before they hit the ground — then survive the Bug Bash phase.',
    },
    {
        icon: <RocketLaunchIcon fontSize="large" />,
        title: 'Galaxy Mode',
        desc: 'Blast through space challenges — type fast or get vaporized.',
    },
    {
        icon: <ExtensionIcon fontSize="large" />,
        title: 'Puzzles & Quizzes',
        desc: 'Crosswords, Bookworm, and quiz battles to flex your syntax brain.',
    },
];

const STEPS = [
    {
        icon: <PersonAddIcon fontSize="large" />,
        title: 'Sign Up',
        desc: 'Create your student account in seconds.',
    },
    {
        icon: <SportsEsportsIcon fontSize="large" />,
        title: 'Pick A Game',
        desc: 'Choose from typing tests, galaxy battles, falling code, and more.',
    },
    {
        icon: <TrendingUpIcon fontSize="large" />,
        title: 'Climb The Board',
        desc: 'Compete with classmates and track your progress over time.',
    },
];

const LandingPage = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [topScores, setTopScores] = useState([]);
    const [scoresState, setScoresState] = useState('loading'); // loading | ok | empty | error

    useEffect(() => {
        let cancelled = false;
        const fetchTop = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/leaderboards/global/all`);
                if (!res.ok) throw new Error('bad status');
                const data = await res.json();
                if (cancelled) return;
                const list = Array.isArray(data) ? data.slice(0, 5) : [];
                setTopScores(list);
                setScoresState(list.length ? 'ok' : 'empty');
            } catch (e) {
                if (!cancelled) setScoresState('error');
            }
        };
        fetchTop();
        return () => {
            cancelled = true;
        };
    }, []);

    const gradientText = {
        background: 'linear-gradient(90deg, #C8456D 0%, #E78AAC 50%, #FFC700 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        display: 'inline-block',
    };

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', overflowX: 'hidden' }}>
            {/* Hero */}
            <Box
                sx={{
                    position: 'relative',
                    pt: { xs: 8, md: 12 },
                    pb: { xs: 10, md: 14 },
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -120,
                        right: -120,
                        width: 360,
                        height: 360,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, #C8456D 0%, transparent 70%)',
                        opacity: isDark ? 0.35 : 0.22,
                        filter: 'blur(20px)',
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -160,
                        left: -160,
                        width: 420,
                        height: 420,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, #FFC700 0%, transparent 70%)',
                        opacity: isDark ? 0.25 : 0.18,
                        filter: 'blur(28px)',
                    },
                }}
            >
                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                    <Stack spacing={3} alignItems="center" textAlign="center">
                        <Chip
                            label="Game-Based eLearning Platform"
                            sx={{
                                bgcolor: isDark ? 'rgba(200,69,109,0.15)' : 'rgba(200,69,109,0.10)',
                                color: 'primary.main',
                                fontWeight: 700,
                                border: '1.5px solid',
                                borderColor: 'primary.main',
                            }}
                        />

                        <Box
                            component="img"
                            src="/images/syntaxtypelogo1.png"
                            alt="SyntaxType"
                            sx={{
                                width: { xs: '90%', sm: '70%', md: '60%' },
                                maxWidth: 720,
                                height: 'auto',
                                display: 'block',
                                filter: isDark
                                    ? 'drop-shadow(0 6px 0 rgba(0,0,0,0.6)) drop-shadow(0 0 24px rgba(255,199,0,0.25))'
                                    : 'drop-shadow(0 6px 0 rgba(0,0,0,0.4))',
                                imageRendering: 'pixelated',
                            }}
                        />

                        <Typography
                            variant="h4"
                            sx={{
                                color: 'text.primary',
                                fontSize: { xs: '1.25rem', md: '1.75rem' },
                                maxWidth: 720,
                            }}
                        >
                            Master code through play. Race the clock, dodge falling code, conquer the galaxy.
                        </Typography>

                        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600 }}>
                            A gamified typing platform built for learners and classrooms. Sharpen your fingers,
                            level up your syntax, and battle for the top of the leaderboard.
                        </Typography>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 2 }}>
                            <Button
                                component={RouterLink}
                                to="/register"
                                variant="contained"
                                color="primary"
                                size="large"
                                sx={{ py: 1.5, fontSize: '1.05rem', minWidth: 180 }}
                            >
                                Get Started Free
                            </Button>
                            <Button
                                component={RouterLink}
                                to="/login"
                                variant="outlined"
                                color="primary"
                                size="large"
                                sx={{ py: 1.5, fontSize: '1.05rem', minWidth: 180 }}
                            >
                                Sign In
                            </Button>
                        </Stack>

                        <Box
                            sx={{
                                mt: 4,
                                width: '100%',
                                maxWidth: 640,
                                bgcolor: isDark ? '#0A0A14' : '#1A1A2E',
                                color: '#FFF8F0',
                                borderRadius: 2,
                                p: 2.5,
                                textAlign: 'left',
                                fontFamily: '"JetBrains Mono", Menlo, Monaco, Consolas, monospace',
                                fontSize: { xs: '0.85rem', md: '1rem' },
                                border: '2px solid',
                                borderColor: 'primary.main',
                                boxShadow: `0 8px 32px ${isDark ? 'rgba(255,199,0,0.2)' : 'rgba(200,69,109,0.25)'}`,
                            }}
                        >
                            <Box sx={{ color: '#9CA3AF' }}>// type to begin</Box>
                            <Box sx={{ mt: 0.5 }}>
                                <Box component="span" sx={{ color: '#E78AAC' }}>const</Box>{' '}
                                <Box component="span" sx={{ color: '#FFC700' }}>you</Box>{' '}
                                <Box component="span" sx={{ color: '#FFF8F0' }}>=</Box>{' '}
                                <Box component="span" sx={{ color: '#FFC700' }}>'ready'</Box>
                                <Box component="span" sx={{ color: '#FFF8F0' }}>;</Box>
                                <Box
                                    component="span"
                                    sx={{
                                        display: 'inline-block',
                                        width: '10px',
                                        height: '1.1em',
                                        ml: 0.5,
                                        bgcolor: '#C8456D',
                                        verticalAlign: 'middle',
                                        animation: 'blink 1s steps(2, start) infinite',
                                        '@keyframes blink': {
                                            'to': { visibility: 'hidden' },
                                        },
                                    }}
                                />
                            </Box>
                        </Box>
                    </Stack>
                </Container>
            </Box>

            {/* Features */}
            <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
                <Stack spacing={2} textAlign="center" sx={{ mb: 6 }}>
                    <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
                        Game Modes
                    </Typography>
                    <Typography variant="h3" sx={{ color: 'text.primary' }}>
                        Pick your <Box component="span" sx={gradientText}>battle</Box>
                    </Typography>
                </Stack>

                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                        },
                    }}
                >
                    {FEATURES.map((f) => (
                        <Card key={f.title} sx={{ height: '100%', transition: 'transform 200ms', '&:hover': { transform: 'translate(-3px, -3px)' } }}>
                            <CardContent sx={{ p: 3, height: '100%' }}>
                                <Stack spacing={2} sx={{ height: '100%' }}>
                                    <Box sx={{ color: 'primary.main' }}>{f.icon}</Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        {f.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        {f.desc}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            </Container>

            {/* How it works */}
            <Box sx={{ bgcolor: isDark ? 'rgba(200,69,109,0.06)' : 'rgba(200,69,109,0.04)', py: { xs: 6, md: 10 } }}>
                <Container maxWidth="lg">
                    <Stack spacing={2} textAlign="center" sx={{ mb: 6 }}>
                        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
                            How It Works
                        </Typography>
                        <Typography variant="h3" sx={{ color: 'text.primary' }}>
                            Three steps to <Box component="span" sx={gradientText}>level up</Box>
                        </Typography>
                    </Stack>

                    <Box
                        sx={{
                            display: 'grid',
                            gap: 4,
                            gridTemplateColumns: {
                                xs: '1fr',
                                md: 'repeat(3, 1fr)',
                            },
                        }}
                    >
                        {STEPS.map((s, idx) => (
                            <Stack key={s.title} spacing={2} alignItems="center" textAlign="center">
                                    <Box
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: '50%',
                                            bgcolor: 'background.paper',
                                            border: '3px solid',
                                            borderColor: 'primary.main',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'primary.main',
                                            position: 'relative',
                                        }}
                                    >
                                        {s.icon}
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: -8,
                                                right: -8,
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                bgcolor: 'warning.main',
                                                color: '#1A1A2E',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 800,
                                                border: '2px solid #1A1A2E',
                                            }}
                                        >
                                            {idx + 1}
                                        </Box>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        {s.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 280 }}>
                                        {s.desc}
                                    </Typography>
                            </Stack>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* Leaderboard preview */}
            <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
                <Stack spacing={2} textAlign="center" sx={{ mb: 5 }}>
                    <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
                        Live Leaderboard
                    </Typography>
                    <Typography variant="h3" sx={{ color: 'text.primary' }}>
                        Top <Box component="span" sx={gradientText}>typists</Box> right now
                    </Typography>
                </Stack>

                <Card>
                    <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                        {scoresState === 'loading' && (
                            <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                                Loading…
                            </Typography>
                        )}
                        {scoresState === 'error' && (
                            <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                                Couldn't reach the leaderboard. Try again later.
                            </Typography>
                        )}
                        {scoresState === 'empty' && (
                            <Stack spacing={1} sx={{ textAlign: 'center', py: 4 }}>
                                <EmojiEventsIcon sx={{ fontSize: 48, color: 'warning.main', mx: 'auto' }} />
                                <Typography sx={{ color: 'text.primary', fontWeight: 700 }}>
                                    The board is empty.
                                </Typography>
                                <Typography sx={{ color: 'text.secondary' }}>
                                    Be the first to set a record.
                                </Typography>
                            </Stack>
                        )}
                        {scoresState === 'ok' && (
                            <Stack spacing={1.5}>
                                {topScores.map((row, i) => (
                                    <Stack
                                        key={`${row.username || 'p'}-${i}`}
                                        direction="row"
                                        alignItems="center"
                                        spacing={2}
                                        sx={{
                                            p: 1.5,
                                            borderRadius: 1.5,
                                            bgcolor: i === 0 ? (isDark ? 'rgba(255,215,0,0.10)' : 'rgba(255,215,0,0.15)') : 'transparent',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: '50%',
                                                bgcolor: i === 0 ? 'warning.main' : 'primary.main',
                                                color: i === 0 ? '#1A1A2E' : '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 800,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {i + 1}
                                        </Box>
                                        <Typography sx={{ flexGrow: 1, color: 'text.primary', fontWeight: 600 }}>
                                            {row.username || row.user?.username || 'Player'}
                                        </Typography>
                                        <Typography sx={{ color: 'primary.main', fontWeight: 800 }}>
                                            {row.score ?? row.totalScore ?? row.wpm ?? '—'}
                                        </Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        )}
                        <Box sx={{ textAlign: 'center', mt: 3 }}>
                            <Button component={RouterLink} to="/leaderboard" variant="text" color="primary">
                                View full leaderboard →
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Container>

            {/* CTA */}
            <Container maxWidth="md" sx={{ py: { xs: 6, md: 8 } }}>
                <Stack spacing={3} alignItems="center" textAlign="center">
                    <Typography variant="h3" sx={{ color: 'text.primary' }}>
                        Ready to type your way to the <Box component="span" sx={gradientText}>top</Box>?
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 520 }}>
                        Free to join. No credit card. Just keyboards and good vibes.
                    </Typography>
                    <Button
                        component={RouterLink}
                        to="/register"
                        variant="contained"
                        color="primary"
                        size="large"
                        sx={{ py: 1.5, px: 4, fontSize: '1.05rem' }}
                    >
                        Create Your Account
                    </Button>
                </Stack>
            </Container>

            {/* Footer */}
            <Box sx={{ py: 4, textAlign: 'center', borderTop: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    © {new Date().getFullYear()} SyntaxType · Built for learners
                </Typography>
            </Box>
        </Box>
    );
};

export default LandingPage;
