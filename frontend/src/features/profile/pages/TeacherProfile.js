import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Box, Card, CardContent, Stack, Typography, Avatar, Chip, Button, Divider,
    CircularProgress, Alert, useTheme, Tooltip, LinearProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import LogoutIcon from "@mui/icons-material/Logout";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import BoltIcon from "@mui/icons-material/Bolt";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import InsightsIcon from "@mui/icons-material/Insights";
import EditNoteIcon from "@mui/icons-material/EditNote";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MailIcon from "@mui/icons-material/Email";
import BadgeIcon from "@mui/icons-material/Badge";
import WorkIcon from "@mui/icons-material/Work";
import VerifiedIcon from "@mui/icons-material/Verified";
import { API_BASE } from "../../../shared/api/client";
import { authFetch } from "../../../shared/api/authFetch";
import { getAuthToken, setAuthToken } from "../../../shared/auth/AuthUtils";
import { getUserId, getUsername, getUserRole } from "../../../shared/auth/JwtUtils";
import {
    goldGradientText, initials, StatTile, InfoRow, PageBackdrop,
} from "../components/profileShared";

const QUICK_ACTIONS = [
    { label: "Create lesson",   to: "/lesson",       icon: <EditNoteIcon />,     color: "#C8456D", desc: "Author a new C programming lesson for your class." },
    { label: "New challenge",   to: "/challenges",   icon: <GpsFixedIcon />,     color: "#FFC700", desc: "Build a coding challenge students can attempt." },
    { label: "Class roster",    to: "/teacher/class", icon: <GroupsIcon />,      color: "#E78AAC", desc: "See every student's stats, sort and filter." },
    { label: "Instructor hub",  to: "/instructor",   icon: <RocketLaunchIcon />, color: "#9C5BE3", desc: "Review submissions and class progress." },
];

const fullName = (s) =>
    [s.firstName, s.lastName].filter(Boolean).join(" ").trim() ||
    s.user?.username ||
    s.universityEmail ||
    `Student #${s.studentId}`;

