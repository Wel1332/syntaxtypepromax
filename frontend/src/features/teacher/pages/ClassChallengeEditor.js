// Create or edit one class challenge. The game is chosen once, when creating;
// after that only its contents change, because past attempts were played in it.

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Alert, Box, Button, Card, CardActionArea, CardContent, Chip, FormControlLabel, LinearProgress,
    Stack, Switch, TextField, Typography, useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { PageBackdrop } from '../../profile/components/profileShared';
import ChallengeItemEditor from '../components/ChallengeItemEditor';
import {
    GAMES, GAME_KEYS, LIMITS, blankItem, emptyForm, fromChallenge, toRequest, validateChallenge,
    getChallenge, createChallenge, updateChallenge,
} from '../data/classChallenges';

const startingItems = (game) =>
    Array.from({ length: game === 'FALLING' ? LIMITS.MIN_BUG_SMASHER_ITEMS : 1 }, () => blankItem(game));

function GamePicker({ onPick }) {
    return (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
            {GAME_KEYS.map((key) => (
                <Card key={key} sx={{ borderTop: `4px solid ${GAMES[key].color}` }}>
                    <CardActionArea
                        onClick={() => onPick(key)}
                        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}
                    >
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{GAMES[key].label}</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{GAMES[key].description}</Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>
            ))}
        </Box>
    );
}

