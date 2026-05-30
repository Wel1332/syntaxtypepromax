// Bits shared between StudentProfile and TeacherProfile so neither file has to
// re-derive avatar styling, time formatting, or info-row layout.

import React from "react";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

export const gradientText = {
    background: "linear-gradient(90deg, #C8456D 0%, #E78AAC 50%, #FFC700 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    display: "inline-block",
};

export const goldGradientText = {
    background: "linear-gradient(90deg, #FFC700 0%, #FFB300 50%, #C8456D 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    display: "inline-block",
};

export const initials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const fmtTime = (seconds) => {
    if (seconds == null) return "—";
    const s = Number(seconds) || 0;
    if (s < 60) return `${Math.round(s)}s`;
    if (s < 3600) return `${Math.round(s / 60)}m`;
    return `${Math.round(s / 3600)}h`;
};

export function StatTile({ label, value, icon, accent }) {
    return (
        <Card>
            <CardContent sx={{ textAlign: "center", py: 2.5 }}>
                <Box
                    sx={{
                        width: 40, height: 40, mx: "auto", mb: 1, borderRadius: "50%",
                        bgcolor: `${accent}22`, color: accent,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "1.5px solid", borderColor: accent,
                    }}
                >
                    {icon}
                </Box>
                <Typography
                    variant="h3"
                    sx={{
                        color: "text.primary",
                        fontSize: { xs: "1.5rem", md: "2rem" },
                        lineHeight: 1,
                        fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {value}
                </Typography>
                <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700, mt: 1, display: "block" }}>
                    {label}
                </Typography>
            </CardContent>
        </Card>
    );
}

export function InfoRow({ icon, label, value }) {
    return (
        <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
            <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", letterSpacing: "0.5px" }}>
                    {label.toUpperCase()}
                </Typography>
                <Typography sx={{ color: "text.primary", fontWeight: 600 }}>{value}</Typography>
            </Box>
        </Stack>
    );
}

// Big radial pink/gold blobs in the corners — every profile page uses the same
// backdrop so they sit in the same brand world as the dashboards.
export function PageBackdrop({ isDark }) {
    return (
        <>
            <Box
                sx={{
                    position: "absolute",
                    top: -120, left: -120, width: 360, height: 360, borderRadius: "50%",
                    background: "radial-gradient(circle, #C8456D 0%, transparent 70%)",
                    opacity: isDark ? 0.18 : 0.10, filter: "blur(28px)", pointerEvents: "none",
                }}
            />
            <Box
                sx={{
                    position: "absolute",
                    bottom: -150, right: -150, width: 420, height: 420, borderRadius: "50%",
                    background: "radial-gradient(circle, #FFC700 0%, transparent 70%)",
                    opacity: isDark ? 0.15 : 0.10, filter: "blur(32px)", pointerEvents: "none",
                }}
            />
        </>
    );
}
