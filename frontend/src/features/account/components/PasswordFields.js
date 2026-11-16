// Form pieces shared by the signed-in and signed-out change-password pages.

import React, { useState } from "react";
import { Stack, TextField, Typography, InputAdornment, IconButton } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CheckCircle from "@mui/icons-material/CheckCircle";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import { MIN_LENGTH } from "../data/passwordChange";

export function PasswordField({ label, value, onChange, autoComplete, inputRef, autoFocus }) {
    const [visible, setVisible] = useState(false);
    return (
        <TextField
            label={label}
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete={autoComplete}
            inputRef={inputRef}
            autoFocus={autoFocus}
            fullWidth
            required
            slotProps={{
                input: {
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={() => setVisible((v) => !v)}
                                edge="end"
                                aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                            >
                                {visible ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
}

function Rule({ met, children }) {
    return (
        <Stack direction="row" spacing={1} alignItems="center">
            {met
                ? <CheckCircle fontSize="small" sx={{ color: "success.main" }} />
                : <RadioButtonUnchecked fontSize="small" sx={{ color: "text.disabled" }} />}
            <Typography variant="body2" sx={{ color: met ? "text.primary" : "text.secondary" }}>
                {children}
            </Typography>
        </Stack>
    );
}

// The live checklist under the new-password field; `checks` comes from checkNewPassword.
export function PasswordRules({ checks }) {
    return (
        <Stack spacing={0.75} sx={{ mt: 2 }} aria-live="polite">
            <Rule met={checks.longEnough}>At least {MIN_LENGTH} characters</Rule>
            <Rule met={checks.different}>Different from your current password</Rule>
            <Rule met={checks.matches}>Passwords match</Rule>
            {checks.tooLong && (
                <Stack direction="row" spacing={1} alignItems="center">
                    <ErrorOutline fontSize="small" sx={{ color: "error.main" }} />
                    <Typography variant="body2" sx={{ color: "error.main" }}>
                        Too long. Use a shorter password; symbols like € and emoji count extra.
                    </Typography>
                </Stack>
            )}
        </Stack>
    );
}
