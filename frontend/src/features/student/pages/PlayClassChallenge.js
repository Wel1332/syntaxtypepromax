// One class challenge: an intro with the teacher's instructions, the round, then
// the result, saved to the class. Nothing here touches the study's scores.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Alert, Box, Button, Card, CardContent, Chip, LinearProgress, Stack, Typography, useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { PageBackdrop } from '../../profile/components/profileShared';
import { GAMES } from '../../teacher/data/classChallenges';
import SniperRound from '../components/SniperRound';
import TranslationRound from '../components/TranslationRound';
import FallingRound from '../components/FallingRound';
import { roundSummary } from '../data/challengeRounds';
import {
    attemptBody, attemptsInfo, getMyChallenge, isFinalRefusal, playState, plural, questionLabel, submitAttempt,
} from '../data/classChallenges';

const HOW_TO_PLAY = {
    SNIPER: 'Each question is C code with blanks. Press the key for each missing character; there is no need to press Enter. Wrong keys cost half a second.',
    TRANSLATION: 'Each question describes some C code in plain English. Type the code and press Enter. Spacing doesn\'t matter, but names, types and semicolons do. Copy and paste are turned off.',
    FALLING: 'Buggy lines of C fall from the top, up to two at a time. Type the fixed line before it lands; it clears as soon as it\'s right, with no Enter needed. Spacing doesn\'t matter. A line that lands counts as missed. Copy and paste are turned off.',
};

const ROUND_SIZE = {
    SNIPER: (n) => `${plural(n, 'question')}, each with its own timer`,
    TRANSLATION: (n) => `${plural(n, 'question')}, each with its own timer`,
    FALLING: (n) => `${plural(n, 'buggy line')} to fix`,
};

const ROUNDS = { SNIPER: SniperRound, TRANSLATION: TranslationRound, FALLING: FallingRound };

