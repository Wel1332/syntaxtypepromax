import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Stack, Typography, useMediaQuery } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import TerminalIcon from '@mui/icons-material/Terminal';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ExtensionIcon from '@mui/icons-material/Extension';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

// ── Tokens ────────────────────────────────────────────────────────────────────
// The landing page paints its own surface rather than reading the MUI palette.
// It is the one screen that must look identical to a visitor who has never
// opened the app and therefore has the default light theme set.
const C = {
    ink: '#0B0714',
    inkSoft: '#100A1C',
    band: '#150E26',
    panel: '#171029',
    panelHi: '#1E1434',
    console: '#080116',
    line: 'rgba(255,255,255,0.08)',
    lineHi: 'rgba(255,255,255,0.16)',
    text: '#F4EFFF',
    dim: '#9C90B8',
    pink: '#FF3D82',
    pinkDeep: '#C8456D',
    gold: '#FFC700',
    cyan: '#3ED0E0',
    violet: '#9A6BFF',
};

const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

// Display type is monospace throughout. On a product about typing code, the
// headline set in the same face as the code is the identity — not decoration.
const display = {
    fontFamily: MONO,
    fontWeight: 400,
    lineHeight: 1.15,
    letterSpacing: 0,
    color: C.text,
};

const eyebrow = {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: C.pink,
};

const focusRing = {
    '&:focus-visible': {
        outline: `2px solid ${C.gold}`,
        outlineOffset: 3,
        borderRadius: 2,
    },
};

const MODES = [
    {
        kicker: 'Speed run', title: 'Typing Test', to: '/typingtest', accent: C.pink,
        icon: <KeyboardIcon fontSize="small" />,
        desc: 'Build muscle memory with real code snippets and instant accuracy feedback.',
    },
    {
        kicker: 'Precision', title: 'Syntax Sniper', to: '/syntax-sniper', accent: C.gold,
        icon: <GpsFixedIcon fontSize="small" />,
        desc: 'Spot missing punctuation and repair broken code before the timer hits zero.',
    },
    {
        kicker: 'Logic quest', title: 'Translation Terminal', to: '/translation-terminal', accent: C.cyan,
        icon: <TerminalIcon fontSize="small" />,
        desc: 'Translate plain-English prompts into C and defeat pixel-art enemies.',
    },
    {
        kicker: 'Arcade', title: 'Falling Code', to: '/fallingtypingtest', accent: C.violet,
        icon: <CloudDownloadIcon fontSize="small" />,
        desc: 'Catch keywords before they hit the ground, then survive the Bug Bash.',
    },
    {
        kicker: 'Adventure', title: 'Galaxy Mode', to: '/galaxy', accent: C.pink,
        icon: <RocketLaunchIcon fontSize="small" />,
        desc: 'Blast through space challenges that turn practice into a full campaign.',
    },
    {
        kicker: 'Brain mode', title: 'Logic Puzzles', to: '/logic-puzzles', accent: C.gold,
        icon: <ExtensionIcon fontSize="small" />,
        desc: 'Trace loops, pointers and operators to predict what the code prints.',
    },
];

const STEPS = [
    {
        n: '01', title: 'Make your profile', icon: <PersonAddIcon />,
        desc: 'Create an account and pick the skill you want to sharpen first.',
    },
    {
        n: '02', title: 'Pick a challenge', icon: <SportsEsportsIcon />,
        desc: 'Jump into a game mode built around that skill. Rounds run under two minutes.',
    },
    {
        n: '03', title: 'Climb the board', icon: <EmojiEventsIcon />,
        desc: 'Earn XP, unlock badges, and watch your accuracy climb run over run.',
    },
];

