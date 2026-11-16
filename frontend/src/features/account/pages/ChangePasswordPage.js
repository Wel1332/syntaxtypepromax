// Change password — one page for every role, reached from the Account card on
// the profile and from the sidebar. The rules live in ../data/passwordChange so
// they can be unit-tested; Jest 27 cannot load a page that imports react-router.

import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Box, Card, CardContent, Typography, Button, Alert, Stack, useTheme } from "@mui/material";
import LockReset from "@mui/icons-material/LockReset";
import { PageBackdrop } from "../../profile/components/profileShared";
import { PasswordField, PasswordRules } from "../components/PasswordFields";
import { checkNewPassword, changeOwnPassword } from "../data/passwordChange";

export default function ChangePasswordPage() {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);
    const currentRef = useRef(null);

    const checks = useMemo(() => checkNewPassword({ current, next, confirm }), [current, next, confirm]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!checks.valid || submitting) return;
        setSubmitting(true);
        setError("");
        const result = await changeOwnPassword(current, next);
        setSubmitting(false);
        if (result.ok) {
            setDone(true);
            setCurrent("");
            setNext("");
            setConfirm("");
            return;
        }
        setError(result.message);
        // Client-side rules already passed, so a 400 here means the current
        // password was wrong: clear it and put the cursor back for a retry.
        if (result.status === 400) {
            setCurrent("");
            currentRef.current?.focus();
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh", bgcolor: "background.default",
                py: 4, px: { xs: 2, md: 4 },
                position: "relative", overflow: "hidden",
            }}
        >
            <PageBackdrop isDark={isDark} />

            <Box sx={{ maxWidth: 520, mx: "auto", position: "relative", zIndex: 1 }}>
                <Card>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 2 }}>
                            Account
                        </Typography>
                        <Typography variant="h4" component="h1" sx={{ color: "text.primary", mb: 1 }}>
                            Change password
                        </Typography>

                        {done ? (
                            <Stack spacing={3} sx={{ mt: 2 }}>
                                <Alert severity="success">
                                    Password changed. You've been signed out on your other devices.
                                </Alert>
                                <Button component={Link} to="/profile" variant="contained" sx={{ alignSelf: "flex-start", textTransform: "none" }}>
                                    Back to profile
                                </Button>
                            </Stack>
                        ) : (
                            <Box component="form" onSubmit={handleSubmit} noValidate>
                                <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                                    Changing your password signs you out on your other devices.
                                </Typography>

                                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                                <Stack spacing={2}>
                                    <PasswordField
                                        label="Current password"
                                        value={current}
                                        onChange={setCurrent}
                                        autoComplete="current-password"
                                        inputRef={currentRef}
                                        autoFocus
                                    />
                                    <PasswordField
                                        label="New password"
                                        value={next}
                                        onChange={setNext}
                                        autoComplete="new-password"
                                    />
                                    <PasswordField
                                        label="Confirm new password"
                                        value={confirm}
                                        onChange={setConfirm}
                                        autoComplete="new-password"
                                    />
                                </Stack>

                                <PasswordRules checks={checks} />

                                <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 4 }}>
                                    <Button component={Link} to="/profile" sx={{ textTransform: "none" }}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        startIcon={<LockReset />}
                                        disabled={!checks.valid || submitting}
                                        sx={{ textTransform: "none" }}
                                    >
                                        {submitting ? "Changing…" : "Change password"}
                                    </Button>
                                </Stack>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}