export default function ClassChallengeEditor() {
    const { classroomId, challengeId } = useParams();
    const isNew = !challengeId;
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const listPath = `/teacher/classes/${classroomId}/challenges`;

    const [game, setGame] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [loadState, setLoadState] = useState(isNew ? 'ready' : 'loading');
    const [showErrors, setShowErrors] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState('');

    useEffect(() => {
        if (isNew) return;
        let cancelled = false;
        getChallenge(classroomId, challengeId).then((result) => {
            if (cancelled) return;
            if (!result.ok) {
                setServerError(result.message);
                setLoadState('error');
                return;
            }
            setGame(result.data.game);
            setForm(fromChallenge(result.data));
            setLoadState('ready');
        });
        return () => { cancelled = true; };
    }, [isNew, classroomId, challengeId]);

    const validation = useMemo(() => (game ? validateChallenge(game, form) : null), [game, form]);

    const update = (patch) => setForm((f) => ({ ...f, ...patch }));
    const updateItem = (index, patch) =>
        setForm((f) => ({ ...f, items: f.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) }));
    const addItem = () => setForm((f) => ({ ...f, items: [...f.items, blankItem(game)] }));
    const removeItem = (index) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
    const moveItem = (index, step) => setForm((f) => {
        const items = [...f.items];
        const target = index + step;
        if (target < 0 || target >= items.length) return f;
        [items[index], items[target]] = [items[target], items[index]];
        return { ...f, items };
    });

    const pickGame = (key) => {
        setGame(key);
        setForm((f) => ({ ...f, items: startingItems(key) }));
    };

    const handleSave = async () => {
        setServerError('');
        if (!validation.valid) {
            setShowErrors(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setSaving(true);
        const body = toRequest(game, form);
        const result = isNew
            ? await createChallenge(classroomId, body)
            : await updateChallenge(classroomId, challengeId, body);
        setSaving(false);
        if (result.ok) {
            navigate(listPath, { state: { toast: isNew ? 'Challenge created.' : 'Changes saved.' } });
            return;
        }
        setServerError(result.message);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const err = (field) => (showErrors && validation ? validation[field] : null);

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4, px: { xs: 2, md: 4 }, position: 'relative', overflow: 'hidden' }}>
            <PageBackdrop isDark={isDark} />
            <Box sx={{ maxWidth: 860, mx: 'auto', position: 'relative', zIndex: 1 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(listPath)} size="small" sx={{ mb: 1, color: 'text.secondary' }}>
                    Back to challenges
                </Button>
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2, display: 'block' }}>
                    Class challenge
                </Typography>
                <Typography variant="h4" component="h1" sx={{ color: 'text.primary', mb: 3 }}>
                    {isNew ? 'New challenge' : 'Edit challenge'}
                </Typography>

                {serverError && <Alert severity="error" sx={{ mb: 3 }}>{serverError}</Alert>}
                {showErrors && validation && !validation.valid && !serverError && (
                    <Alert severity="warning" sx={{ mb: 3 }}>Fix the highlighted fields, then save again.</Alert>
                )}

                {loadState === 'loading' && <LinearProgress />}

                {loadState === 'ready' && !game && (
                    <>
                        <Typography variant="h6" sx={{ mb: 2 }}>Which game is this challenge for?</Typography>
                        <GamePicker onPick={pickGame} />
                    </>
                )}

                {loadState === 'ready' && game && (
                    <Stack spacing={3}>
                        <Card>
                            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                    <Chip label={GAMES[game].label} sx={{ fontWeight: 700, bgcolor: GAMES[game].color, color: '#fff' }} />
                                    {!isNew && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            The game can't be changed after the challenge is created.
                                        </Typography>
                                    )}
                                </Stack>
                                <Stack spacing={2}>
                                    <TextField
                                        label="Title" value={form.title} required fullWidth size="small"
                                        error={!!err('title')} helperText={err('title')}
                                        onChange={(e) => update({ title: e.target.value })}
                                        inputProps={{ maxLength: LIMITS.TITLE }}
                                    />
                                    <TextField
                                        label="Instructions for students (optional)" value={form.instructions} fullWidth size="small"
                                        multiline minRows={2}
                                        error={!!err('instructions')} helperText={err('instructions')}
                                        onChange={(e) => update({ instructions: e.target.value })}
                                        inputProps={{ maxLength: LIMITS.INSTRUCTIONS }}
                                    />
                                    <Box>
                                        <FormControlLabel
                                            control={<Switch checked={form.limitAttempts} onChange={(e) => update({ limitAttempts: e.target.checked })} />}
                                            label="Limit attempts"
                                        />
                                        {form.limitAttempts ? (
                                            <Box sx={{ mt: 1 }}>
                                                <TextField
                                                    label="Attempts per student" type="number" size="small" value={form.maxAttempts}
                                                    error={!!err('maxAttempts')}
                                                    helperText={err('maxAttempts') || 'Each student can submit this many times.'}
                                                    onChange={(e) => update({ maxAttempts: e.target.value })}
                                                    inputProps={{ min: 1, max: LIMITS.MAX_ATTEMPTS }}
                                                    sx={{ width: 300 }}
                                                />
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" sx={{ color: 'text.secondary', ml: 6 }}>
                                                Students can retry as often as they like.
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box>
                                        <FormControlLabel
                                            control={<Switch checked={form.visible} onChange={(e) => update({ visible: e.target.checked })} />}
                                            label="Show to students"
                                        />
                                        <Typography variant="body2" sx={{ color: 'text.secondary', ml: 6 }}>
                                            {form.visible
                                                ? 'Students in this class can see and play it.'
                                                : 'Hidden. Only you can see it until you switch this on.'}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>

                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                <Typography variant="h6">Questions ({form.items.length})</Typography>
                                <Button
                                    startIcon={<AddIcon />} onClick={addItem} variant="outlined" size="small"
                                    disabled={form.items.length >= LIMITS.MAX_ITEMS}
                                >
                                    Add question
                                </Button>
                            </Stack>
                            {validation.list && (
                                <Typography variant="body2" sx={{ color: showErrors ? 'error.main' : 'text.secondary', mb: 1 }}>
                                    {validation.list}
                                </Typography>
                            )}
                            <Stack spacing={2}>
                                {form.items.map((item, i) => (
                                    <ChallengeItemEditor
                                        key={i}
                                        game={game}
                                        item={item}
                                        index={i}
                                        count={form.items.length}
                                        errors={validation.items[i] || {}}
                                        showErrors={showErrors}
                                        onChange={(patch) => updateItem(i, patch)}
                                        onMove={(step) => moveItem(i, step)}
                                        onRemove={() => removeItem(i)}
                                    />
                                ))}
                            </Stack>
                        </Box>

                        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                            <Button onClick={() => navigate(listPath)} sx={{ textTransform: 'none' }}>Cancel</Button>
                            <Button
                                variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}
                                sx={{ textTransform: 'none' }}
                            >
                                {saving ? 'Saving…' : isNew ? 'Create challenge' : 'Save changes'}
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </Box>
        </Box>
    );
}
