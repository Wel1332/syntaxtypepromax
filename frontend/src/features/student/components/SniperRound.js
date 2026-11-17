// Plays a teacher's Syntax Sniper drills once each: press the key for each blank.

import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import { Box, Card, CardContent, Chip, LinearProgress, Stack, Typography, useTheme } from '@mui/material';
import {
    TICK_SECONDS, sniperSeconds, sniperSegments, startSniper, sniperReducer,
} from '../data/challengeRounds';

export default function SniperRound({ items, onFinish }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [state, dispatch] = useReducer(sniperReducer, items, startSniper);
    const reported = useRef(false);

    useEffect(() => {
        const onKey = (e) => {
            if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
            e.preventDefault();
            dispatch({ type: 'key', key: e.key });
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        if (state.done) return undefined;
        const timer = setInterval(() => dispatch({ type: 'tick', seconds: TICK_SECONDS }), TICK_SECONDS * 1000);
        return () => clearInterval(timer);
    }, [state.done]);

    useEffect(() => {
        if (state.done && !reported.current) {
            reported.current = true;
            onFinish(state);
        }
    }, [state, onFinish]);

    const item = items[state.index];
    const segments = useMemo(() => (item ? sniperSegments(item.code, item.answers) : []), [item]);
    if (state.done || !item) return null;

    const total = sniperSeconds(item);
    return (
        <Card
            key={state.shake}
            sx={{
                animation: state.shake ? 'class-snipe-shake 180ms' : 'none',
                '@keyframes class-snipe-shake': {
                    '0%,100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-6px)' },
                    '75%': { transform: 'translateX(6px)' },
                },
            }}
        >
            <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1} sx={{ mb: 2 }}>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                        Question {state.index + 1} / {items.length} — {item.title}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Chip size="small" label={`Score ${state.score}`} color="primary" />
                        <Chip size="small" label={`Misses ${state.misses}`} color={state.misses > 0 ? 'error' : 'default'} variant="outlined" />
                        <Chip size="small" label={`Time ${state.timeLeft.toFixed(1)}s`} color="warning" />
                    </Stack>
                </Stack>
                <LinearProgress
                    variant="determinate"
                    value={(state.timeLeft / total) * 100}
                    color={state.timeLeft < 5 ? 'error' : 'primary'}
                    sx={{ mb: 2, height: 6, borderRadius: 3 }}
                />
                <Box
                    component="pre"
                    aria-label="Code with blanks"
                    sx={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 16, lineHeight: 1.7, m: 0, p: 2,
                        bgcolor: isDark ? '#0F0F1E' : '#fff8f0',
                        border: '1px solid', borderColor: 'divider', borderRadius: 1,
                        whiteSpace: 'pre-wrap', overflow: 'auto',
                    }}
                >
                    {segments.map((seg, i) => {
                        if (seg.kind === 'text') return <span key={i}>{seg.value}</span>;
                        const isActive = seg.index === state.active;
                        const isFilled = state.filled[seg.index] != null;
                        return (
                            <Box
                                key={i}
                                component="span"
                                data-blank={seg.index}
                                sx={{
                                    display: 'inline-block', minWidth: '1ch', px: '2px', fontWeight: 700,
                                    borderBottom: isActive ? '3px solid #C8456D' : '2px solid rgba(127,127,127,0.4)',
                                    bgcolor: isFilled ? 'rgba(62,207,106,0.18)' : isActive ? 'rgba(200,69,109,0.18)' : 'transparent',
                                    color: isFilled ? '#3ecf6a' : isActive ? '#C8456D' : 'inherit',
                                }}
                            >
                                {state.filled[seg.index] ?? '_'}
                            </Box>
                        );
                    })}
                </Box>
                <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary' }}>
                    Press the key for the highlighted blank. Wrong keys cost half a second.
                </Typography>
            </CardContent>
        </Card>
    );
}
