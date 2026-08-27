import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeModeContext = createContext({ mode: 'light', toggleMode: () => {} });

const STORAGE_KEY = 'syntaxtype-theme-mode';

const buildTheme = (mode) =>
    createTheme({
        palette: {
            mode,
            primary: {
                main: mode === 'light' ? '#C8456D' : '#E15A85',
                light: '#E78AAC',
                dark: '#9B2E54',
                contrastText: '#FFFFFF',
            },
            secondary: {
                main: mode === 'light' ? '#1A1A2E' : '#FFC700',
                contrastText: mode === 'light' ? '#FFC700' : '#1A1A2E',
            },
            warning: {
                main: '#FFC700',
            },
            background: {
                default: mode === 'light' ? '#FFF8F0' : '#0F0F1E',
                paper: mode === 'light' ? '#FFFFFF' : '#1A1A2E',
            },
            text: {
                primary: mode === 'light' ? '#1A1A2E' : '#FFF8F0',
                secondary: mode === 'light' ? '#4B5563' : '#9CA3AF',
            },
        },
        typography: {
            fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            // Pixelify Sans is brand-y but unreadable for numbers + small caps.
            // Reserve it for large display headings (h1-h4); h5/h6/overline use
            // DM Sans with tabular numerals so stat tiles and dashboard digits
            // are legible.
            h1: { fontFamily: '"Pixelify Sans", "DM Sans", sans-serif', fontWeight: 700, letterSpacing: '0.02em' },
            h2: { fontFamily: '"Pixelify Sans", "DM Sans", sans-serif', fontWeight: 700, letterSpacing: '0.02em' },
            h3: { fontFamily: '"Pixelify Sans", "DM Sans", sans-serif', fontWeight: 700, letterSpacing: '0.02em' },
            h4: { fontFamily: '"Pixelify Sans", "DM Sans", sans-serif', fontWeight: 700 },
            // DM Sans, not Roboto: Roboto is never loaded, so these three silently
            // fell back to whatever sans the viewer's OS supplies — breaking the
            // heading scale between h4 and h5. This matches the comment above.
            h5: { fontFamily: '"DM Sans", sans-serif', fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
            h6: { fontFamily: '"DM Sans", sans-serif', fontWeight: 700 },
            overline: { fontFamily: '"DM Sans", sans-serif', fontWeight: 700, letterSpacing: '0.08em' },
            button: { textTransform: 'none', fontWeight: 700 },
            body1: { fontWeight: 400 },
            body2: { fontWeight: 400 },
        },
        shape: { borderRadius: 12 },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: { borderRadius: 999, paddingInline: 24 },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        border: mode === 'light' ? '2px solid #1A1A2E' : '2px solid #FFC700',
                        boxShadow: mode === 'light'
                            ? '6px 6px 0 0 #1A1A2E'
                            : '6px 6px 0 0 rgba(255, 199, 0, 0.35)',
                    },
                },
            },
            // MUI v7.1.1 has a Chip regression: its root click handler calls the
            // onClick prop unconditionally, so clicking a display-only Chip (no
            // onClick) throws "onClick is not a function". Every Chip in this app
            // is display-only, so default a no-op handler (prevents the throw)
            // and clickable:false (keeps chips non-interactive — no ripple/cursor).
            MuiChip: {
                defaultProps: {
                    clickable: false,
                    onClick: () => {},
                },
            },
        },
    });

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        if (typeof window === 'undefined') return 'light';
        return window.localStorage.getItem(STORAGE_KEY) || 'light';
    });

    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, mode);
    }, [mode]);

    const value = useMemo(
        () => ({
            mode,
            toggleMode: () => setMode((m) => (m === 'light' ? 'dark' : 'light')),
        }),
        [mode]
    );

    const theme = useMemo(() => buildTheme(mode), [mode]);

    return (
        <ThemeModeContext.Provider value={value}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeModeContext.Provider>
    );
};

export const useThemeMode = () => useContext(ThemeModeContext);
