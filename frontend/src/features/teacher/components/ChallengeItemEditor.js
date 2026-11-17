// One question in the class challenge editor, with the fields its game needs.

import React from 'react';
import {
    Box, Card, CardContent, Stack, Typography, TextField, MenuItem, IconButton, Tooltip,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { DIFFICULTIES, LIMITS, countBlanks, syncAnswers } from '../data/classChallenges';

const mono = { '& textarea, & input': { fontFamily: 'monospace' } };

function Field({ errors, showErrors, name, helperText, ...props }) {
    const error = showErrors ? errors[name] : null;
    return (
        <TextField
            size="small"
            fullWidth
            error={!!error}
            helperText={error || helperText}
            {...props}
        />
    );
}

function DifficultyField({ value, onChange }) {
    return (
        <TextField
            select
            size="small"
            label="Difficulty"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            sx={{ minWidth: 140 }}
        >
            {DIFFICULTIES.map((d) => (
                <MenuItem key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</MenuItem>
            ))}
        </TextField>
    );
}

// The code as students will see it: each _ becomes a numbered box.
function SniperPreview({ code }) {
    let blank = 0;
    return (
        <Box
            component="pre"
            aria-label="Preview of what students see"
            sx={{
                m: 0, p: 1.5, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.85rem',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                bgcolor: 'action.hover', color: 'text.primary',
            }}
        >
            {[...code].map((ch, i) => {
                if (ch !== '_') return ch;
                blank += 1;
                return (
                    <Box
                        key={i}
                        component="span"
                        sx={{ px: 0.6, mx: 0.2, borderRadius: 0.5, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }}
                    >
                        {blank}
                    </Box>
                );
            })}
        </Box>
    );
}

function SniperFields({ item, errors, showErrors, onChange }) {
    const blanks = countBlanks(item.code);
    const answersError = showErrors ? errors.answers : null;
    return (
        <Stack spacing={2}>
            <Field
                label="Title" name="title" value={item.title} errors={errors} showErrors={showErrors}
                onChange={(e) => onChange({ title: e.target.value })}
                inputProps={{ maxLength: LIMITS.SNIPER_TITLE }}
            />
            <Field
                label="Code" name="code" value={item.code} errors={errors} showErrors={showErrors}
                multiline minRows={3} sx={mono}
                helperText={'Type _ wherever students must type a character, e.g. printf("hi")_'}
                onChange={(e) => onChange({ code: e.target.value, answers: syncAnswers(e.target.value, item.answers) })}
            />
            {blanks > 0 && (
                <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                        What students see
                    </Typography>
                    <SniperPreview code={item.code} />
                </Box>
            )}
            {blanks > 0 && (
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        The character for each blank
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {item.answers.map((answer, i) => (
                            <TextField
                                key={i}
                                size="small"
                                label={`Blank ${i + 1}`}
                                value={answer}
                                error={!!answersError && answer.trim().length !== 1}
                                onChange={(e) => {
                                    const next = [...item.answers];
                                    next[i] = e.target.value.slice(-1);
                                    onChange({ answers: next });
                                }}
                                inputProps={{ maxLength: 1, 'aria-label': `Answer for blank ${i + 1}`, style: { fontFamily: 'monospace', textAlign: 'center' } }}
                                sx={{ width: 84 }}
                            />
                        ))}
                    </Stack>
                    {answersError && (
                        <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 0.5 }}>
                            {answersError}
                        </Typography>
                    )}
                </Box>
            )}
            <DifficultyField value={item.difficulty} onChange={(difficulty) => onChange({ difficulty })} />
        </Stack>
    );
}

function BugSmasherFields({ item, errors, showErrors, onChange }) {
    return (
        <Stack spacing={2}>
            <Field
                label="Buggy line" name="buggy" value={item.buggy} errors={errors} showErrors={showErrors} sx={mono}
                helperText="What falls down the screen, e.g. int x = 5"
                onChange={(e) => onChange({ buggy: e.target.value })}
                inputProps={{ maxLength: LIMITS.LINE }}
            />
            <Field
                label="Fixed line" name="correct" value={item.correct} errors={errors} showErrors={showErrors} sx={mono}
                helperText="What students must type to smash it, e.g. int x = 5;"
                onChange={(e) => onChange({ correct: e.target.value })}
                inputProps={{ maxLength: LIMITS.LINE }}
            />
            <Field
                label="Kind of bug (optional)" name="category" value={item.category} errors={errors} showErrors={showErrors}
                helperText="e.g. missing semicolon"
                onChange={(e) => onChange({ category: e.target.value })}
                inputProps={{ maxLength: LIMITS.CATEGORY }}
            />
        </Stack>
    );
}

function TranslationFields({ item, errors, showErrors, onChange }) {
    return (
        <Stack spacing={2}>
            <Field
                label="Instruction in plain English" name="prompt" value={item.prompt} errors={errors} showErrors={showErrors}
                multiline minRows={2}
                helperText="e.g. Declare an integer named score and set it to 0."
                onChange={(e) => onChange({ prompt: e.target.value })}
                inputProps={{ maxLength: LIMITS.PROMPT }}
            />
            <Field
                label="C solution" name="solution" value={item.solution} errors={errors} showErrors={showErrors} sx={mono}
                helperText="e.g. int score = 0;"
                onChange={(e) => onChange({ solution: e.target.value })}
                inputProps={{ maxLength: LIMITS.SOLUTION }}
            />
            <DifficultyField value={item.difficulty} onChange={(difficulty) => onChange({ difficulty })} />
        </Stack>
    );
}

const FIELDS = { SNIPER: SniperFields, FALLING: BugSmasherFields, TRANSLATION: TranslationFields };

export default function ChallengeItemEditor({
    game, item, index, count, errors, showErrors, onChange, onMove, onRemove,
}) {
    const Fields = FIELDS[game];
    return (
        <Card variant="outlined">
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Question {index + 1}
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Move up">
                            <span>
                                <IconButton size="small" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move question ${index + 1} up`}>
                                    <ArrowUpwardIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Move down">
                            <span>
                                <IconButton size="small" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={`Move question ${index + 1} down`}>
                                    <ArrowDownwardIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Remove question">
                            <IconButton size="small" onClick={onRemove} aria-label={`Remove question ${index + 1}`}>
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>
                <Fields item={item} errors={errors} showErrors={showErrors} onChange={onChange} />
            </CardContent>
        </Card>
    );
}