export default function TeacherProfile() {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const navigate = useNavigate();

    const token = getAuthToken();
    const role = useMemo(() => { try { return token ? getUserRole(token) : null; } catch { return null; } }, [token]);
    const userId = useMemo(() => { try { return token ? getUserId(token) : null; } catch { return null; } }, [token]);
    const username = useMemo(() => { try { return token ? getUsername(token) : null; } catch { return null; } }, [token]);

    const [details, setDetails] = useState(null);
    const [students, setStudents] = useState([]);
    const [statsByUserId, setStatsByUserId] = useState({});
    const [loadState, setLoadState] = useState("loading");

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (!userId) { setLoadState("error"); return; }
            try {
                const [detailsRes, rosterRes] = await Promise.all([
                    authFetch(`${API_BASE}/api/teachers/user/${userId}`),
                    authFetch(`${API_BASE}/api/students`),
                ]);
                if (cancelled) return;

                if (detailsRes.ok) setDetails(await detailsRes.json());

                if (rosterRes.ok) {
                    const list = await rosterRes.json();
                    const roster = Array.isArray(list) ? list : [];
                    setStudents(roster);

                    // Fetch per-student stats in parallel. Bail out gracefully
                    // if any single request fails — we still want the profile
                    // to render even with partial class data.
                    const uids = roster.map((s) => s.user?.userId).filter((id) => id != null);
                    const entries = await Promise.all(
                        uids.map(async (uid) => {
                            try {
                                const r = await authFetch(`${API_BASE}/api/user-statistics/user?userId=${uid}`);
                                if (!r.ok) return [uid, null];
                                const body = await r.json();
                                return [uid, body?.value ?? (body?.userId != null ? body : null)];
                            } catch {
                                return [uid, null];
                            }
                        })
                    );
                    if (cancelled) return;
                    const map = {};
                    entries.forEach(([uid, s]) => { if (s) map[uid] = s; });
                    setStatsByUserId(map);
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

    // Class summary — averages computed only over students who actually have
    // stats so a roster of inactive students doesn't drag the averages to 0.
    const classSummary = useMemo(() => {
        const rows = students.map((s) => {
            const uid = s.user?.userId;
            const stat = uid != null ? statsByUserId[uid] : null;
            return {
                studentId: s.studentId,
                userId: uid,
                name: fullName(s),
                course: s.course || "—",
                section: [s.className, s.section].filter(Boolean).join(" · ") || "—",
                wpm: stat?.wordsPerMinute ?? 0,
                accuracy: stat?.accuracy ?? 0,
                tests: stat?.totalTestsTaken ?? 0,
                hasStats: !!stat,
            };
        });
        const active = rows.filter((r) => r.hasStats);
        const avg = (key) => active.length
            ? Math.round(active.reduce((acc, r) => acc + (r[key] || 0), 0) / active.length)
            : 0;
        const topByWpm = [...rows].sort((a, b) => b.wpm - a.wpm).slice(0, 5);
        return {
            totalStudents: rows.length,
            activeStudents: active.length,
            avgWpm: avg("wpm"),
            avgAccuracy: avg("accuracy"),
            totalTests: active.reduce((acc, r) => acc + (r.tests || 0), 0),
            topByWpm,
        };
    }, [students, statsByUserId]);

    const displayName = useMemo(() => {
        if (!details) return username || "Educator";
        const name = [details.firstName, details.lastName].filter(Boolean).join(" ").trim();
        return name || username || "Educator";
    }, [details, username]);

    const subTitle = useMemo(() => {
        if (!details) return role || "Teacher";
        const parts = [details.department, details.position].filter(Boolean);
        return parts.length ? parts.join(" · ") : (role || "Teacher");
    }, [details, role]);

    const email = details?.universityEmail || details?.email || details?.user?.email || "—";

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
                        {/* Hero — gold-leaning, "Educator" badge with verified mark */}
                        <Card
                            sx={{
                                position: "relative", overflow: "hidden",
                                "&::before": {
                                    content: '""', position: "absolute",
                                    inset: 0,
                                    background: "linear-gradient(135deg, rgba(255,199,0,0.08) 0%, transparent 60%)",
                                    pointerEvents: "none",
                                },
                            }}
                        >
                            <CardContent sx={{ p: { xs: 3, md: 4 }, position: "relative" }}>
                                <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ md: "center" }}>
                                    <Box sx={{ position: "relative" }}>
                                        <Avatar
                                            sx={{
                                                width: 104, height: 104,
                                                background: "linear-gradient(135deg, #FFC700 0%, #1A1A2E 100%)",
                                                color: "#fff", fontSize: 34, fontWeight: 700,
                                                border: "3px solid",
                                                borderColor: "#FFC700",
                                                boxShadow: "0 6px 20px rgba(255,199,0,0.4)",
                                            }}
                                        >
                                            {initials(displayName)}
                                        </Avatar>
                                        <VerifiedIcon
                                            sx={{
                                                position: "absolute", right: -4, bottom: -4,
                                                color: "#FFC700", bgcolor: "background.paper",
                                                borderRadius: "50%", fontSize: 30,
                                                border: "2px solid", borderColor: "background.default",
                                            }}
                                        />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                            <Box
                                                component="span"
                                                sx={{
                                                    display: "inline-block",
                                                    px: 1.5, py: 0.5,
                                                    borderRadius: 999,
                                                    bgcolor: "rgba(255,199,0,0.15)",
                                                    color: "#FFC700",
                                                    fontWeight: 700, fontSize: "0.75rem",
                                                    letterSpacing: "0.6px",
                                                    border: "1.5px solid",
                                                    borderColor: "#FFC700",
                                                }}
                                            >
                                                {role === "ADMIN" ? "ADMIN" : "EDUCATOR"}
                                            </Box>
                                            {classSummary.totalStudents > 0 && (
                                                <Chip
                                                    size="small"
                                                    icon={<GroupsIcon sx={{ fontSize: 14 }} />}
                                                    label={`${classSummary.totalStudents} students`}
                                                    sx={{ fontWeight: 700, borderColor: "primary.main", color: "primary.main" }}
                                                    variant="outlined"
                                                />
                                            )}
                                        </Stack>
                                        <Typography variant="h3" sx={{ color: "text.primary", fontSize: { xs: "1.75rem", md: "2.25rem" } }}>
                                            <Box component="span" sx={goldGradientText}>{displayName}</Box>
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: "text.secondary", mt: 0.5 }}>
                                            {subTitle}
                                        </Typography>
                                        {username && username !== displayName && (
                                            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                                                @{username}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Stack spacing={1} sx={{ alignSelf: { md: "center" } }}>
                                        <Button
                                            variant="contained"
                                            startIcon={<GroupsIcon />}
                                            component={Link} to="/teacher/class"
                                            sx={{
                                                bgcolor: "#FFC700", color: "#1A1A2E",
                                                "&:hover": { bgcolor: "#FFB300" },
                                            }}
                                        >
                                            Open class
                                        </Button>
                                        <Button
                                            variant="outlined" color="primary"
                                            startIcon={<InsightsIcon />}
                                            component={Link} to="/instructor"
                                        >
                                            Instructor hub
                                        </Button>
                                        <Button variant="text" color="error" startIcon={<LogoutIcon />} onClick={handleLogout}>
                                            Log out
                                        </Button>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Class-level stat tiles */}
                        <Box
                            sx={{
                                display: "grid", gap: 2,
                                gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                            }}
                        >
                            <StatTile label="My students"     value={classSummary.totalStudents}             icon={<GroupsIcon />}            accent="#C8456D" />
                            <StatTile label="Active"          value={classSummary.activeStudents}            icon={<CenterFocusStrongIcon />} accent="#FFC700" />
                            <StatTile label="Class avg WPM"   value={classSummary.avgWpm}                    icon={<BoltIcon />}              accent="#E78AAC" />
                            <StatTile label="Class avg acc"   value={`${classSummary.avgAccuracy}%`}         icon={<InsightsIcon />}          accent="#9C5BE3" />
                        </Box>

                        {/* Quick actions — distinct from student layout: action-first */}
                        <Card>
                            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                                <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 2 }}>
                                    Quick actions
                                </Typography>
                                <Typography variant="h5" sx={{ color: "text.primary", mb: 2 }}>
                                    Run your <Box component="span" sx={goldGradientText}>class</Box>
                                </Typography>
                                <Box
                                    sx={{
                                        display: "grid", gap: 2,
                                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                                    }}
                                >
                                    {QUICK_ACTIONS.map((a) => (
                                        <Card
                                            key={a.label}
                                            variant="outlined"
                                            onClick={() => navigate(a.to)}
                                            sx={{
                                                cursor: "pointer",
                                                borderColor: a.color,
                                                transition: "transform 120ms, box-shadow 120ms",
                                                "&:hover": {
                                                    transform: "translateY(-3px)",
                                                    boxShadow: `0 6px 20px ${a.color}44`,
                                                },
                                            }}
                                        >
                                            <CardContent>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Box
                                                        sx={{
                                                            width: 44, height: 44, borderRadius: 1,
                                                            bgcolor: `${a.color}22`, color: a.color,
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            border: "1.5px solid", borderColor: a.color,
                                                        }}
                                                    >
                                                        {a.icon}
                                                    </Box>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography sx={{ fontWeight: 700, color: "text.primary" }}>{a.label}</Typography>
                                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>{a.desc}</Typography>
                                                    </Box>
                                                    <ArrowForwardIcon sx={{ color: a.color }} />
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Top students snapshot */}
                        <Card>
                            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                    <Box>
                                        <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 2 }}>
                                            Top performers
                                        </Typography>
                                        <Typography variant="h5" sx={{ color: "text.primary" }}>
                                            Fastest in <Box component="span" sx={goldGradientText}>your class</Box>
                                        </Typography>
                                    </Box>
                                    <Button
                                        component={Link}
                                        to="/teacher/class"
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{ display: { xs: "none", sm: "inline-flex" } }}
                                    >
                                        Full roster
                                    </Button>
                                </Stack>

                                {classSummary.topByWpm.length === 0 ? (
                                    <Box sx={{ textAlign: "center", py: 4 }}>
                                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                            No students enrolled yet. Once students sign up under your section, they'll show up here.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Stack spacing={1.25} divider={<Divider sx={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />}>
                                        {classSummary.topByWpm.map((s, i) => (
                                            <Stack
                                                key={s.studentId}
                                                direction="row"
                                                alignItems="center"
                                                spacing={2}
                                                sx={{ py: 1 }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 32, height: 32, borderRadius: "50%",
                                                        bgcolor: i === 0 ? "#FFC700" : i === 1 ? "#E78AAC" : i === 2 ? "#C8456D" : "rgba(127,127,127,0.15)",
                                                        color: i < 3 ? "#1A1A2E" : "text.secondary",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        fontWeight: 700, fontSize: 14,
                                                    }}
                                                >
                                                    {i + 1}
                                                </Box>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography sx={{ fontWeight: 700, color: "text.primary", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                        {s.name}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                        {s.section} · {s.tests} tests
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ minWidth: 100 }}>
                                                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
                                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>WPM</Typography>
                                                        <Typography variant="caption" sx={{ color: "text.primary", fontWeight: 700, fontFamily: 'Roboto, sans-serif' }}>{s.wpm}</Typography>
                                                    </Stack>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={Math.min(100, s.wpm)}
                                                        sx={{ height: 5, borderRadius: 3, "& .MuiLinearProgress-bar": { bgcolor: "#FFC700" } }}
                                                    />
                                                </Box>
                                                <Chip
                                                    size="small"
                                                    label={`${s.accuracy}%`}
                                                    sx={{
                                                        fontWeight: 700,
                                                        bgcolor: s.accuracy >= 90 ? "rgba(62,207,106,0.15)" : "rgba(0,0,0,0.06)",
                                                        color: s.accuracy >= 90 ? "#3ECF6A" : "text.secondary",
                                                    }}
                                                />
                                            </Stack>
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
                                    Educator details
                                </Typography>

                                <Box
                                    sx={{
                                        display: "grid", gap: 2,
                                        gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                                    }}
                                >
                                    <InfoRow icon={<BadgeIcon />}   label="Username"   value={username || "—"} />
                                    <InfoRow icon={<MailIcon />}    label="Email"      value={email} />
                                    <InfoRow icon={<SchoolIcon />}  label="Department" value={details?.department || "—"} />
                                    <InfoRow icon={<WorkIcon />}    label="Position"   value={details?.position || "—"} />
                                </Box>

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
