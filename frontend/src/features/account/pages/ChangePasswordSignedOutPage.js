// Change password from the login page, for someone who knows their current
// password but isn't signed in. On success it returns to the login page with the
// email filled in, so the first sign-in with the new password confirms it.

import React, { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Box, Card, CardContent, Typography, TextField, Button, Alert, Stack, useTheme,
} from "@mui/material";
import LockReset from "@mui/icons-material/LockReset";
import { PageBackdrop } from "../../profile/components/profileShared";
import { PasswordField, PasswordRules } from "../components/PasswordFields";
import { checkNewPassword, changePasswordBeforeLogin } from "../data/passwordChange";

export default function ChangePasswordSignedOutPage() {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const currentRef = useRef(null);

    const checks = useMemo(() => checkNewPassword({ current, next, confirm }), [current, next, confirm]);
    const canSubmit = email.trim() !== "" && checks.valid && !submitting;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        setError("");
        const result = await changePasswordBeforeLogin(email.trim(), current, next);
        setSubmitting(false);
        if (result.ok) {
            navigate("/login", {
                replace: true,
                state: { email: email.trim(), notice: "Password changed. Sign in with your new password." },
            });
            return;
        }
        setError(result.message);
        if (result.status === 401) {
            setCurrent("");
            currentRef.current?.focus();
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh", bgcolor: "background.default",
                display: "flex", alignItems: "center", justifyContent: "center",
                py: 6, px: 2, position: "relative", overflow: "hidden",
            }}
        >
            <PageBackdrop isDark={isDark} />

            <Card sx={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
                <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
                    <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 2 }}>
                        Account
                    </Typography>
                    <Typography variant="h4" component="h1" sx={{ color: "text.primary", mb: 1 }}>
                        Change password
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                        Know your current password? Change it here. You'll sign in with the new one
                        after, and you'll be signed out on your other devices.
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <Stack spacing={2}>
                            <TextField
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="username"
                                autoFocus
                                fullWidth
                                required
                            />
                            <PasswordField
                                label="Current password"
                                value={current}
                                onChange={setCurrent}
                                autoComplete="current-password"
                                inputRef={currentRef}
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

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            startIcon={<LockReset />}
                            disabled={!canSubmit}
                            sx={{ mt: 4, py: 1.5, textTransform: "none" }}
                        >
                            {submitting ? "Changing…" : "Change password"}
                        </Button>
                    </Box>

                    <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", mt: 3 }}>
                        <Box
                            component={Link}
                            to="/login"
                            sx={{ color: "primary.main", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                        >
                            ← Back to sign in
                        </Box>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
