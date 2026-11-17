// The challenges a teacher made for one class: show or hide each one, edit, or delete.

import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogContentText,
    DialogTitle, FormControlLabel, IconButton, LinearProgress, Snackbar, Stack, Switch, Tooltip, Typography,
    useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { PageBackdrop } from '../../profile/components/profileShared';
import { authFetch } from '../../../shared/api/authFetch';
import { GAMES, listChallenges, deleteChallenge, setVisibility } from '../data/classChallenges';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function ChallengeRow({ challenge, busy, onToggle, onEdit, onDelete }) {
    const game = GAMES[challenge.game];
    return (
        <Card sx={{ borderLeft: `4px solid ${game?.color || '#999'}` }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Chip label={game?.label || challenge.game} size="small" sx={{ fontWeight: 700, mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>{challenge.title}</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {plural(challenge.itemCount, 'question')}
                            {' · '}
                            {challenge.maxAttempts ? plural(challenge.maxAttempts, 'attempt') + ' each' : 'Unlimited attempts'}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                        <FormControlLabel
                            control={(
                                <Switch
                                    checked={challenge.visible}
                                    disabled={busy}
                                    onChange={(e) => onToggle(e.target.checked)}
                                    inputProps={{ 'aria-label': `Show "${challenge.title}" to students` }}
                                />
                            )}
                            label={challenge.visible ? 'Visible' : 'Hidden'}
                            sx={{ mr: 1, '& .MuiFormControlLabel-label': { fontWeight: 600, minWidth: 56 } }}
                        />
                        <Button size="small" startIcon={<EditIcon />} onClick={onEdit} sx={{ textTransform: 'none' }}>
                            Edit
                        </Button>
                        <Tooltip title="Delete challenge">
                            <IconButton size="small" onClick={onDelete} aria-label={`Delete "${challenge.title}"`}>
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}

export default function ClassChallengesPage() {
    const { classroomId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [className, setClassName] = useState('');
    const [challenges, setChallenges] = useState([]);
    const [loadState, setLoadState] = useState('loading');
    const [loadError, setLoadError] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [toDelete, setToDelete] = useState(null);
    const [toast, setToast] = useState(location.state?.toast || '');

    const load = useCallback(async () => {
        setLoadState('loading');
        const result = await listChallenges(classroomId);
        if (!result.ok) {
            setLoadError(result.message);
            setLoadState('error');
            return;
        }
        setChallenges(result.data || []);
        setLoadState('ok');
    }, [classroomId]);

    useEffect(() => {
        load();
        // The class name for the heading; admins have no "mine" list, so they see a generic one.
        authFetch('/api/classes/mine')
            .then((res) => (res.ok ? res.json() : []))
            .then((classes) => {
                const cls = (classes || []).find((c) => String(c.classroomId) === String(classroomId));
                if (cls) setClassName(cls.name);
            })
            .catch(() => {});
    }, [load, classroomId]);

    const toggle = async (challenge, visible) => {
        setBusyId(challenge.challengeId);
        const result = await setVisibility(classroomId, challenge.challengeId, visible);
        setBusyId(null);
        if (!result.ok) {
            setToast(result.message);
            return;
        }
        setChallenges((list) => list.map((c) => (c.challengeId === challenge.challengeId ? { ...c, visible } : c)));
        setToast(visible ? `"${challenge.title}" is now visible to the class.` : `"${challenge.title}" is now hidden.`);
    };

    const confirmDelete = async () => {
        const challenge = toDelete;
        setToDelete(null);
        const result = await deleteChallenge(classroomId, challenge.challengeId);
        if (!result.ok) {
            setToast(result.message);
            return;
        }
        setChallenges((list) => list.filter((c) => c.challengeId !== challenge.challengeId));
        setToast(`Deleted "${challenge.title}".`);
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4, px: { xs: 2, md: 4 }, position: 'relative', overflow: 'hidden' }}>
            <PageBackdrop isDark={isDark} />
            <Box sx={{ maxWidth: 960, mx: 'auto', position: 'relative', zIndex: 1 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/teacher/classes')} size="small" sx={{ mb: 1, color: 'text.secondary' }}>
                    Back to My Classes
                </Button>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-end' }} spacing={2} sx={{ mb: 3 }}>
                    <Box>
                        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
                            Class challenges
                        </Typography>
                        <Typography variant="h4" component="h1" sx={{ color: 'text.primary' }}>
                            {className || 'This class'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            Only students who joined this class can see these, and only the ones you switch to Visible.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained" startIcon={<AddIcon />} sx={{ textTransform: 'none', flexShrink: 0 }}
                        onClick={() => navigate(`/teacher/classes/${classroomId}/challenges/new`)}
                    >
                        New challenge
                    </Button>
                </Stack>

                {loadState === 'loading' && <LinearProgress />}
                {loadState === 'error' && <Alert severity="error">{loadError}</Alert>}
                {loadState === 'ok' && challenges.length === 0 && (
                    <Card>
                        <CardContent sx={{ textAlign: 'center', py: 5 }}>
                            <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                                No challenges yet. Make one for this class in Syntax Sniper, Bug Smasher or Translation Terminal.
                            </Typography>
                            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate(`/teacher/classes/${classroomId}/challenges/new`)}>
                                New challenge
                            </Button>
                        </CardContent>
                    </Card>
                )}
                {loadState === 'ok' && challenges.length > 0 && (
                    <Stack spacing={2}>
                        {challenges.map((c) => (
                            <ChallengeRow
                                key={c.challengeId}
                                challenge={c}
                                busy={busyId === c.challengeId}
                                onToggle={(visible) => toggle(c, visible)}
                                onEdit={() => navigate(`/teacher/classes/${classroomId}/challenges/${c.challengeId}/edit`)}
                                onDelete={() => setToDelete(c)}
                            />
                        ))}
                    </Stack>
                )}
            </Box>

            <Dialog open={!!toDelete} onClose={() => setToDelete(null)}>
                <DialogTitle>Delete this challenge?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        "{toDelete?.title}" and every student attempt at it will be deleted. This can't be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setToDelete(null)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!toast}
                autoHideDuration={4000}
                onClose={() => setToast('')}
                message={toast}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Box>
    );
}
