import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Box, Card, CardContent, Stack, Typography, Avatar, Chip, Button, Divider,
    CircularProgress, Alert, useTheme, Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import LogoutIcon from "@mui/icons-material/Logout";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BoltIcon from "@mui/icons-material/Bolt";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import TimerIcon from "@mui/icons-material/Timer";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import TerminalIcon from "@mui/icons-material/Terminal";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import MailIcon from "@mui/icons-material/Email";
import BadgeIcon from "@mui/icons-material/Badge";
import { API_BASE } from "../../../shared/api/client";
import { authFetch } from "../../../shared/api/authFetch";
import { getAuthToken, setAuthToken } from "../../../shared/auth/AuthUtils";
import { getUserId, getUsername, getUserRole } from "../../../shared/auth/JwtUtils";
import { MODE, GAME, MODE_META, getHighLow } from "../../../shared/assessment/modes";
import {
    gradientText, initials, fmtTime, StatTile, InfoRow, PageBackdrop,
} from "../components/profileShared";

const GAME_META = {
    [GAME.SNIPER]:      { label: "Syntax Sniper",        icon: <GpsFixedIcon />,      color: "#C8456D" },
    [GAME.TRANSLATION]: { label: "Translation Terminal", icon: <TerminalIcon />,      color: "#E78AAC" },
    [GAME.FALLING]:     { label: "Falling Code",         icon: <CloudDownloadIcon />, color: "#FFC700" },
};