function Stat({ label, value }) {
    return (
        <Box sx={{ textAlign: 'center', minWidth: 96 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>{label}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{value}</Typography>
        </Box>
    );
}

function attemptLine(challenge) {
    const { used, max, remaining } = attemptsInfo(challenge);
    if (max == null) return 'Unlimited attempts';
    if (remaining === 0) return `All ${plural(max, 'attempt')} used`;
    return `Attempt ${used + 1} of ${max}`;
}

function SaveStatus({ save, challenge, onRetry }) {
    if (save.state === 'saving') {
        return (
            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>Saving your attempt…</Typography>
                <LinearProgress />
            </Box>
        );
    }
    if (save.state === 'saved') {
        const { max, remaining } = attemptsInfo(challenge);
        const left = max == null ? '' : remaining === 0 ? ' That was your last attempt.' : ` ${plural(remaining, 'attempt')} left.`;
        return <Alert severity="success" sx={{ mb: 3 }}>Saved to your class.{left}</Alert>;
    }
    if (save.state === 'refused') {
        return <Alert severity="warning" sx={{ mb: 3 }}>{save.message}</Alert>;
    }
    if (save.state === 'failed') {
        return (
            <Alert
                severity="error"
                sx={{ mb: 3 }}
                action={<Button color="inherit" size="small" onClick={onRetry}>Try again</Button>}
            >
                Your attempt wasn't saved yet. {save.message}
            </Alert>
        );
    }
    return null;
}

export default function PlayClassChallenge() {
    const { challengeId } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [challenge, setChallenge] = useState(null);
    const [phase, setPhase] = useState('loading');
    const [loadError, setLoadError] = useState('');
    const [round, setRound] = useState(0);
    const [result, setResult] = useState(null);
    const [save, setSave] = useState({ state: 'idle' });
    const startedAt = useRef(0);

    useEffect(() => {
        let cancelled = false;
        getMyChallenge(challengeId).then((res) => {
            if (cancelled) return;
            if (!res.ok) {
                setLoadError(res.message);
                setPhase('error');
                return;
            }
            setChallenge(res.data);
            setPhase('intro');
        });
        return () => { cancelled = true; };
    }, [challengeId]);

    const saveAttempt = useCallback(async (body) => {
        setSave({ state: 'saving' });
        const res = await submitAttempt(challengeId, body);
        if (res.ok) {
            setChallenge((c) => ({ ...c, attemptsUsed: res.data.attemptsUsed }));
            setSave({ state: 'saved' });
        } else {
            setSave({ state: isFinalRefusal(res) ? 'refused' : 'failed', message: res.message });
        }
    }, [challengeId]);

    const start = () => {
        startedAt.current = Date.now();
        setResult(null);
        setSave({ state: 'idle' });
        setRound((r) => r + 1);
        setPhase('playing');
    };

    const finish = useCallback((state) => {
        const summary = roundSummary(state);
        const body = attemptBody(summary, (Date.now() - startedAt.current) / 1000);
        setResult({ summary, results: state.results, body });
        setPhase('finished');
        saveAttempt(body);
    }, [saveAttempt]);

    const game = challenge && GAMES[challenge.game];
    const Round = challenge && ROUNDS[challenge.game];
    const play = challenge ? playState(challenge) : { canPlay: false };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4, px: { xs: 2, md: 4 }, position: 'relative', overflow: 'hidden' }}>
            <PageBackdrop isDark={isDark} />
            <Box sx={{ maxWidth: 900, mx: 'auto', position: 'relative', zIndex: 1 }}>
                <Button
                    startIcon={<ArrowBackIcon />} size="small" sx={{ mb: 1, color: 'text.secondary' }}
                    onClick={() => navigate('/class-challenges')}
                >
                    Back to class challenges
                </Button>

                {phase === 'loading' && <LinearProgress />}
                {phase === 'error' && <Alert severity="error">{loadError}</Alert>}

                {challenge && phase !== 'error' && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
                            {challenge.classroomName}
                        </Typography>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                            <Typography variant="h4" component="h1" sx={{ color: 'text.primary' }}>{challenge.title}</Typography>
                            <Chip label={game?.label || challenge.game} sx={{ fontWeight: 700, bgcolor: game?.color, color: '#fff' }} />
                        </Stack>
                    </Box>
                )}

                {phase === 'intro' && challenge && (
                    <Card>
                        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                            {challenge.instructions && (
                                <Box sx={{ mb: 3, pl: 2, borderLeft: `3px solid ${game?.color || '#999'}` }}>
                                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>From your teacher</Typography>
                                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{challenge.instructions}</Typography>
                                </Box>
                            )}
                            {HOW_TO_PLAY[challenge.game] && (
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                    {HOW_TO_PLAY[challenge.game]}
                                </Typography>
                            )}
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                                {(ROUND_SIZE[challenge.game] || ((n) => plural(n, 'question')))(challenge.itemCount)} · {attemptLine(challenge)}
                            </Typography>
                            {!play.canPlay && <Alert severity="info" sx={{ mb: 2 }}>{play.reason}</Alert>}
                            <Button
                                variant="contained" size="large" startIcon={<PlayArrowIcon />}
                                disabled={!play.canPlay || !Round} onClick={start} sx={{ textTransform: 'none' }}
                            >
                                Start
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {phase === 'playing' && Round && (
                    <Round key={round} items={challenge.items} onFinish={finish} />
                )}

                {phase === 'finished' && result && (
                    <Card>
                        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', mb: 2 }}>Round complete</Typography>
                            <Stack direction="row" justifyContent="center" sx={{ mb: 3, flexWrap: 'wrap', gap: 3 }}>
                                <Stat label="Score" value={result.summary.score} />
                                <Stat label="Correct" value={`${result.summary.correct} / ${result.summary.total}`} />
                                <Stat label="Accuracy" value={`${result.summary.accuracy}%`} />
                            </Stack>

                            <SaveStatus save={save} challenge={challenge} onRetry={() => saveAttempt(result.body)} />

                            <Stack component="ol" spacing={0.75} sx={{ pl: 0, m: 0, mb: 3, listStyle: 'none' }}>
                                {challenge.items.map((item, i) => {
                                    const correct = result.results[i]?.correct;
                                    return (
                                        <Stack component="li" key={i} direction="row" spacing={1} alignItems="flex-start">
                                            {correct
                                                ? <CheckCircleIcon fontSize="small" sx={{ color: '#3ecf6a', mt: '2px' }} titleAccess="Correct" />
                                                : <CancelIcon fontSize="small" sx={{ color: '#ef4444', mt: '2px' }} titleAccess="Missed" />}
                                            <Typography variant="body2" sx={{ color: 'text.primary', minWidth: 0, overflowWrap: 'anywhere' }}>
                                                {i + 1}. {questionLabel(challenge.game, item)}
                                            </Typography>
                                        </Stack>
                                    );
                                })}
                            </Stack>

                            <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                                <Button
                                    variant="contained" startIcon={<ReplayIcon />} onClick={start} sx={{ textTransform: 'none' }}
                                    disabled={save.state !== 'saved' || !playState(challenge).canPlay}
                                >
                                    Play again
                                </Button>
                                <Button variant="outlined" onClick={() => navigate('/class-challenges')} sx={{ textTransform: 'none' }}>
                                    Back to class challenges
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                )}
            </Box>
        </Box>
    );
}
