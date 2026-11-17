// How a class did on one challenge: who played, each student's best attempt,
// every attempt on request, and a CSV of it all.

import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Alert, Box, Button, Card, CardContent, Chip, Collapse, IconButton, LinearProgress, Stack,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { PageBackdrop } from '../../profile/components/profileShared';
import { GAMES, getResults } from '../data/classChallenges';
import {
    classSummary, csvFileName, formatDuration, resultsCsv, studentRows,
} from '../data/challengeResults';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
// On a phone the table keeps who, how many and how well; the rest is one tap away.
const WIDE_ONLY = { display: { xs: 'none', sm: 'table-cell' } };
const when = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const result = (a) => `${a.correctCount} / ${a.totalCount} · ${a.accuracy}%`;

function download(text, fileName) {
    // The byte-order mark makes Excel read names with accents correctly.
    const blob = new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

function Stat({ label, value, hint }) {
    return (
        <Card sx={{ flex: '1 1 140px' }}>
            <CardContent sx={{ py: 2 }}>
                <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1.5, display: 'block' }}>{label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>{value}</Typography>
                {hint && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{hint}</Typography>}
            </CardContent>
        </Card>
    );
}

function AttemptHistory({ attempts }) {
    return (
        <Table size="small" aria-label="Every attempt" sx={{ minWidth: 520 }}>
            <TableHead>
                <TableRow>
                    <TableCell>Attempt</TableCell>
                    <TableCell align="right">Score</TableCell>
                    <TableCell>Result</TableCell>
                    <TableCell>Time taken</TableCell>
                    <TableCell>Submitted</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {attempts.map((a, i) => (
                    <TableRow key={i}>
                        <TableCell>{attempts.length - i}</TableCell>
                        <TableCell align="right">{a.score}</TableCell>
                        <TableCell>{result(a)}</TableCell>
                        <TableCell>{formatDuration(a.durationSeconds)}</TableCell>
                        <TableCell>{when(a.submittedAt)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function StudentRow({ row }) {
    const [open, setOpen] = useState(false);
    const played = row.attempts.length > 0;
    return (
        <Fragment>
            <TableRow data-student={row.username} sx={{ '& > td': { borderBottom: open ? 'none' : undefined } }}>
                <TableCell sx={{ width: 48, pr: 0 }}>
                    {played && (
                        <IconButton
                            size="small"
                            onClick={() => setOpen((o) => !o)}
                            aria-expanded={open}
                            aria-label={`${open ? 'Hide' : 'Show'} every attempt by ${row.name}`}
                        >
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                    )}
                </TableCell>
                <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{row.name}</Typography>
                        {!row.enrolled && <Chip size="small" label="Left the class" variant="outlined" />}
                    </Stack>
                    {row.username && row.username !== row.name && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', overflowWrap: 'anywhere' }}>{row.username}</Typography>
                    )}
                </TableCell>
                {played ? (
                    <>
                        <TableCell align="right">{row.attempts.length}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{row.best.score}</TableCell>
                        <TableCell sx={WIDE_ONLY}>{result(row.best)}</TableCell>
                        <TableCell sx={WIDE_ONLY}>{when(row.latest.submittedAt)}</TableCell>
                    </>
                ) : (
                    <TableCell colSpan={4} sx={{ color: 'text.secondary' }}>Not played yet</TableCell>
                )}
            </TableRow>
            {played && (
                <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0, ...(open ? {} : { borderBottom: 'none' }) }}>
                        <Collapse in={open} unmountOnExit>
                            {/* width 0 + min-width 100% keeps a wide history from stretching the table; it scrolls instead. */}
                            <Box sx={{ py: 1.5, pl: { sm: 6 }, width: 0, minWidth: '100%', boxSizing: 'border-box', overflowX: 'auto' }}>
                                <AttemptHistory attempts={row.attempts} />
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            )}
        </Fragment>
    );
}

export default function ClassChallengeResultsPage() {
    const { classroomId, challengeId } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [data, setData] = useState(null);
    const [loadState, setLoadState] = useState('loading');
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        let cancelled = false;
        getResults(classroomId, challengeId).then((res) => {
            if (cancelled) return;
            if (!res.ok) {
                setLoadError(res.message);
                setLoadState('error');
                return;
            }
            setData(res.data);
            setLoadState('ok');
        });
        return () => { cancelled = true; };
    }, [classroomId, challengeId]);

    const rows = useMemo(() => studentRows(data?.students), [data]);
    const summary = useMemo(() => classSummary(rows), [rows]);
    const challenge = data?.challenge;
    const game = challenge && GAMES[challenge.game];

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4, px: { xs: 2, md: 4 }, position: 'relative', overflow: 'hidden' }}>
            <PageBackdrop isDark={isDark} />
            <Box sx={{ maxWidth: 1040, mx: 'auto', position: 'relative', zIndex: 1 }}>
                <Button
                    startIcon={<ArrowBackIcon />} size="small" sx={{ mb: 1, color: 'text.secondary' }}
                    onClick={() => navigate(`/teacher/classes/${classroomId}/challenges`)}
                >
                    Back to class challenges
                </Button>

                {loadState === 'loading' && <LinearProgress />}
                {loadState === 'error' && <Alert severity="error">{loadError}</Alert>}

                {loadState === 'ok' && challenge && (
                    <>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-end' }} spacing={2} sx={{ mb: 3 }}>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
                                    Results · {challenge.classroomName}
                                </Typography>
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                                    <Typography variant="h4" component="h1" sx={{ color: 'text.primary', overflowWrap: 'anywhere' }}>{challenge.title}</Typography>
                                    <Chip label={game?.label || challenge.game} sx={{ fontWeight: 700, bgcolor: game?.color, color: '#fff' }} />
                                </Stack>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                    {plural(challenge.itemCount, 'question')}
                                    {' · '}
                                    {challenge.maxAttempts ? `${plural(challenge.maxAttempts, 'attempt')} each` : 'Unlimited attempts'}
                                    {' · '}
                                    {challenge.visible ? 'Visible to the class' : 'Hidden'}
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined" startIcon={<DownloadIcon />} sx={{ textTransform: 'none', flexShrink: 0 }}
                                disabled={rows.length === 0}
                                onClick={() => download(resultsCsv(rows), csvFileName(challenge.title))}
                            >
                                Download CSV
                            </Button>
                        </Stack>

                        {!challenge.visible && (
                            <Alert severity="info" sx={{ mb: 3 }}>
                                This challenge is hidden, so students can't play it. Switch it to Visible on the challenges page.
                            </Alert>
                        )}

                        <Stack direction="row" sx={{ mb: 3, flexWrap: 'wrap', gap: 2 }}>
                            <Stat label="Played" value={`${summary.played} of ${summary.inClass}`} hint="students in the class" />
                            <Stat label="Attempts" value={summary.attempts} />
                            <Stat label="Average best score" value={summary.averageBestScore ?? '—'} />
                            <Stat label="Average accuracy" value={summary.averageAccuracy == null ? '—' : `${summary.averageAccuracy}%`} hint="of each student's best attempt" />
                        </Stack>

                        {rows.length === 0 ? (
                            <Card>
                                <CardContent sx={{ textAlign: 'center', py: 5 }}>
                                    <Typography sx={{ color: 'text.secondary' }}>
                                        No students have joined this class yet. Share the class code from My Classes.
                                    </Typography>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <TableContainer sx={{ overflowX: 'auto' }}>
                                    <Table aria-label="Results by student" sx={{ minWidth: { sm: 640 } }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell />
                                                <TableCell>Student</TableCell>
                                                <TableCell align="right">Attempts</TableCell>
                                                <TableCell align="right">Best score</TableCell>
                                                <TableCell sx={WIDE_ONLY}>Best result</TableCell>
                                                <TableCell sx={WIDE_ONLY}>Last played</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {rows.map((row) => <StudentRow key={row.studentId} row={row} />)}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Card>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
}