export default function StudentProfile() {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const navigate = useNavigate();

    const token = getAuthToken();
    const role = useMemo(() => { try { return token ? getUserRole(token) : null; } catch { return null; } }, [token]);
    const userId = useMemo(() => { try { return token ? getUserId(token) : null; } catch { return null; } }, [token]);
    const username = useMemo(() => { try { return token ? getUsername(token) : null; } catch { return null; } }, [token]);

    const [details, setDetails] = useState(null);
    const [stats, setStats] = useState(null);
    const [loadState, setLoadState] = useState("loading");

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (!userId) { setLoadState("error"); return; }
            try {
                const [d, s] = await Promise.all([
                    authFetch(`${API_BASE}/api/students/user/${userId}`),
                    authFetch(`${API_BASE}/api/user-statistics/user?userId=${userId}`),
                ]);
                if (cancelled) return;
                if (d.ok) setDetails(await d.json());
                if (s.ok) {
                    const body = await s.json();
                    setStats(body?.value ?? (body?.userId != null ? body : null));
                }
                setLoadState("ok");
            } catch {
                if (!cancelled) setLoadState("error");
            }
        };
        load();
        return () => { cancelled = true; };
    }, [userId]);

    const handleLogout = () => {
        setAuthToken(null);
        try { localStorage.removeItem("token"); } catch {}
        navigate("/login");
    };

    const assessmentRows = useMemo(() => Object.values(GAME).map((g) => {
        const pre = getHighLow(g, MODE.PRE_TEST);
        const practice = getHighLow(g, MODE.PRACTICE);
        const post = getHighLow(g, MODE.POST_TEST);
        const improvement = (pre.highest != null && post.highest != null) ? post.highest - pre.highest : null;
        return { game: g, meta: GAME_META[g], pre, practice, post, improvement };
    }), []);

    const displayName = useMemo(() => {
        if (!details) return username || "Player";
        const name = [details.firstName, details.lastName].filter(Boolean).join(" ").trim();
        return name || username || "Player";
    }, [details, username]);

    const courseLine = useMemo(() => {
        if (!details) return "Student";
        const parts = [details.course, details.section || details.className].filter(Boolean);
        return parts.length ? parts.join(" · ") : "Student";
    }, [details]);

    const email = details?.universityEmail || details?.email || details?.user?.email || "—";
    const hasNoAssessments = assessmentRows.every((r) => r.pre.count === 0 && r.practice.count === 0 && r.post.count === 0);

    return (
        <Box
            sx={{
                minHeight: "100vh", bgcolor: "background.default",
                py: 4, px: { xs: 2, md: 4 },
                position: "relative", overflow: "hidden",
            }}
        >
            <PageBackdrop isDark={isDark} />

            <Box sx={{ maxWidth: 1100, mx: "auto", position: "relative", zIndex: 1 }}>
                {loadState === "loading" && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                        <CircularProgress color="primary" />
                    </Box>
                )}

                {loadState === "error" && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        Couldn't load your profile. Try refreshing or signing in again.
                    </Alert>
                )}

                {loadState !== "loading" && (
                    <Stack spacing={3}>
                        {/* Hero — pink-leaning, gamer vibe */}
                        <Card>
                            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ md: "center" }}>
                                    <Avatar
                                        sx={{
                                            width: 96, height: 96,
                                            background: "linear-gradient(135deg, #C8456D 0%, #FFC700 100%)",
                                            color: "#fff", fontSize: 32, fontWeight: 700,
                                            border: "3px solid",
                                            borderColor: isDark ? "#FFC700" : "#1A1A2E",
                                        }}
                                    >
                                        {initials(displayName)}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Box
                                            component="span"
                                            sx={{
                                                display: "inline-block",
                                                px: 1.5, py: 0.5, mb: 1,
                                                borderRadius: 999,
                                                bgcolor: "rgba(200,69,109,0.12)",
                                                color: "primary.main",
                                                fontWeight: 700, fontSize: "0.75rem",
                                                letterSpacing: "0.6px",
                                                border: "1.5px solid",
                                                borderColor: "primary.main",
                                            }}
                                        >
                                            {role || "STUDENT"}
                                        </Box>
                                        <Typography variant="h3" sx={{ color: "text.primary", fontSize: { xs: "1.75rem", md: "2.25rem" } }}>
                                            <Box component="span" sx={gradientText}>{displayName}</Box>
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: "text.secondary", mt: 0.5 }}>
                                            {courseLine}
                                        </Typography>
                                        {username && username !== displayName && (
                                            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                                                @{username}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Stack spacing={1} sx={{ alignSelf: { md: "center" } }}>
                                        <Button
                                            variant="contained" color="primary"
                                            startIcon={<EmojiEventsIcon />}
                                            component={Link} to="/leaderboard"
                                        >
                                            Leaderboard
                                        </Button>
                                        <Button
                                            variant="outlined" color="primary"
                                            startIcon={<BoltIcon />}
                                            component={Link} to="/my-stats"
                                        >
                                            My stats
                                        </Button>
                                        <Button variant="text" color="error" startIcon={<LogoutIcon />} onClick={handleLogout}>
                                            Log out
                                        </Button>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Typing stats tiles */}
                        <Box
                            sx={{
                                display: "grid", gap: 2,
                                gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                            }}
                        >
                            <StatTile label="WPM"        value={stats?.wordsPerMinute ?? 0}  icon={<BoltIcon />}              accent="#C8456D" />
                            <StatTile label="Accuracy"   value={`${stats?.accuracy ?? 0}%`}  icon={<CenterFocusStrongIcon />} accent="#FFC700" />
                            <StatTile label="Tests done" value={stats?.totalTestsTaken ?? 0} icon={<EmojiEventsIcon />}       accent="#E78AAC" />
                            <StatTile label="Time spent" value={fmtTime(stats?.totalTimeSpent)} icon={<TimerIcon />}          accent="#9C5BE3" />
                        </Box>

                        {/* Assessment history */}
                        <Card>
                            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                    <Box>
                                        <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 2 }}>
                                            Assessment progress
                                        </Typography>
                                        <Typography variant="h5" sx={{ color: "text.primary" }}>
                                            Pre-Test → Practice → <Box component="span" sx={gradientText}>Post-Test</Box>
                                        </Typography>
                                    </Box>
                                </Stack>

                                {hasNoAssessments ? (
                                    <Box sx={{ textAlign: "center", py: 4 }}>
                                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                                            No assessment runs yet — finish a Pre-Test or Practice round and your scores will appear here.
                                        </Typography>
                                        <Button variant="contained" color="primary" component={Link} to="/dashboard">
                                            Pick a game
                                        </Button>
                                    </Box>
                                ) : (
                                    <Stack spacing={1.5} divider={<Divider sx={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />}>
                                        {assessmentRows.map((row) => (
                                            <AssessmentRow key={row.game} row={row} />
                                        ))}
                                    </Stack>
                                )}
                            </CardContent>
                        </Card>

                        {/* Account info */}
                        <Card>
                            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                                <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 2 }}>
                                    Account
                                </Typography>
                                <Typography variant="h5" sx={{ color: "text.primary", mb: 2 }}>
                                    Your details
                                </Typography>

                                <Stack spacing={1.5}>
                                    <InfoRow icon={<BadgeIcon />}  label="Username"    value={username || "—"} />
                                    <InfoRow icon={<MailIcon />}   label="Email"       value={email} />
                                    <InfoRow icon={<SchoolIcon />} label="Course"      value={details?.course || "—"} />
                                    <InfoRow icon={<GroupsIcon />} label="Section"     value={details?.section || details?.className || "—"} />
                                    {details?.studentId != null && (
                                        <InfoRow icon={<BadgeIcon />} label="Student ID" value={String(details.studentId)} />
                                    )}
                                </Stack>

                                <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
                                    <Tooltip title="Editing isn't wired up yet — coming soon.">
                                        <span>
                                            <Button variant="outlined" color="primary" startIcon={<EditIcon />} disabled>
                                                Edit profile
                                            </Button>
                                        </span>
                                    </Tooltip>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                )}
            </Box>
        </Box>
    );
}

