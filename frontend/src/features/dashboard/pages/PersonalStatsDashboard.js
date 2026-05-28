import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Card, CardContent, Stack, Typography, Button, Chip, CircularProgress,
    Divider, useTheme,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { API_BASE } from '../../../shared/api/client';
import { authFetch } from '../../../shared/api/authFetch';
import { getUserId } from '../../../shared/auth/JwtUtils';
import { getAuthToken } from '../../../shared/auth/AuthUtils';

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

const PersonalStatsDashboard = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const navigate = useNavigate();

    const [scores, setScores] = useState([]);
    const [fallingScores, setFallingScores] = useState([]);
    const [lifetimeXp, setLifetimeXp] = useState(0);
    const [badges, setBadges] = useState([]);         // joined: { name, description, awardedAt, triggerType, triggerValue }
    const [badgesLoading, setBadgesLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const userId = getUserId(getAuthToken());
        if (!userId) return;

        // Fetch user statistics (XP)
        authFetch(`${API_BASE}/api/user-statistics/user?userId=${userId}`)
            .then(r => r.ok ? r.json() : null)
            .then(body => {
                const stat = body?.value ?? (body?.userId != null ? body : null);
                if (stat?.lifetimeXp != null) setLifetimeXp(stat.lifetimeXp);
            })
            .catch(() => {});

        // Fetch only this user's scores (newest first)
        authFetch(`${API_BASE}/api/scores/me`)
            .then(res => res.json())
            .then(data => {
                const arr = Array.isArray(data) ? data : [];
                // Normalise legacy types ('normal', 'falling') and new enum names
                const isTyping  = t => t === 'normal'  || t === 'TYPING_TESTS';
                const isFalling = t => t === 'falling' || t === 'FALLING_WORDS';
                setScores(arr.filter(s => isTyping(s.challengeType)));
                setFallingScores(arr.filter(s => isFalling(s.challengeType)));
                setStatsLoading(false);
            })
            .catch(err => {
                setError('Error loading scores: ' + err.message);
                setStatsLoading(false);
            });

        // Fetch earned badges + all achievement definitions in parallel, then join.
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

    // Derived stats
    const totalScore    = scores.reduce((s, e) => s + e.score, 0);
    const highestScore  = scores.length ? Math.max(...scores.map(s => s.score)) : 0;
    const lowestScore   = scores.length ? Math.min(...scores.map(s => s.score)) : 0;
    const averageScore  = scores.length ? (totalScore / scores.length).toFixed(2) : 0;
    const avgTime       = scores.length ? (scores.reduce((s, e) => s + e.timeInSeconds, 0) / scores.length).toFixed(2) : 0;
    const wpmList       = scores.map(s => s.wpm ?? 0);
    const highestWPM    = wpmList.length ? Math.max(...wpmList).toFixed(2) : 0;
    const lowestWPM     = wpmList.length ? Math.min(...wpmList).toFixed(2) : 0;

    const totalFalling          = fallingScores.length;
    const highestFallingScore   = totalFalling ? Math.max(...fallingScores.map(s => s.score)) : 0;
    const averageFallingScore   = totalFalling ? Math.round(fallingScores.reduce((s, e) => s + e.score, 0) / totalFalling) : 0;

    const distribution = { '90–100': 0, '80–89': 0, '70–79': 0, '60–69': 0, '0–59': 0 };
    scores.forEach(s => {
        if      (s.score >= 90) distribution['90–100']++;
        else if (s.score >= 80) distribution['80–89']++;
        else if (s.score >= 70) distribution['70–79']++;
        else if (s.score >= 60) distribution['60–69']++;
        else                    distribution['0–59']++;
    });

    const formatDate = (iso) => {
        if (!iso) return '';
        try { return new Date(iso).toLocaleDateString(); } catch { return ''; }
    };

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
                    My <Box component="span" sx={gradientText}>Stats & Badges</Box>
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                    Your lifetime progress, scores, and earned achievements.
                </Typography>

                {error && <Typography sx={{ color: 'error.main', mb: 2 }}>{error}</Typography>}

                {/* ── Lifetime XP ── */}
                <Card sx={{ mb: 4, background: isDark ? 'linear-gradient(135deg,#1e3a5f,#0d1b2a)' : 'linear-gradient(135deg,#1e3a8a,#1e40af)', color: '#fff' }}>
                    <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <StarIcon sx={{ fontSize: 44, color: '#FFD700' }} />
                            <Box>
                                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
                                    Lifetime XP
                                </Typography>
                                <Typography
                                    variant="h3"
                                    sx={{
                                        color: '#FFD700',
                                        fontWeight: 800,
                                        lineHeight: 1,
                                        fontVariantNumeric: 'tabular-nums',
                                        fontSize: { xs: '2rem', md: '3rem' },
                                    }}
                                >
                                    {lifetimeXp.toLocaleString()}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
                                    Earned across all game modes · grows every session
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                {/* ── Badges ── */}
                <Typography variant="h5" sx={{ color: 'text.primary', mb: 2 }}>
                    Badges{badges.length > 0 && <Box component="span" sx={{ color: 'text.secondary', fontSize: '1rem', ml: 1 }}>({badges.length})</Box>}
                </Typography>
                {badgesLoading ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress color="primary" /></Box>
                ) : badges.length === 0 ? (
                    <Card sx={{ mb: 4 }}>
                        <CardContent sx={{ textAlign: 'center', py: 5 }}>
                            <EmojiEventsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                            <Typography sx={{ color: 'text.secondary' }}>
                                No badges yet — play any game mode to start earning them!
                            </Typography>
                        </CardContent>
                    </Card>
                ) : (
                    <Box
                        sx={{
                            display: 'grid',
                            gap: 2,
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                            mb: 4,
                        }}
                    >
                        {badges.map((b) => (
                            <Card
                                key={b.studentAchievementId}
                                sx={{
                                    border: '1.5px solid',
                                    borderColor: '#FFC700',
                                    bgcolor: isDark ? 'rgba(255,199,0,0.06)' : 'rgba(255,199,0,0.04)',
                                }}
                            >
                                <CardContent sx={{ p: 2.5 }}>
                                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                        <EmojiEventsIcon sx={{ color: '#FFC700', mt: 0.25, flexShrink: 0 }} />
                                        <Box>
                                            <Typography sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>
                                                {b.name}
                                            </Typography>
                                            {b.description && (
                                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                                    {b.description}
                                                </Typography>
                                            )}
                                            {b.awardedAt && (
                                                <Chip
                                                    label={`Earned ${formatDate(b.awardedAt)}`}
                                                    size="small"
                                                    sx={{ mt: 1, bgcolor: 'rgba(255,199,0,0.12)', color: '#FFC700', fontWeight: 700, fontSize: '0.72rem' }}
                                                />
                                            )}
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}

                <Divider sx={{ my: 4 }} />

                {/* ── Typing test stats ── */}
                <Typography variant="h5" sx={{ color: 'text.primary', mb: 2 }}>Paragraph Typing Test</Typography>
                {statsLoading ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress color="primary" /></Box>
                ) : (
                    <>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, mb: 3 }}>
                            <StatCard label="Total Score"  value={totalScore}   accent="#C8456D" />
                            <StatCard label="Highest"      value={highestScore} accent="#FFC700" />
                            <StatCard label="Lowest"       value={lowestScore}  accent="#E78AAC" />
                            <StatCard label="Average"      value={averageScore} accent="#9B2E54" />
                            <StatCard label="Avg Time (s)" value={avgTime}      />
                            <StatCard label="Highest WPM"  value={highestWPM}   accent="#7BE093" />
                            <StatCard label="Lowest WPM"   value={lowestWPM}    />
                        </Box>

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

                {/* ── Falling code stats ── */}
                <Typography variant="h5" sx={{ color: 'text.primary', mb: 2 }}>Falling Code</Typography>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, mb: 4 }}>
                    <StatCard label="Games Played"   value={totalFalling}          accent="#A78BFA" />
                    <StatCard label="Highest Score"  value={highestFallingScore}   accent="#FFC700" />
                    <StatCard label="Average Score"  value={averageFallingScore}   />
                    <StatCard label="Last Score"     value={fallingScores.length ? fallingScores[fallingScores.length - 1].score : 0} />
                </Box>
            </Box>
        </Box>
    );
};

export default PersonalStatsDashboard;
