import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Card, CardContent, Stack, Typography, Button, Chip, CircularProgress,
    Divider, useTheme, LinearProgress,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import { API_BASE } from '../../../shared/api/client';
import { authFetch } from '../../../shared/api/authFetch';
import { getUserId } from '../../../shared/auth/JwtUtils';
import { getAuthToken } from '../../../shared/auth/AuthUtils';
import { getScores as getLocalScores, getAttempts, MODE, GAME } from '../../../shared/assessment/modes';

const gradientText = {
    background: 'linear-gradient(90deg, #C8456D 0%, #E78AAC 50%, #FFC700 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'inline-block',
};

const StatCard = ({ label, value, accent }) => (
    <Card>
        <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
            <Typography
                variant="h4"
                sx={{
                    color: accent || 'text.primary',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
                }}
            >
                {value}
            </Typography>
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mt: 0.5 }}>
                {label}
            </Typography>
        </CardContent>
    </Card>
);

// Mini summary card for the top overview grid
const GameSummaryCard = ({ label, count, best, accent, isDark }) => (
    <Card sx={{ border: '1.5px solid', borderColor: `${accent}44` }}>
        <CardContent sx={{ p: 2 }}>
            <Typography variant="overline" sx={{ color: accent, fontWeight: 700, display: 'block' }}>{label}</Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: 0.5 }}>
                <Box>
                    <Typography variant="h5" sx={{ color: 'text.primary', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{count}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>sessions</Typography>
                </Box>
                {count > 0 && (
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" sx={{ color: accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{best}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>best score</Typography>
                    </Box>
                )}
            </Stack>
        </CardContent>
    </Card>
);

// Pre-Test vs Post-Test comparison block
const ModeComparison = ({ game, scoreKey, percentKey }) => {
    const preAttempts = getAttempts(game, MODE.PRE_TEST);
    const postAttempts = getAttempts(game, MODE.POST_TEST);
    const preScores = getLocalScores(game, MODE.PRE_TEST);
    const postScores = getLocalScores(game, MODE.POST_TEST);

    const key = percentKey || scoreKey || 'percent';

    const bestOf = (arr) =>
        arr.length ? Math.max(...arr.map(s => Number(s[key]) || 0)) : null;

    const preBest = bestOf(preScores);
    const postBest = bestOf(postScores);

    const diff = (preBest != null && postBest != null) ? postBest - preBest : null;

    if (preAttempts === 0 && postAttempts === 0) {
        return (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 1 }}>
                Complete a Pre-Test to start tracking your improvement.
            </Typography>
        );
    }

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                Pre-Test vs Post-Test Progress
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: 'wrap' }}>
                <Card variant="outlined" sx={{ flex: 1, minWidth: 130 }}>
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                        <Chip label="PRE-TEST" size="small" sx={{ bgcolor: '#9C5BE322', color: '#9C5BE3', fontWeight: 700, mb: 1 }} />
                        <Typography variant="h5" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {preBest != null ? `${preBest}${percentKey ? '%' : ''}` : '—'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {preAttempts} attempt{preAttempts !== 1 ? 's' : ''}
                        </Typography>
                    </CardContent>
                </Card>

                <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
                    {diff == null ? (
                        <RemoveIcon sx={{ color: 'text.secondary' }} />
                    ) : diff > 0 ? (
                        <Stack alignItems="center">
                            <TrendingUpIcon sx={{ color: '#3ECF6A' }} />
                            <Typography variant="caption" sx={{ color: '#3ECF6A', fontWeight: 700 }}>
                                +{diff}{percentKey ? 'pp' : ' pts'}
                            </Typography>
                        </Stack>
                    ) : diff < 0 ? (
                        <Stack alignItems="center">
                            <TrendingDownIcon sx={{ color: '#EF4444' }} />
                            <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 700 }}>
                                {diff}{percentKey ? 'pp' : ' pts'}
                            </Typography>
                        </Stack>
                    ) : (
                        <Stack alignItems="center">
                            <RemoveIcon sx={{ color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>no change</Typography>
                        </Stack>
                    )}
                </Box>

                <Card variant="outlined" sx={{ flex: 1, minWidth: 130 }}>
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                        <Chip label="POST-TEST" size="small" sx={{ bgcolor: '#FFC70022', color: '#FFC700', fontWeight: 700, mb: 1 }} />
                        <Typography variant="h5" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {postBest != null ? `${postBest}${percentKey ? '%' : ''}` : '—'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {postAttempts} attempt{postAttempts !== 1 ? 's' : ''}
                        </Typography>
                    </CardContent>
                </Card>
            </Stack>

            {diff != null && diff > 0 && (
                <Box sx={{ mt: 1.5 }}>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(100, postBest)}
                        sx={{
                            height: 8, borderRadius: 4,
                            bgcolor: 'rgba(62,207,106,0.15)',
                            '& .MuiLinearProgress-bar': {
                                background: 'linear-gradient(90deg, #9C5BE3 0%, #3ECF6A 100%)',
                                borderRadius: 4,
                            },
                        }}
                    />
                    <Typography variant="caption" sx={{ color: '#3ECF6A', display: 'block', mt: 0.5 }}>
                        Improvement: +{diff}{percentKey ? ' percentage points' : ' points'} from Pre-Test to Post-Test
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

const computeStats = (arr) => {
    if (!arr.length) return { count: 0, best: 0, avg: 0, last: 0, bestWpm: 0 };
    const scores = arr.map(s => s.score);
    const wpms = arr.map(s => s.wpm ?? 0);
    return {
        count: arr.length,
        best: Math.max(...scores),
        avg: Math.round(scores.reduce((a, b) => a + b, 0) / arr.length),
        last: arr[0]?.score ?? 0, // newest first
        bestWpm: Math.max(...wpms),
    };
};

const formatDate = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString(); } catch { return ''; }
};

const PersonalStatsDashboard = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const navigate = useNavigate();

    const [allScores, setAllScores] = useState([]);
    const [lifetimeXp, setLifetimeXp] = useState(0);
    const [totalStats, setTotalStats] = useState(null);
    const [badges, setBadges] = useState([]);
    const [badgesLoading, setBadgesLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const userId = getUserId(getAuthToken());
        if (!userId) return;

        authFetch(`${API_BASE}/api/user-statistics/user?userId=${userId}`)
            .then(r => r.ok ? r.json() : null)
            .then(body => {
                const stat = body?.value ?? (body?.userId != null ? body : null);
                if (stat) {
                    setLifetimeXp(stat.lifetimeXp ?? 0);
                    setTotalStats(stat);
                }
            })
            .catch(() => {});

        authFetch(`${API_BASE}/api/scores/me`)
            .then(res => res.json())
            .then(data => {
                const arr = Array.isArray(data) ? data : [];
                setAllScores(arr);
                setStatsLoading(false);
            })
            .catch(err => {
                setError('Error loading scores: ' + err.message);
                setStatsLoading(false);
            });

        Promise.all([
            authFetch(`${API_BASE}/api/student-achievements/by-student?studentId=${userId}`).then(r => r.ok ? r.json() : []),
            authFetch(`${API_BASE}/api/achievements`).then(r => r.ok ? r.json() : []),
        ])
            .then(([earned, definitions]) => {
                const defMap = {};
                (Array.isArray(definitions) ? definitions : []).forEach(d => { defMap[d.achievementId] = d; });
                const joined = (Array.isArray(earned) ? earned : []).map(e => ({
                    studentAchievementId: e.studentAchievementId,
                    awardedAt: e.awardedAt,
                    ...(defMap[e.achievementId] || { name: `Badge #${e.achievementId}`, description: '' }),
                }));
                setBadges(joined);
            })
            .catch(() => setBadges([]))
            .finally(() => setBadgesLoading(false));
    }, []);

    // Categorise scores by game mode
    const typingScores     = allScores.filter(s => s.challengeType === 'normal'       || s.challengeType === 'TYPING_TESTS');
    const fallingScores    = allScores.filter(s => s.challengeType === 'falling'       || s.challengeType === 'FALLING_WORDS');
    const sniperScores     = allScores.filter(s => s.challengeType === 'SYNTAX_SAVER');
    const translationScores = allScores.filter(s => s.challengeType === 'CODE_CHALLENGES');
    const galaxyScores     = allScores.filter(s => s.challengeType === 'GALAXY');

    const typingStats     = computeStats(typingScores);
    const fallingStats    = computeStats(fallingScores);
    const sniperStats     = computeStats(sniperScores);
    const translationSt   = computeStats(translationScores);
    const galaxyStats     = computeStats(galaxyScores);

    // Score distribution for Typing Test
    const distribution = { '90–100': 0, '80–89': 0, '70–79': 0, '60–69': 0, '0–59': 0 };
    typingScores.forEach(s => {
        if      (s.score >= 90) distribution['90–100']++;
        else if (s.score >= 80) distribution['80–89']++;
        else if (s.score >= 70) distribution['70–79']++;
        else if (s.score >= 60) distribution['60–69']++;
        else                    distribution['0–59']++;
    });

    const totalSessions = typingStats.count + fallingStats.count + sniperStats.count + translationSt.count + galaxyStats.count;

    // Average WPM across typing-based sessions only — the other game modes submit
    // wpm 0, so including them would drag the average toward zero.
    const wpmSessions = [...typingScores, ...fallingScores]
        .map(s => s.wpm ?? 0)
        .filter(w => w > 0);
    const avgWpm = wpmSessions.length
        ? Math.round(wpmSessions.reduce((a, b) => a + b, 0) / wpmSessions.length)
        : 0;

    const GAME_DEFS = [
        { label: 'Typing Test',          stats: typingStats,    accent: '#C8456D', path: '/typingtest' },
        { label: 'Falling Code',         stats: fallingStats,   accent: '#A78BFA', path: '/fallingtypingtest' },
        { label: 'Syntax Sniper',        stats: sniperStats,    accent: '#3ECF6A', path: '/syntax-sniper' },
        { label: 'Translation Terminal', stats: translationSt,  accent: '#FFC700', path: '/translation-terminal' },
        { label: 'Galaxy Challenge',     stats: galaxyStats,    accent: '#60A5FA', path: '/galaxy-new' },
    ];

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4, px: { xs: 2, md: 4 } }}>
            <Box sx={{ maxWidth: 1100, mx: 'auto' }}>

                {/* Header */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/dashboard')}
                        sx={{ color: 'text.secondary' }}
                        size="small"
                    >
                        Dashboard
                    </Button>
                </Stack>
                <Typography variant="h3" sx={{ mb: 0.5, color: 'text.primary', fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
                    My <Box component="span" sx={gradientText}>Stats & Progress</Box>
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                    Lifetime XP, per-game scores, and your Pre-Test → Post-Test improvement.
                </Typography>

                {error && <Typography sx={{ color: 'error.main', mb: 2 }}>{error}</Typography>}

                {/* Lifetime XP */}
                <Card sx={{ mb: 3, background: isDark ? 'linear-gradient(135deg,#1e3a5f,#0d1b2a)' : 'linear-gradient(135deg,#1e3a8a,#1e40af)', color: '#fff' }}>
                    <CardContent sx={{ p: 3 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
                                <StarIcon sx={{ fontSize: 44, color: '#FFD700' }} />
                                <Box>
                                    <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>Lifetime XP</Typography>
                                    <Typography variant="h3" sx={{ color: '#FFD700', fontWeight: 800, lineHeight: 1, fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif', fontVariantNumeric: 'tabular-nums', fontSize: { xs: '2rem', md: '3rem' } }}>
                                        {lifetimeXp.toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
                                        Earned across all game modes · grows every session
                                    </Typography>
                                </Box>
                            </Stack>
                            {totalStats && (
                                <Stack spacing={0.5} sx={{ minWidth: 160 }}>
                                    {[
                                        { label: 'Total Sessions', value: totalStats.totalTestsTaken ?? totalSessions },
                                        { label: 'Best WPM',       value: Math.round(totalStats.wordsPerMinute ?? 0) },
                                        { label: 'Avg WPM',        value: avgWpm },
                                        { label: 'Avg Accuracy',   value: `${Math.round(totalStats.accuracy ?? 0)}%` },
                                        { label: 'Total Errors',   value: totalStats.totalErrors ?? 0 },
                                    ].map(({ label, value }) => (
                                        <Stack key={label} direction="row" justifyContent="space-between" spacing={2}>
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{label}</Typography>
                                            <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            )}
                        </Stack>
                    </CardContent>
                </Card>

                {/* Per-Game Overview */}
                <Typography variant="h5" sx={{ color: 'text.primary', mb: 2 }}>Per-Game Overview</Typography>
                {statsLoading ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress color="primary" /></Box>
                ) : (
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)', md: 'repeat(5,1fr)' }, mb: 4 }}>
                        {GAME_DEFS.map(({ label, stats, accent }) => (
                            <GameSummaryCard
                                key={label}
                                label={label}
                                count={stats.count}
                                best={stats.best}
                                accent={accent}
                                isDark={isDark}
                            />
                        ))}
                    </Box>
                )}

                {/* Badges */}
                <Typography variant="h5" sx={{ color: 'text.primary', mb: 2 }}>
                    Badges{badges.length > 0 && (
                        <Box component="span" sx={{ color: 'text.secondary', fontSize: '1rem', ml: 1 }}>({badges.length})</Box>
                    )}
                </Typography>
                {badgesLoading ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress color="primary" /></Box>
                ) : badges.length === 0 ? (
                    <Card sx={{ mb: 4 }}>
                        <CardContent sx={{ textAlign: 'center', py: 5 }}>
                            <EmojiEventsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                            <Typography sx={{ color: 'text.secondary' }}>No badges yet — play any game mode to start earning them!</Typography>
                        </CardContent>
                    </Card>
                ) : (
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(3,1fr)' }, mb: 4 }}>
                        {badges.map((b) => (
                            <Card key={b.studentAchievementId} sx={{ border: '1.5px solid', borderColor: '#FFC700', bgcolor: isDark ? 'rgba(255,199,0,0.06)' : 'rgba(255,199,0,0.04)' }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                        <EmojiEventsIcon sx={{ color: '#FFC700', mt: 0.25, flexShrink: 0 }} />
                                        <Box>
                                            <Typography sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>{b.name}</Typography>
                                            {b.description && (
                                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>{b.description}</Typography>
                                            )}
                                            {b.awardedAt && (
                                                <Chip label={`Earned ${formatDate(b.awardedAt)}`} size="small"
                                                    sx={{ mt: 1, bgcolor: 'rgba(255,199,0,0.12)', color: '#FFC700', fontWeight: 700, fontSize: '0.72rem' }} />
                                            )}
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}

                <Divider sx={{ my: 4 }} />

                {/* ── Syntax Sniper ── */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ color: 'text.primary' }}>Syntax Sniper</Typography>
                    <Chip label="Fill-in-the-blank" size="small" sx={{ bgcolor: '#3ECF6A22', color: '#3ECF6A', fontWeight: 700 }} />
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Tracks your punctuation muscle memory — semicolons, braces, parens, commas.
                </Typography>
                {statsLoading ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress color="primary" /></Box>
                ) : sniperStats.count === 0 ? (
                    <Card sx={{ mb: 4 }}>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Typography sx={{ color: 'text.secondary' }}>No Syntax Sniper sessions yet. <Button size="small" onClick={() => navigate('/syntax-sniper')}>Play now →</Button></Typography>
                        </CardContent>
                    </Card>
                ) : (
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, mb: 2 }}>
                            <StatCard label="Sessions Played" value={sniperStats.count}  accent="#3ECF6A" />
                            <StatCard label="Best Score"      value={sniperStats.best}   accent="#FFC700" />
                            <StatCard label="Avg Score"       value={sniperStats.avg}    accent="#E78AAC" />
                            <StatCard label="Last Score"      value={sniperStats.last}   />
                        </Box>
                        {/* Score history for last 5 sessions */}
                        {sniperScores.length > 1 && (
                            <Card variant="outlined" sx={{ mb: 2 }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>Recent Sessions (newest first)</Typography>
                                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                                        {sniperScores.slice(0, 5).map((s, i) => (
                                            <Stack key={s.id} direction="row" justifyContent="space-between">
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Session {sniperStats.count - i}</Typography>
                                                <Stack direction="row" spacing={2}>
                                                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.primary', fontWeight: 600 }}>Score: {s.score}</Typography>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{formatDate(s.submittedAt)}</Typography>
                                                </Stack>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </CardContent>
                            </Card>
                        )}
                        <ModeComparison game={GAME.SNIPER} percentKey="percent" />
                    </Box>
                )}

                <Divider sx={{ my: 4 }} />

                {/* ── Translation Terminal ── */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ color: 'text.primary' }}>Translation Terminal</Typography>
                    <Chip label="English → C Syntax" size="small" sx={{ bgcolor: '#FFC70022', color: '#FFC700', fontWeight: 700 }} />
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Measures your ability to recall and write correct C syntax from natural-language prompts.
                </Typography>
                {statsLoading ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress color="primary" /></Box>
                ) : translationSt.count === 0 ? (
                    <Card sx={{ mb: 4 }}>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Typography sx={{ color: 'text.secondary' }}>No Translation Terminal sessions yet. <Button size="small" onClick={() => navigate('/translation-terminal')}>Play now →</Button></Typography>
                        </CardContent>
                    </Card>
                ) : (
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, mb: 2 }}>
                            <StatCard label="Sessions Played" value={translationSt.count}  accent="#FFC700" />
                            <StatCard label="Best Score"      value={translationSt.best}   accent="#C8456D" />
                            <StatCard label="Avg Score"       value={translationSt.avg}    accent="#E78AAC" />
                            <StatCard label="Last Score"      value={translationSt.last}   />
                        </Box>
                        {translationScores.length > 1 && (
                            <Card variant="outlined" sx={{ mb: 2 }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>Recent Sessions (newest first)</Typography>
                                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                                        {translationScores.slice(0, 5).map((s, i) => (
                                            <Stack key={s.id} direction="row" justifyContent="space-between">
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Session {translationSt.count - i}</Typography>
                                                <Stack direction="row" spacing={2}>
                                                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.primary', fontWeight: 600 }}>Score: {s.score}</Typography>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{formatDate(s.submittedAt)}</Typography>
                                                </Stack>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </CardContent>
                            </Card>
                        )}
                        <ModeComparison game={GAME.TRANSLATION} percentKey="percent" />
                    </Box>
                )}

                <Divider sx={{ my: 4 }} />

                {/* ── Falling Code ── */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ color: 'text.primary' }}>Falling Code</Typography>
                    <Chip label="Falling Blocks" size="small" sx={{ bgcolor: '#A78BFA22', color: '#A78BFA', fontWeight: 700 }} />
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Typing speed and reaction under falling C code blocks.
                </Typography>
                {statsLoading ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress color="primary" /></Box>
                ) : fallingStats.count === 0 ? (
                    <Card sx={{ mb: 4 }}>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Typography sx={{ color: 'text.secondary' }}>No Falling Code sessions yet. <Button size="small" onClick={() => navigate('/fallingtypingtest')}>Play now →</Button></Typography>
                        </CardContent>
                    </Card>
                ) : (
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, mb: 2 }}>
                            <StatCard label="Sessions Played" value={fallingStats.count}   accent="#A78BFA" />
                            <StatCard label="Best Score"      value={fallingStats.best}    accent="#FFC700" />
                            <StatCard label="Avg Score"       value={fallingStats.avg}     />
                            <StatCard label="Last Score"      value={fallingStats.last}    />
                        </Box>
                        {fallingStats.bestWpm > 0 && (
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(2,1fr)' }, mb: 2 }}>
                                <StatCard label="Best WPM"     value={Math.round(fallingStats.bestWpm)} accent="#7BE093" />
                                <StatCard label="Avg WPM"      value={Math.round(fallingScores.reduce((s, e) => s + (e.wpm ?? 0), 0) / fallingScores.length)} />
                            </Box>
                        )}
                        <ModeComparison game={GAME.FALLING} scoreKey="score" />
                    </Box>
                )}

                <Divider sx={{ my: 4 }} />

                {/* ── Typing Test ── */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ color: 'text.primary' }}>Paragraph Typing Test</Typography>
                    <Chip label="Code Challenges" size="small" sx={{ bgcolor: '#C8456D22', color: '#C8456D', fontWeight: 700 }} />
                </Stack>
                {statsLoading ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress color="primary" /></Box>
                ) : typingStats.count === 0 ? (
                    <Card sx={{ mb: 4 }}>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Typography sx={{ color: 'text.secondary' }}>No Typing Test sessions yet. <Button size="small" onClick={() => navigate('/typingtest')}>Play now →</Button></Typography>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, mb: 2 }}>
                            <StatCard label="Sessions Played" value={typingStats.count}   accent="#C8456D" />
                            <StatCard label="Best Score"      value={typingStats.best}    accent="#FFC700" />
                            <StatCard label="Avg Score"       value={typingStats.avg}     accent="#E78AAC" />
                            <StatCard label="Last Score"      value={typingStats.last}    />
                        </Box>
                        {typingStats.bestWpm > 0 && (
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(3,1fr)' }, mb: 2 }}>
                                <StatCard label="Best WPM"     value={Math.round(typingStats.bestWpm)}   accent="#7BE093" />
                                <StatCard label="Avg Time (s)" value={Math.round(typingScores.reduce((s, e) => s + (e.timeInSeconds ?? 0), 0) / typingScores.length)} />
                                <StatCard label="Total Sessions" value={typingStats.count} />
                            </Box>
                        )}

                        <Typography variant="h6" sx={{ color: 'text.primary', mb: 1.5 }}>Score Distribution</Typography>
                        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(5,1fr)' }, mb: 4 }}>
                            {Object.entries(distribution).map(([range, count]) => (
                                <Card key={range}>
                                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h5" sx={{ color: 'text.primary', lineHeight: 1 }}>{count}</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>{range}</Typography>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </>
                )}

                {/* ── Galaxy Challenge ── */}
                {galaxyStats.count > 0 && (
                    <>
                        <Divider sx={{ my: 4 }} />
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Typography variant="h5" sx={{ color: 'text.primary' }}>Galaxy Challenge</Typography>
                            <Chip label="Quiz Combat" size="small" sx={{ bgcolor: '#60A5FA22', color: '#60A5FA', fontWeight: 700 }} />
                        </Stack>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, mb: 4 }}>
                            <StatCard label="Sessions Played" value={galaxyStats.count}  accent="#60A5FA" />
                            <StatCard label="Best Score"      value={galaxyStats.best}   accent="#FFC700" />
                            <StatCard label="Avg Score"       value={galaxyStats.avg}    accent="#E78AAC" />
                            <StatCard label="Last Score"      value={galaxyStats.last}   />
                        </Box>
                    </>
                )}

            </Box>
        </Box>
    );
};

export default PersonalStatsDashboard;
