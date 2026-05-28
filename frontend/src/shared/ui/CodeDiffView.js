import React, { useMemo } from "react";
import { Box, Typography, Stack, Chip, useTheme } from "@mui/material";
import { diffLines, tokensEqual } from "../utils/codeCompare";

/**
 * Side-by-side diff view (SDD §3.1.4 M3). Lines that match are dimmed; lines
 * present only on one side are highlighted. Pair with codeCompare.tokensEqual
 * for a whitespace-normalising boolean verdict.
 */
export default function CodeDiffView({ expected, actual, opts }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const rows = useMemo(() => diffLines(expected, actual), [expected, actual]);
    const equivalent = useMemo(() => tokensEqual(expected, actual, opts), [expected, actual, opts]);

    const palette = {
        equal: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        equalText: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)",
        delete: isDark ? "rgba(220,80,80,0.18)" : "rgba(220,80,80,0.12)",
        insert: isDark ? "rgba(120,200,120,0.18)" : "rgba(80,160,80,0.12)",
        delText: "#ff6b6b",
        insText: "#3ecf6a",
        gutter: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
    };

    const cell = (text, kind, side) => {
        const bg =
            kind === "equal" ? palette.equal
                : side === "left" && kind === "delete" ? palette.delete
                    : side === "right" && kind === "insert" ? palette.insert
                        : "transparent";
        const color =
            kind === "equal" ? palette.equalText
                : side === "left" && kind === "delete" ? palette.delText
                    : side === "right" && kind === "insert" ? palette.insText
                        : "inherit";
        return (
            <Box
                sx={{
                    flex: 1,
                    px: 1.5,
                    py: 0.5,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    bgcolor: bg,
                    color,
                    whiteSpace: "pre",
                    overflowX: "auto",
                }}
            >
                {text ?? " "}
            </Box>
        );
    };

    return (
        <Box>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2">Comparison</Typography>
                <Chip
                    size="small"
                    label={equivalent ? "Tokens match" : "Tokens differ"}
                    color={equivalent ? "success" : "warning"}
                    variant="outlined"
                />
            </Stack>

            <Box
                sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    overflow: "hidden",
                }}
            >
                <Stack direction="row" sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
                    <Box sx={{ flex: 1, px: 1.5, py: 0.5, fontWeight: 700, fontSize: 12 }}>Expected</Box>
                    <Box sx={{ flex: 1, px: 1.5, py: 0.5, fontWeight: 700, fontSize: 12 }}>Yours</Box>
                </Stack>
                {rows.map((row, idx) => (
                    <Stack key={idx} direction="row" sx={{ borderBottom: idx === rows.length - 1 ? 0 : "1px solid", borderColor: "divider" }}>
                        {cell(row.left, row.kind, "left")}
                        {cell(row.right, row.kind, "right")}
                    </Stack>
                ))}
            </Box>
        </Box>
    );
}