function AssessmentRow({ row }) {
    const { meta, pre, practice, post, improvement } = row;
    const hasAny = pre.count > 0 || practice.count > 0 || post.count > 0;
    return (
        <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2} alignItems={{ md: "center" }}
            justifyContent="space-between"
            sx={{ py: 1 }}
        >
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: { md: 220 } }}>
                <Box
                    sx={{
                        width: 36, height: 36, borderRadius: 1,
                        bgcolor: `${meta.color}22`, color: meta.color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "1.5px solid", borderColor: meta.color,
                    }}
                >
                    {meta.icon}
                </Box>
                <Box>
                    <Typography sx={{ fontWeight: 700, color: "text.primary" }}>{meta.label}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {hasAny ? `${pre.count + practice.count + post.count} attempts logged` : "Not started"}
                    </Typography>
                </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
                <ScorePill meta={MODE_META[MODE.PRE_TEST]}  value={pre.highest} />
                <ScorePill meta={MODE_META[MODE.PRACTICE]} value={practice.highest} subtitle={practice.count ? `${practice.count}×` : null} />
                <ScorePill meta={MODE_META[MODE.POST_TEST]} value={post.highest} />
            </Stack>

            <Box sx={{ minWidth: { md: 110 }, textAlign: { md: "right" } }}>
                {improvement != null ? (
                    <Chip
                        size="small"
                        label={`${improvement >= 0 ? "+" : ""}${improvement}`}
                        sx={{
                            bgcolor: improvement > 0 ? "rgba(62,207,106,0.15)" : improvement < 0 ? "rgba(239,68,68,0.15)" : "rgba(0,0,0,0.06)",
                            color: improvement > 0 ? "#3ECF6A" : improvement < 0 ? "#EF4444" : "text.secondary",
                            fontWeight: 700,
                            border: "1.5px solid",
                            borderColor: improvement > 0 ? "#3ECF6A" : improvement < 0 ? "#EF4444" : "transparent",
                        }}
                    />
                ) : (
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Δ —</Typography>
                )}
            </Box>
        </Stack>
    );
}

function ScorePill({ meta, value, subtitle }) {
    return (
        <Box
            sx={{
                px: 1.25, py: 0.5,
                borderRadius: 1,
                bgcolor: `${meta.color}1A`,
                border: "1.5px solid",
                borderColor: meta.color,
                minWidth: 88,
                textAlign: "center",
            }}
        >
            <Typography variant="caption" sx={{ color: meta.color, fontWeight: 700, display: "block", letterSpacing: "0.5px" }}>
                {meta.short.toUpperCase()}
            </Typography>
            <Typography
                sx={{
                    color: "text.primary", fontWeight: 700,
                    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {value != null ? value : "—"}
            </Typography>
            {subtitle && (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{subtitle}</Typography>
            )}
        </Box>
    );
}
