// Plays a teacher's Bug Smasher lines once each: buggy C falls, and the student
// types the fix before it lands. Paste is blocked as in the game, and the fix is
// never shown while typing, so it has to be worked out.

import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Box, Card, CardContent, Chip, Stack, Typography, useTheme } from '@mui/material';
import {
    fallProgress, fallingProgress, fallingReducer, startFalling, streakMultiplier,
} from '../data/challengeRounds';
import { useFinishOnce, useRoundClock } from './roundHooks';

const BUG = '#FF6B6B';
const ACCENT = '#C8456D';

// Each lane is centred on its own half and never wider than it.
const LANE_CENTRE = ['26%', '74%'];

function FallingLine({ text, progress, lane, active }) {
    return (
        <Box
            data-line=""
            sx={{
                position: 'absolute', left: LANE_CENTRE[lane], top: `${3 + progress * 80}%`, transform: 'translateX(-50%)',
                maxWidth: '46%', width: 'max-content', boxSizing: 'border-box', px: 1, py: 0.5, borderRadius: 1,
                fontFamily: "'JetBrains Mono', monospace", fontSize: { xs: '0.85rem', md: '1rem' }, fontWeight: 700,
                color: BUG, textAlign: 'center', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
                textShadow: '0 0 12px rgba(255,107,107,0.55)',
                bgcolor: active ? 'rgba(200,69,109,0.28)' : 'rgba(255,107,107,0.12)',
                border: active ? `2px solid ${ACCENT}` : '1.5px dashed rgba(255,107,107,0.6)',
                transition: 'top 100ms linear', userSelect: 'none', pointerEvents: 'none',
            }}
        >
            {text}
        </Box>
    );
}

export default function FallingRound({ items, onFinish }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [state, dispatch] = useReducer(fallingReducer, items, startFalling);
    const [pasteBlocked, setPasteBlocked] = useState(false);
    const inputRef = useRef(null);
    const pasteHint = useRef(null);

    useRoundClock(dispatch, !state.done);
    useFinishOnce(state, onFinish);

    useEffect(() => {
        inputRef.current?.focus();
        return () => clearTimeout(pasteHint.current);
    }, []);

    const blockClipboard = (e) => {
        e.preventDefault();
        setPasteBlocked(true);
        clearTimeout(pasteHint.current);
        pasteHint.current = setTimeout(() => setPasteBlocked(false), 2500);
    };

    if (state.done) return null;

    const { fixed, missed, left } = fallingProgress(state);
    const multiplier = streakMultiplier(state.streak);
    const event = state.lastEvent;
    const offTrack = state.input.trim() !== '' && state.target == null;

    return (
        <Card>
            <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1} sx={{ mb: 2 }}>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                        Fixed {fixed} · Missed {missed} · {left} to go
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                        {event && (
                            <Typography
                                key={event.seq}
                                role="status"
                                variant="body2"
                                sx={{ color: event.correct ? '#3ecf6a' : '#ef4444', fontWeight: 700 }}
                            >
                                Line {event.index + 1}: {event.correct ? `Fixed! +${event.points}` : 'Landed.'}
                            </Typography>
                        )}
                        <Chip size="small" label={`Score ${state.score}`} color="primary" />
                        <Chip
                            size="small"
                            label={multiplier > 1 ? `Streak ${state.streak} · ×${multiplier}` : `Streak ${state.streak}`}
                            color={multiplier > 1 ? 'warning' : 'default'}
                            variant={multiplier > 1 ? 'filled' : 'outlined'}
                        />
                    </Stack>
                </Stack>

                <Box
                    role="img"
                    aria-label={`Falling lines: ${state.falling.map((f) => items[f.index].buggy).join(', ')}`}
                    onMouseDown={(e) => { e.preventDefault(); inputRef.current?.focus(); }}
                    sx={{
                        position: 'relative', height: { xs: 280, md: 380 }, overflow: 'hidden',
                        borderRadius: 1, border: '1px solid', borderColor: 'divider',
                        bgcolor: isDark ? '#0F0F1E' : '#1a1a2e',
                    }}
                >
                    {state.falling.map((line) => (
                        <FallingLine
                            key={line.index}
                            text={items[line.index].buggy}
                            progress={fallProgress(state, line)}
                            lane={line.lane}
                            active={state.target === line.index}
                        />
                    ))}
                    <Box sx={{
                        position: 'absolute', left: 0, right: 0, bottom: 0, height: 10,
                        borderTop: '2px solid rgba(255,107,107,0.55)', bgcolor: 'rgba(255,107,107,0.1)',
                    }}
                    />
                </Box>

                <Box
                    component="input"
                    ref={inputRef}
                    aria-label="Type the fixed line"
                    value={state.input}
                    onChange={(e) => dispatch({ type: 'input', value: e.target.value })}
                    onPaste={blockClipboard}
                    onDrop={blockClipboard}
                    onCopy={blockClipboard}
                    onCut={blockClipboard}
                    spellCheck={false}
                    autoComplete="off"
                    autoCapitalize="off"
                    maxLength={300}
                    placeholder="Type the fixed line…"
                    sx={{
                        width: '100%', mt: 2, p: 1.5, boxSizing: 'border-box',
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 16,
                        border: '2px solid', borderRadius: 1.5, outline: 'none',
                        borderColor: offTrack ? 'error.main' : isDark ? '#2a2a3e' : '#d0d0e0',
                        bgcolor: isDark ? '#0F0F1E' : '#fff', color: isDark ? '#fff' : '#1a1a2e',
                        '&:focus': { borderColor: offTrack ? 'error.main' : 'primary.main' },
                    }}
                />
                <Typography variant="caption" sx={{ mt: 1, display: 'block', color: pasteBlocked ? 'error.main' : 'text.secondary' }}>
                    {pasteBlocked
                        ? 'Copy and paste are turned off. Type the fix.'
                        : 'A line clears as soon as your fix is right. No Enter needed, and spacing doesn\'t matter.'}
                </Typography>
            </CardContent>
        </Card>
    );
}