// ── Hero console ──────────────────────────────────────────────────────────────
// A still of a real round, matching the reference exactly: the challenge line is
// shown once as the target, and the input below waits with its prompt. It used to
// auto-type that same line into the input, which rendered the code twice and read
// as a duplicate rather than a demo. Only the caret moves now.
const HeroTerminal = () => {
    const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

    return (
        <Box
            aria-hidden="true"
            sx={{
                borderRadius: '8px',
                border: `1px solid ${C.lineHi}`,
                bgcolor: C.console,
                overflow: 'hidden',
                fontFamily: MONO,
                fontSize: 13,
                boxShadow: {
                    xs: '0 24px 60px rgba(0,0,0,0.5)',
                    md: [
                        // Offset block in the panel's own black, no outline. It reads
                        // only where it crosses the hero's purple wash behind it.
                        `10px 10px 0 0 ${C.console}`,
                        '0 36px 90px rgba(0,0,0,0.55)',
                    ].join(', '),
                },
                transform: {
                    xs: 'none',
                    md: 'perspective(1600px) rotateX(1.5deg) rotate(2.1deg)',
                },
                transformOrigin: 'center',
            }}
        >
            <Stack
                direction="row"
                alignItems="center"
                spacing={1.2}
                sx={{ px: 2, py: 1.4, borderBottom: `1px solid ${C.line}` }}
            >
                <Stack direction="row" spacing={0.7}>
                    {[C.pink, C.gold, C.cyan].map((c) => (
                        <Box key={c} sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: c, opacity: 0.85 }} />
                    ))}
                </Stack>
                <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.dim, flexGrow: 1 }}>
                    training-room / warm-up
                </Typography>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#3BE08A' }} />
                <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: '#3BE08A', letterSpacing: '0.12em' }}>
                    LIVE
                </Typography>
            </Stack>

            <Box sx={{ p: { xs: 2.2, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography sx={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.16em', color: C.pink }}>
                        CHALLENGE 01
                    </Typography>
                    <Typography sx={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.16em', color: C.gold }}>
                        +100 XP
                    </Typography>
                </Stack>

                <Typography sx={{ color: C.dim, fontSize: 12.5, mb: 1.4 }}>
                    Type the line below to start your run.
                </Typography>

                <Box sx={{ fontSize: { xs: 14, sm: 16 }, mb: 2.2, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    <Box component="span" sx={{ color: C.pink }}>const</Box>{' '}
                    <Box component="span" sx={{ color: C.text }}>score</Box>{' '}
                    <Box component="span" sx={{ color: C.dim }}>=</Box>{' '}
                    <Box component="span" sx={{ color: C.gold }}>100</Box>
                    <Box component="span" sx={{ color: C.dim }}>;</Box>
                </Box>

                <Box
                    sx={{
                        border: `1px solid ${C.lineHi}`,
                        borderRadius: '6px',
                        px: 1.8, py: 1.4,
                        bgcolor: 'transparent',
                        minHeight: 46,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Box component="span" sx={{ color: C.dim, fontSize: 13.5 }}>
                        Start typing here...
                    </Box>
                    <Box
                        sx={{
                            width: 7, height: 15, ml: 0.5, bgcolor: C.pink, flexShrink: 0,
                            animation: reduceMotion ? 'none' : 'stCaret 1.1s steps(2) infinite',
                            '@keyframes stCaret': { to: { opacity: 0 } },
                        }}
                    />
                </Box>

                <Box sx={{ mt: 2.4, mb: 1.6, height: '1px', bgcolor: C.line }} />

                <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.dim }}>
                        your keyboard is your controller
                    </Typography>
                    <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.gold }}>
                        0 streak
                    </Typography>
                </Stack>
            </Box>
        </Box>
    );
};

const LandingPage = () => {
    const [board, setBoard] = useState([]);
    const [boardState, setBoardState] = useState('loading'); // loading | ok | empty | error
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                // /global, not /global/all — the latter has never existed on the backend.
                const res = await fetch(`${API_BASE}/api/leaderboards/global`);
                if (!res.ok) throw new Error('bad status');
                const data = await res.json();
                if (cancelled) return;
                const list = Array.isArray(data) ? data : [];
                setBoard(list);
                setBoardState(list.length ? 'ok' : 'empty');
            } catch {
                if (!cancelled) setBoardState('error');
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const top = useMemo(() => board.slice(0, 5), [board]);

    // Routes '/' to the landing page only for guests (see routes.js RootRedirect),
    // so every visitor here is signed out. Game routes are role-protected, and
    // linking straight to one bounces the visitor through the guard to /login with
    // no explanation, so the cards point at sign-up -- which is what they are
    // actually asking for.
    const SIGN_UP = '/register';

    // Built from Box, not Button. The MUI theme forces every MuiButton to
    // borderRadius: 999 with paddingInline: 24 (ThemeContext styleOverrides),
    // which turned the reference's rounded rectangles into capsules and ignored
    // the horizontal padding set here. These are links, so Box sidesteps it.
    const btnBase = {
        ...focusRing,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.9,
        borderRadius: '6px',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        lineHeight: 1,
        transition: 'box-shadow 180ms, background-color 180ms, border-color 180ms, filter 180ms',
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
    };

    const primaryBtn = {
        ...btnBase,
        px: 2.5, py: 1.35,
        fontWeight: 700,
        fontSize: 14,
        color: '#FFFFFF',
        background: `linear-gradient(96deg, ${C.pink} 0%, #FF5C86 78%, #FF7E63 155%)`,
        // No glow, resting or on hover. A soft pink halo that swells under the
        // cursor is the generic look this design is meant to avoid. The button
        // still needs to answer the pointer, so it lifts a little in brightness
        // and nothing else.
        '&:hover': { filter: 'brightness(1.07)' },
    };

    // Gold block sitting behind the pink fill. Pressing it slides the button onto
    // its own shadow, so the control reads as physically depressed.
    const primaryBtnStacked = {
        ...primaryBtn,
        boxShadow: `5px 5px 0 0 ${C.gold}`,
        '&:hover': { boxShadow: `7px 7px 0 0 ${C.gold}`, transform: 'translate(-1px, -1px)' },
        '&:active': { boxShadow: `2px 2px 0 0 ${C.gold}`, transform: 'translate(3px, 3px)' },
    };

    const ghostBtn = {
        ...btnBase,
        px: 2.5, py: 1.35,
        fontWeight: 700,
        fontSize: 14,
        color: C.text,
        bgcolor: C.panel,
        border: `1px solid ${C.lineHi}`,
        '&:hover': { borderColor: C.pink, bgcolor: C.panelHi },
    };

    return (
        <Box sx={{ bgcolor: C.ink, color: C.text, minHeight: '100vh', overflowX: 'hidden' }}>
            {/* Header — the landing page owns its own, so the themed app AppBar is
                hidden on this route (see App.js). */}
            <Box component="header" sx={{ borderBottom: `1px solid ${C.line}` }}>
                <Container maxWidth="lg">
                    <Stack direction="row" alignItems="center" sx={{ py: 1.5, gap: { xs: 1, md: 2 }, minWidth: 0 }}>
                        <Box
                            component={RouterLink}
                            to="/"
                            sx={{ display: 'flex', alignItems: 'center', ...focusRing }}
                            aria-label="SyntaxType home"
                        >
                            <Box
                                component="img"
                                src="/images/syntaxtypelogo1.png"
                                alt="SyntaxType"
                                sx={{ height: { xs: 30, md: 38 }, width: 'auto', imageRendering: 'pixelated' }}
                            />
                        </Box>

                        <Box sx={{ flexGrow: 1 }} />

                        <Stack direction="row" spacing={3} sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }}>
                            {[
                                { label: 'Game modes', href: '#modes' },
                                { label: 'How it works', href: '#loop' },
                            ].map((l) => (
                                <Box
                                    key={l.label}
                                    component="a"
                                    href={l.href}
                                    sx={{
                                        ...focusRing,
                                        fontSize: 13.5, fontWeight: 600, color: C.dim,
                                        textDecoration: 'none',
                                        '&:hover': { color: C.text },
                                    }}
                                >
                                    {l.label}
                                </Box>
                            ))}
                            <Box
                                component={RouterLink}
                                to="/leaderboard"
                                sx={{
                                    ...focusRing,
                                    fontSize: 13.5, fontWeight: 600, color: C.dim,
                                    textDecoration: 'none',
                                    '&:hover': { color: C.text },
                                }}
                            >
                                Leaderboard
                            </Box>
                        </Stack>

                        <Box sx={{ width: '1px', height: 20, bgcolor: C.lineHi, display: { xs: 'none', md: 'block' }, mx: 0.5 }} />
                        <Box
                            component={RouterLink}
                            to="/login"
                            sx={{ ...focusRing, fontWeight: 700, fontSize: 14, color: C.text, textDecoration: 'none', px: 1, display: { xs: 'none', sm: 'inline-flex' } }}
                        >
                            Log in
                        </Box>
                        <Box component={RouterLink} to={SIGN_UP} sx={{ ...primaryBtn, px: 2.2, py: 1.15 }}>
                            Start playing <ArrowForwardIcon sx={{ fontSize: 16 }} />
                        </Box>
                    </Stack>
                </Container>
            </Box>

            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <Box
                component="section"
                sx={{
                    position: 'relative',
                    py: { xs: 6, md: 9 },
                    '&::before': {
                        content: '""', position: 'absolute', inset: 0, pointerEvents: 'none',
                        background: `radial-gradient(760px 380px at 78% 8%, rgba(255,61,130,0.16), transparent 70%),
                                     radial-gradient(620px 340px at 8% 30%, rgba(154,107,255,0.12), transparent 70%)`,
                    },
                }}
            >
                <Container maxWidth="lg" sx={{ position: 'relative' }}>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) minmax(0, 1.05fr)' },
                            gap: { xs: 5, md: 8 },
                            alignItems: 'center',
                        }}
                    >
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: C.gold }} />
                                <Typography sx={eyebrow}>Learn code. Play hard.</Typography>
                            </Stack>

                            <Typography
                                variant="h1"
                                sx={{ ...display, fontSize: { xs: '2.2rem', sm: '2.6rem', md: '3rem' }, maxWidth: { xs: '100%', md: 312 }, mb: 3 }}
                            >
                                Level up your{' '}
                                <Box component="span" sx={{ color: C.pink }}>coding skills.</Box>
                            </Typography>

                            <Typography sx={{ color: C.dim, fontSize: 15.5, lineHeight: 1.7, maxWidth: 460, mb: 4 }}>
                                A game-based learning platform where every keystroke earns XP, every bug is a
                                boss fight, and your next high score is one challenge away.
                            </Typography>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.6} sx={{ mb: 4 }}>
                                <Box component={RouterLink} to={SIGN_UP} sx={primaryBtnStacked}>
                                    Play for free <PlayArrowIcon sx={{ fontSize: 18, color: C.gold }} />
                                </Box>
                                <Box component="a" href="#modes" sx={ghostBtn}>
                                    Explore game modes <ArrowForwardIcon sx={{ fontSize: 16 }} />
                                </Box>
                            </Stack>

                            {/* Real players, or nothing. An invented head-count on a public
                                academic project is a claim the project cannot support. */}
                            {boardState === 'ok' && (
                                <Stack direction="row" alignItems="center" spacing={1.4}>
                                    <Stack direction="row">
                                        {top.slice(0, 3).map((r, i) => (
                                            <Box
                                                key={`${r.username}-${i}`}
                                                sx={{
                                                    width: 26, height: 26, borderRadius: '50%',
                                                    display: 'grid', placeItems: 'center',
                                                    fontSize: 11, fontWeight: 800, color: '#1A0A14',
                                                    bgcolor: [C.gold, C.pink, C.cyan][i],
                                                    border: `2px solid ${C.ink}`,
                                                    ml: i ? '-8px' : 0,
                                                }}
                                            >
                                                {(r.username || '?').charAt(0).toUpperCase()}
                                            </Box>
                                        ))}
                                    </Stack>
                                    <Typography sx={{ fontSize: 13, color: C.dim }}>
                                        <Box component="span" sx={{ color: C.text, fontWeight: 800 }}>
                                            {board.length}
                                        </Box>{' '}
                                        {board.length === 1 ? 'player is' : 'players are'} on the board right now
                                    </Typography>
                                </Stack>
                            )}
                            {boardState !== 'ok' && (
                                <Typography sx={{ fontSize: 13, color: C.dim, minHeight: 26, display: 'flex', alignItems: 'center' }}>
                                    {boardState === 'loading'
                                        ? 'Checking the leaderboard…'
                                        : 'The board is empty. The first score posted is the one to beat.'}
                                </Typography>
                            )}
                        </Box>

                        <HeroTerminal />
                    </Box>
                </Container>
            </Box>

            {/* ── Game modes ───────────────────────────────────────────────── */}
            <Box component="section" id="modes" sx={{ pt: { xs: 5, md: 7 }, pb: { xs: 7, md: 11 }, scrollMarginTop: 24 }}>
                <Container maxWidth="lg">
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1.3fr) minmax(0, 1fr)' },
                            gap: { xs: 2, md: 6 },
                            alignItems: 'end',
                            mb: { xs: 4, md: 6 },
                        }}
                    >
                        <Box>
                            <Typography sx={{ ...eyebrow, mb: 1.5 }}>Choose your arena</Typography>
                            <Typography variant="h2" sx={{ ...display, fontSize: { xs: '1.7rem', md: '2.15rem' } }}>
                                Practice should feel like{' '}
                                <Box component="span" sx={{ color: C.pink }}>play.</Box>
                            </Typography>
                        </Box>
                        <Typography sx={{ color: C.dim, fontSize: 14.5, lineHeight: 1.7 }}>
                            Six ways to turn repetition into momentum. Pick a mode, chase a score, and make
                            progress visible.
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gap: 2.5,
                            gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
                        }}
                    >
                        {MODES.map((m) => (
                            <Box
                                key={m.title}
                                component={RouterLink}
                                to={SIGN_UP}
                                sx={{
                                    ...focusRing,
                                    display: 'block',
                                    textDecoration: 'none',
                                    position: 'relative',
                                    p: 2.8,
                                    borderRadius: '8px',
                                    bgcolor: C.panel,
                                    border: `1px solid ${C.line}`,
                                    overflow: 'hidden',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, height: '2px',
                                        bgcolor: m.accent,
                                    },
                                    transition: 'transform 180ms ease, background-color 180ms ease, border-color 180ms ease',
                                    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                                    '&:hover': {
                                        transform: 'translateY(-3px)',
                                        bgcolor: C.panelHi,
                                        borderColor: C.lineHi,
                                    },
                                    '&:hover .st-arrow': { transform: 'translateX(3px)', color: m.accent },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 34, height: 34, borderRadius: '6px',
                                        display: 'grid', placeItems: 'center',
                                        bgcolor: 'rgba(255,255,255,0.05)',
                                        color: m.accent, mb: 2.5,
                                    }}
                                >
                                    {m.icon}
                                </Box>

                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                    <Typography sx={{ ...eyebrow, color: C.dim, fontSize: 10 }}>{m.kicker}</Typography>
                                    <ArrowForwardIcon
                                        className="st-arrow"
                                        sx={{ fontSize: 15, color: C.dim, transition: 'transform 180ms, color 180ms' }}
                                    />
                                </Stack>

                                <Typography sx={{ fontFamily: MONO, fontWeight: 700, fontSize: 16, color: C.text, mb: 1 }}>
                                    {m.title}
                                </Typography>
                                <Typography sx={{ color: C.dim, fontSize: 13, lineHeight: 1.6 }}>
                                    {m.desc}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    <Typography sx={{ color: C.dim, fontSize: 12.5, mt: 3, textAlign: 'center' }}>
                        Game modes need an account — picking one takes you to sign-up first.
                    </Typography>
                </Container>
            </Box>

            {/* ── The loop ─────────────────────────────────────────────────── */}
            <Box
                component="section"
                id="loop"
                sx={{ bgcolor: C.band, py: { xs: 7, md: 12 }, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, scrollMarginTop: 24 }}
            >
                <Container maxWidth="lg">
                    <Stack alignItems="center" sx={{ mb: { xs: 5, md: 8 }, textAlign: 'center' }}>
                        <Typography sx={{ ...eyebrow, mb: 1.5 }}>The loop</Typography>
                        <Typography variant="h2" sx={{ ...display, fontSize: { xs: '1.7rem', md: '2.15rem' }, mb: 2 }}>
                            Three steps to <Box component="span" sx={{ color: C.pink }}>level up.</Box>
                        </Typography>
                        <Typography sx={{ color: C.dim, fontSize: 14.5, maxWidth: 420, lineHeight: 1.7 }}>
                            Short sessions, real feedback, and a leaderboard that makes coming back easy.
                        </Typography>
                    </Stack>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(3, minmax(0, 1fr))' },
                            gap: { xs: 4, md: 3 },
                        }}
                    >
                        {STEPS.map((s, i) => (
                            <Stack key={s.n} alignItems="center" sx={{ textAlign: 'center', position: 'relative' }}>
                                {/* Connector between steps. These are a real sequence — you
                                    cannot climb the board before you have an account — so the
                                    arrow carries order rather than decorating the row. */}
                                {i < STEPS.length - 1 && (
                                    <Box
                                        aria-hidden="true"
                                        sx={{
                                            display: { xs: 'none', md: 'block' },
                                            position: 'absolute',
                                            top: 60,
                                            right: -14,
                                            transform: 'translateY(-50%)',
                                            color: C.lineHi,
                                            fontSize: 20,
                                            lineHeight: 1,
                                        }}
                                    >
                                        →
                                    </Box>
                                )}
                                <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.gold, letterSpacing: '0.16em', mb: 2 }}>
                                    {s.n}
                                </Typography>
                                <Box
                                    sx={{
                                        width: 64, height: 64, borderRadius: '50%',
                                        display: 'grid', placeItems: 'center',
                                        border: `1.5px solid ${C.pink}`,
                                        color: C.pink,
                                        bgcolor: 'rgba(255,61,130,0.07)',
                                        mb: 2.5,
                                    }}
                                >
                                    {s.icon}
                                </Box>
                                <Typography sx={{ fontFamily: MONO, fontWeight: 700, fontSize: 15.5, mb: 1.2, color: C.text }}>
                                    {s.title}
                                </Typography>
                                <Typography sx={{ color: C.dim, fontSize: 13, lineHeight: 1.65, maxWidth: 250 }}>
                                    {s.desc}
                                </Typography>
                            </Stack>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* ── Leaderboard ──────────────────────────────────────────────── */}
            <Box component="section" sx={{ py: { xs: 7, md: 12 } }}>
                <Container maxWidth="lg">
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) minmax(0, 1.15fr)' },
                            gap: { xs: 4, md: 8 },
                            alignItems: 'center',
                        }}
                    >
                        <Box>
                            <Typography sx={{ ...eyebrow, mb: 1.5 }}>Live from the arena</Typography>
                            <Typography variant="h2" sx={{ ...display, fontSize: { xs: '1.7rem', md: '2.15rem' }, mb: 2.5 }}>
                                Every session <Box component="span" sx={{ color: C.pink }}>counts.</Box>
                            </Typography>
                            <Typography sx={{ color: C.dim, fontSize: 14.5, lineHeight: 1.7, mb: 3, maxWidth: 380 }}>
                                See how you stack up against everyone else on the platform. Your first score is
                                waiting.
                            </Typography>
                            <Box
                                component={RouterLink}
                                to="/leaderboard"
                                sx={{
                                    ...focusRing,
                                    display: 'inline-flex', alignItems: 'center', gap: 0.8,
                                    color: C.pink, fontWeight: 800, fontSize: 14, textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' },
                                }}
                            >
                                See the full leaderboard <ArrowForwardIcon sx={{ fontSize: 15 }} />
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                borderRadius: '8px',
                                border: `1px solid ${C.gold}`,
                                bgcolor: C.panel,
                                overflow: 'hidden',
                                boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
                            }}
                        >
                            <Stack
                                direction="row"
                                alignItems="center"
                                sx={{ px: 2.5, py: 1.8, borderBottom: `1px solid ${C.line}`, gap: 1.2 }}
                            >
                                <EmojiEventsIcon sx={{ fontSize: 17, color: C.gold }} />
                                <Typography sx={{ fontWeight: 800, fontSize: 14, flexGrow: 1, color: C.text }}>
                                    Top scores
                                </Typography>
                                <Typography sx={{ fontSize: 11.5, color: C.dim }}>
                                    {boardState === 'ok' ? 'Updated just now' : ''}
                                </Typography>
                            </Stack>

                            <Box sx={{ p: 1.2 }}>
                                {boardState === 'loading' && (
                                    <Typography sx={{ color: C.dim, fontSize: 13.5, textAlign: 'center', py: 5 }}>
                                        Loading the board…
                                    </Typography>
                                )}

                                {boardState === 'error' && (
                                    <Stack spacing={0.8} sx={{ textAlign: 'center', py: 5, px: 2 }}>
                                        <Typography sx={{ color: C.text, fontWeight: 700, fontSize: 14 }}>
                                            The board didn't load.
                                        </Typography>
                                        <Typography sx={{ color: C.dim, fontSize: 13 }}>
                                            The server may still be waking up. Refresh in a moment.
                                        </Typography>
                                    </Stack>
                                )}

                                {boardState === 'empty' && (
                                    <Stack spacing={0.8} sx={{ textAlign: 'center', py: 5, px: 2 }}>
                                        <Typography sx={{ color: C.text, fontWeight: 700, fontSize: 14 }}>
                                            No scores yet.
                                        </Typography>
                                        <Typography sx={{ color: C.dim, fontSize: 13 }}>
                                            Play one round and you'll be sitting at number one.
                                        </Typography>
                                    </Stack>
                                )}

                                {boardState === 'ok' && top.map((r, i) => (
                                    <Stack
                                        key={`${r.username || 'p'}-${i}`}
                                        direction="row"
                                        alignItems="center"
                                        spacing={1.6}
                                        sx={{ px: 1.6, py: 1.35, borderRadius: '6px', '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}
                                    >
                                        <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.dim, width: 20 }}>
                                            {String(i + 1).padStart(2, '0')}
                                        </Typography>
                                        <Box
                                            sx={{
                                                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                                                display: 'grid', placeItems: 'center',
                                                fontSize: 11, fontWeight: 800, color: '#1A0A14',
                                                bgcolor: i === 0 ? C.gold : C.pink,
                                            }}
                                        >
                                            {(r.username || '?').charAt(0).toUpperCase()}
                                        </Box>
                                        <Typography sx={{ flexGrow: 1, fontSize: 13.5, fontWeight: 600, color: C.text }}>
                                            {r.username || 'Player'}
                                        </Typography>
                                        <Typography sx={{ fontFamily: MONO, fontSize: 12.5, color: i === 0 ? C.gold : C.dim }}>
                                            {r.score ?? r.wpm ?? '—'} <Box component="span" sx={{ fontSize: 10 }}>XP</Box>
                                        </Typography>
                                    </Stack>
                                ))}

                                {boardState === 'ok' && (
                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={1.6}
                                        sx={{
                                            px: 1.6, py: 1.35, borderRadius: '6px',
                                            bgcolor: 'rgba(255,61,130,0.09)',
                                            border: `1px dashed rgba(255,61,130,0.35)`,
                                        }}
                                    >
                                        <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.dim, width: 20 }}>
                                            {String(top.length + 1).padStart(2, '0')}
                                        </Typography>
                                        <Box
                                            sx={{
                                                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                                                display: 'grid', placeItems: 'center',
                                                fontSize: 11, fontWeight: 800,
                                                color: C.pink, border: `1px dashed ${C.pink}`,
                                            }}
                                        >
                                            ?
                                        </Box>
                                        <Typography sx={{ flexGrow: 1, fontSize: 13.5, fontWeight: 700, color: C.pink }}>
                                            you?
                                        </Typography>
                                        <Typography sx={{ fontFamily: MONO, fontSize: 12.5, color: C.dim }}>—</Typography>
                                    </Stack>
                                )}
                            </Box>

                            <Box sx={{ borderTop: `1px solid ${C.line}`, textAlign: 'center' }}>
                                <Box
                                    component={RouterLink}
                                    to={SIGN_UP}
                                    sx={{
                                        ...focusRing, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        gap: 0.8, py: 1.7, color: C.pink, fontWeight: 700, fontSize: 13.5,
                                        textDecoration: 'none', '&:hover': { bgcolor: 'rgba(255,61,130,0.06)' },
                                    }}
                                >
                                    Create an account to compete <ArrowForwardIcon sx={{ fontSize: 15 }} />
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Container>
            </Box>

            {/* ── Closing CTA ──────────────────────────────────────────────── */}
            <Container maxWidth="lg" sx={{ pb: { xs: 7, md: 12 } }}>
                <Box
                    sx={{
                        borderRadius: '10px',
                        border: `1px solid ${C.lineHi}`,
                        bgcolor: C.inkSoft,
                        px: { xs: 3, md: 6 },
                        py: { xs: 4.5, md: 6 },
                        display: 'grid',
                        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) auto' },
                        gap: 4,
                        alignItems: 'center',
                        background: `linear-gradient(120deg, ${C.inkSoft} 0%, rgba(255,61,130,0.07) 100%)`,
                    }}
                >
                    <Box>
                        <Typography sx={{ ...eyebrow, mb: 1.5 }}>Ready player one?</Typography>
                        <Typography variant="h2" sx={{ ...display, fontSize: { xs: '1.6rem', md: '2rem' }, mb: 1.8 }}>
                            Your next high score starts{' '}
                            <Box component="span" sx={{ color: C.pink }}>now.</Box>
                        </Typography>
                        <Typography sx={{ color: C.dim, fontSize: 14 }}>
                            Free to join. No credit card. Just keyboards and good vibes.
                        </Typography>
                    </Box>
                    <Box
                        component={RouterLink}
                        to={SIGN_UP}
                        sx={{ ...primaryBtnStacked, px: 3, py: 1.5, fontSize: 14.5, justifySelf: { xs: 'start', md: 'end' } }}
                    >
                        Create your account <ArrowForwardIcon sx={{ fontSize: 16 }} />
                    </Box>
                </Box>
            </Container>

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <Box component="footer" sx={{ borderTop: `1px solid ${C.line}`, py: 3.5 }}>
                <Container maxWidth="lg">
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={2}
                    >
                        <Typography sx={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.text }}>
                            SyntaxType
                        </Typography>
                        <Typography sx={{ fontSize: 12.5, color: C.dim }}>
                            © {new Date().getFullYear()} SyntaxType · Built for learners
                        </Typography>
                        <Stack direction="row" spacing={2.5}>
                            <Box component="a" href="#modes" sx={{ ...focusRing, fontSize: 12.5, color: C.dim, textDecoration: 'none', '&:hover': { color: C.text } }}>
                                Games
                            </Box>
                            <Box component={RouterLink} to="/leaderboard" sx={{ ...focusRing, fontSize: 12.5, color: C.dim, textDecoration: 'none', '&:hover': { color: C.text } }}>
                                Leaderboard
                            </Box>
                            <Box component={RouterLink} to="/login" sx={{ ...focusRing, fontSize: 12.5, color: C.dim, textDecoration: 'none', '&:hover': { color: C.text } }}>
                                Sign in
                            </Box>
                        </Stack>
                    </Stack>
                </Container>
            </Box>
        </Box>
    );
};

export default LandingPage;
