import React from "react";
import {
    Box, Card, CardContent, Stack, Typography, Button, Chip, Tooltip, Divider,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
    MODE, MODE_META, attemptsRemaining, getAttempts, getHighLow, isModeLocked, resetMode,
} from "./modes";
import { getAuthToken } from "../auth/AuthUtils";
import { getUserRole } from "../auth/JwtUtils";

// Only staff can clear a student's Pre/Post attempts. Students who burned
// through their tries have to ask a teacher to reset them — there is no
// self-serve reset path.
const canResetAttempts = () => {
    try {
        const token = getAuthToken();
        if (!token) return false;
        const role = getUserRole(token);
        return role === "TEACHER" || role === "ADMIN";
    } catch {
        return false;
    }
};

// Reusable Pre-Test / Practice / Post-Test picker. `game` is a stable string
// key (see GAME constants in modes.js). `onPick(mode)` fires once the student
// commits to a mode that still has attempts left.
export default function ModePickerCard({ game, onPick, title = "Choose your mode", subtitle }) {
    const showReset = canResetAttempts();
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 0.5 }}>{title}</Typography>
                {subtitle && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {subtitle}
                    </Typography>
                )}
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
                    {Object.values(MODE).map((m) => {
                        const meta = MODE_META[m];
                        const remaining = attemptsRemaining(game, m);
                        const attempts = getAttempts(game, m);
                        const stats = getHighLow(game, m);
                        const locked = isModeLocked(game, m); // Post-Test before Pre-Test
                        const blocked = locked || remaining === 0;
                        const limitText = locked
                            ? "Take the Pre-Test first"
                            : meta.attemptLimit === Infinity
                                ? "Unlimited attempts"
                                : `${remaining} / ${meta.attemptLimit} attempts left`;
                        return (
                            <Card
                                key={m}
                                variant="outlined"
                                sx={{
                                    flex: 1,
                                    borderColor: meta.color,
                                    borderWidth: 2,
                                    opacity: blocked ? 0.55 : 1,
                                    transition: "transform 120ms, box-shadow 120ms",
                                    "&:hover": blocked ? {} : {
                                        transform: "translateY(-3px)",
                                        boxShadow: `0 8px 24px ${meta.color}33`,
                                    },
                                }}
                            >
                                <CardContent>
                                    {meta.iconSrc ? (
                                        <Box
                                            component="img"
                                            src={meta.iconSrc}
                                            alt={`${meta.label} icon`}
                                            sx={{
                                                display: "block",
                                                mx: "auto",
                                                width: 64,
                                                height: 64,
                                                imageRendering: "pixelated",
                                                objectFit: "contain",
                                            }}
                                        />
                                    ) : (
                                        <Typography sx={{ fontSize: 38, textAlign: "center", lineHeight: 1 }}>
                                            {meta.icon}
                                        </Typography>
                                    )}
                                    <Typography
                                        variant="h6"
                                        sx={{ color: meta.color, textAlign: "center", fontWeight: 700, mt: 1 }}
                                    >
                                        {meta.label}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ textAlign: "center", minHeight: 60, mt: 1 }}
                                    >
                                        {meta.description}
                                    </Typography>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Stack spacing={0.75} sx={{ minHeight: 56 }}>
                                        <Chip
                                            size="small"
                                            label={limitText}
                                            icon={blocked ? <LockIcon sx={{ fontSize: 14 }} /> : undefined}
                                            color={
                                                meta.attemptLimit === Infinity
                                                    ? "success"
                                                    : blocked
                                                        ? "default"
                                                        : "warning"
                                            }
                                            variant="outlined"
                                        />
                                        {stats.count > 0 && (
                                            <Stack direction="row" spacing={0.75}>
                                                <Chip
                                                    size="small"
                                                    label={`Best ${stats.highest}`}
                                                    icon={<EmojiEventsIcon sx={{ fontSize: 14, color: "#FFC700 !important" }} />}
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    size="small"
                                                    label={`Low ${stats.lowest}`}
                                                    variant="outlined"
                                                />
                                            </Stack>
                                        )}
                                    </Stack>

                                    <Button
                                        fullWidth
                                        variant="contained"
                                        disabled={blocked}
                                        onClick={() => onPick(m)}
                                        sx={{
                                            mt: 1.5,
                                            bgcolor: meta.color,
                                            color: meta.key === MODE.POST_TEST ? "#000" : "#fff",
                                            "&:hover": { bgcolor: meta.color, opacity: 0.9 },
                                        }}
                                    >
                                        {locked ? "Pre-Test required" : blocked ? "Limit reached" : "Start"}
                                    </Button>

                                    {showReset && attempts > 0 && meta.attemptLimit !== Infinity && (
                                        <Tooltip title="Teacher override — clears this mode's attempt counter and stored scores for the student signed in on this device.">
                                            <Button
                                                size="small"
                                                fullWidth
                                                startIcon={<RestartAltIcon sx={{ fontSize: 14 }} />}
                                                sx={{
                                                    mt: 0.75,
                                                    fontSize: 11,
                                                    color: "text.secondary",
                                                    border: "1px dashed",
                                                    borderColor: "divider",
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const ok = window.confirm(
                                                        `Reset ${meta.label} attempts for the student signed in on this device? This wipes the attempt counter and stored scores for this mode.`
                                                    );
                                                    if (!ok) return;
                                                    resetMode(game, m);
                                                    window.location.reload();
                                                }}
                                            >
                                                Reset attempts (teacher)
                                            </Button>
                                        </Tooltip>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </Stack>

                <Box sx={{ mt: 2, p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        <strong>How this works:</strong> Take the <em>Pre-Test</em> first to set a
                        baseline, then drill in <em>Practice</em>, and finish with the <em>Post-Test
                        (Final)</em> when you're ready to be graded. Practice and Test use different
                        question banks — you won't see the same items twice.
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
}
