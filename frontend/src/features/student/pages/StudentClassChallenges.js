// Every challenge a student's teachers have made visible, grouped by class.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert, Box, Button, Card, CardContent, Chip, LinearProgress, Stack, Typography, useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SchoolIcon from '@mui/icons-material/School';
import { PageBackdrop } from '../../profile/components/profileShared';
import { GAMES } from '../../teacher/data/classChallenges';
import {
    attemptsInfo, attemptsLabel, groupByClass, listEnrolledClasses, listMyChallenges, playState, plural,
} from '../data/classChallenges';

function ChallengeCard({ challenge, onPlay }) {
    const game = GAMES[challenge.game];
    const play = playState(challenge);
    const { used } = attemptsInfo(challenge);
    return (
        <Card sx={{ borderLeft: `4px solid ${game?.color || '#999'}` }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Chip label={game?.label || challenge.game} size="small" sx={{ fontWeight: 700, mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>{challenge.title}</Typography>
                        {challenge.instructions && (
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.secondary', overflow: 'hidden', display: '-webkit-box',
                                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                }}
                            >
                                {challenge.instructions}
                            </Typography>
                        )}
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            {plural(challenge.itemCount, 'question')} · {attemptsLabel(challenge)}
                        </Typography>
                    </Box>
                    <Box sx={{ flexShrink: 0, textAlign: { sm: 'right' } }}>
                        <Button
                            variant="contained" startIcon={<PlayArrowIcon />} disabled={!play.canPlay}
                            onClick={onPlay} sx={{ textTransform: 'none' }}
                            aria-label={`Play "${challenge.title}"`}
                        >
                            {used > 0 ? 'Play again' : 'Play'}
                        </Button>
                        {!play.canPlay && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                                {play.reason}
                            </Typography>
                        )}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

function EmptyState({ enrolled, onJoin }) {
    return (
        <Card>
            <CardContent sx={{ textAlign: 'center', py: 5 }}>
                <Typography sx={{ color: 'text.secondary', mb: enrolled ? 0 : 2 }}>
                    {enrolled
                        ? "Your teachers haven't posted any challenges yet. Check back later."
                        : 'Join a class with the code from your teacher to see its challenges here.'}
                </Typography>
                {!enrolled && (
                    <Button variant="contained" startIcon={<SchoolIcon />} onClick={onJoin} sx={{ textTransform: 'none' }}>
                        Join a class
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

export default function StudentClassChallenges() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [loadState, setLoadState] = useState('loading');
    const [loadError, setLoadError] = useState('');
    const [challenges, setChallenges] = useState([]);
    const [enrolled, setEnrolled] = useState(true);

    useEffect(() => {
        let cancelled = false;
        Promise.all([listMyChallenges(), listEnrolledClasses()]).then(([list, classes]) => {
            if (cancelled) return;
            if (!list.ok) {
                setLoadError(list.message);
                setLoadState('error');
                return;
            }
            setChallenges(list.data || []);
            setEnrolled(!classes.ok || (classes.data || []).length > 0);
            setLoadState('ok');
        });
        return () => { cancelled = true; };
    }, []);

    const groups = groupByClass(challenges);

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4, px: { xs: 2, md: 4 }, position: 'relative', overflow: 'hidden' }}>
            <PageBackdrop isDark={isDark} />
            <Box sx={{ maxWidth: 900, mx: 'auto', position: 'relative', zIndex: 1 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} size="small" sx={{ mb: 1, color: 'text.secondary' }}>
                    Back to Dashboard
                </Button>
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2, display: 'block' }}>
                    Student
                </Typography>
                <Typography variant="h4" component="h1" sx={{ color: 'text.primary' }}>Class challenges</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, mb: 3 }}>
                    Challenges your teachers made for your classes. Your results go to your teacher, not the leaderboard.
                </Typography>

                {loadState === 'loading' && <LinearProgress />}
                {loadState === 'error' && <Alert severity="error">{loadError}</Alert>}
                {loadState === 'ok' && groups.length === 0 && (
                    <EmptyState enrolled={enrolled} onJoin={() => navigate('/classes/join')} />
                )}
                {loadState === 'ok' && groups.map((group) => (
                    <Box key={group.classroomId} component="section" sx={{ mb: 4 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                            <SchoolIcon sx={{ color: 'primary.main' }} />
                            <Typography variant="h6" component="h2" sx={{ color: 'text.primary', fontWeight: 700 }}>
                                {group.classroomName}
                            </Typography>
                        </Stack>
                        <Stack spacing={2}>
                            {group.challenges.map((c) => (
                                <ChallengeCard
                                    key={c.challengeId}
                                    challenge={c}
                                    onPlay={() => navigate(`/class-challenges/${c.challengeId}/play`)}
                                />
                            ))}
                        </Stack>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
