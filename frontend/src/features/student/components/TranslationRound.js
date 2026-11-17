// Plays a teacher's Translation Terminal prompts once each: read the English,
// type the C. Copy and paste are blocked as in the game, so the answer is typed.

import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Box, Button, Card, CardContent, Chip, LinearProgress, Stack, Typography, useTheme } from '@mui/material';
import {
    TICK_SECONDS, translationSeconds, startTranslation, translationReducer,
} from '../data/challengeRounds';

const FEEDBACK = {
    correct: { text: 'Correct!', color: '#3ecf6a' },
    wrong: { text: 'Not quite.', color: '#ef4444' },
    timeout: { text: "Time's up.", color: '#ef4444' },
};

export default function TranslationRound({ items, onFinish }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [state, dispatch] = useReducer(translationReducer, items, startTranslation);
    const [answer, setAnswer] = useState('');
    const [pasteBlocked, setPasteBlocked] = useState(false);
    const inputRef = useRef(null);
    const pasteHint = useRef(null);
    const reported = useRef(false);

    useEffect(() => () => clearTimeout(pasteHint.current), []);

    useEffect(() => {
        setAnswer('');
        inputRef.current?.focus();
    }, [state.index]);

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

    const blockClipboard = (e) => {
        e.preventDefault();
        setPasteBlocked(true);
        clearTimeout(pasteHint.current);
        pasteHint.current = setTimeout(() => setPasteBlocked(false), 2500);
    };

    const submit = () => dispatch({ type: 'submit', answer });
    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    const item = items[state.index];
    if (state.done || !item) return null;

    const total = translationSeconds(item);
    const feedback = state.feedback
        && (state.feedback.correct ? FEEDBACK.correct : state.feedback.timedOut ? FEEDBACK.timeout : FEEDBACK.wrong);

    return (
        <Card>
            <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1} sx={{ mb: 2 }}>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                        Question {state.index + 1} / {items.length}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        {feedback && (
                            <Typography
                                key={state.feedback.seq}
                                role="status"
                                variant="body2"
                                sx={{ color: feedback.color, fontWeight: 700 }}
                            >
                                Question {state.feedback.seq}: {feedback.text}
                            </Typography>
                        )}
                        <Chip size="small" label={`Score ${state.score}`} color="primary" />
                        <Chip size="small" label={`Time ${state.timeLeft.toFixed(1)}s`} color="warning" />
                    </Stack>
                </Stack>
                <LinearProgress
                    variant="determinate"
                    value={(state.timeLeft / total) * 100}
                    color={state.timeLeft < 4 ? 'error' : 'primary'}
                    sx={{ mb: 2, height: 4, borderRadius: 2 }}
                />
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>Write this in C</Typography>
                <Typography variant="h6" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{item.prompt}</Typography>
                <Box
                    component="textarea"
                    ref={inputRef}
                    aria-label="Your C code"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={onKeyDown}
                    onPaste={blockClipboard}
                    onDrop={blockClipboard}
                    onCopy={blockClipboard}
                    onCut={blockClipboard}
                    spellCheck={false}
                    autoComplete="off"
                    placeholder="Type the C code here, then press Enter…"
                    sx={{
                        width: '100%', minHeight: 80, p: 1.5, boxSizing: 'border-box',
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 15, lineHeight: 1.5,
                        border: '2px solid', borderColor: isDark ? '#2a2a3e' : '#d0d0e0', borderRadius: 1.5,
                        bgcolor: isDark ? '#0F0F1E' : '#fff', color: isDark ? '#fff' : '#1a1a2e',
                        outline: 'none', resize: 'vertical',
                        '&:focus': { borderColor: 'primary.main' },
                    }}
                />
                <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ color: pasteBlocked ? 'error.main' : 'text.secondary' }}>
                        {pasteBlocked
                            ? 'Copy and paste are turned off. Type your answer.'
                            : 'Spacing and line breaks don\'t matter. Shift+Enter starts a new line.'}
                    </Typography>
                    <Button variant="contained" onClick={submit} disabled={!answer.trim()} sx={{ flexShrink: 0 }}>
                        Submit
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
}
