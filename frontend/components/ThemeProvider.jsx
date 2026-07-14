'use client';

import { useState, useMemo, createContext, useContext, useEffect, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { createTheme, alpha } from '@mui/material/styles';
import ReactNativeWrapper from '@/lib/contexts/ReactNativeWrapper';

// ─── Raw design tokens (mirror the SmartMenu theme file) ─────────────────────
const TOKENS = {
    // ── Dark mode base ──────────────────────────────────────────────────────
    dark: {
        bg: '#0D0400',
        bgRaised: '#1C0A00',
        surface: '#2D1200',
        surfaceRaised: '#3B1A06',
        surfaceHover: '#4F240A',

        brand: '#D4850A',
        brandDark: '#A0622A',
        brandDeep: '#6B3318',
        gold: '#F5C842',
        goldMuted: '#D4A017',

        textPrimary: '#F9EDD8',
        textSecondary: '#D4A872',
        textMuted: '#8B6038',
        textDisabled: '#5F3E22',

        borderBase: 'rgba(212,133,10,0.15)',
        borderStrong: 'rgba(212,133,10,0.30)',
        borderGlow: 'rgba(212,133,10,0.50)',

        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
    },
    // ── Light mode overrides (only different values) ────────────────────────
    light: {
        bg: '#FFFBF5',
        bgRaised: '#FEF7ED',
        surface: '#FDF3E0',
        surfaceRaised: '#F8EAD5',
        surfaceHover: '#F3DEC0',

        brand: '#D4850A',
        brandDark: '#A0622A',
        brandDeep: '#6B3318',
        gold: '#F5C842',
        goldMuted: '#D4A017',

        textPrimary: '#2D1200',
        textSecondary: '#5F3E22',
        textMuted: '#8B6038',
        textDisabled: '#B09070',

        borderBase: 'rgba(212,133,10,0.18)',
        borderStrong: 'rgba(212,133,10,0.35)',
        borderGlow: 'rgba(212,133,10,0.55)',

        success: '#16a34a',
        error: '#dc2626',
        warning: '#d97706',
        info: '#2563eb',
    },
};

// ─── Helper: shadow system (works for both modes) ────────────────────────────
const depthShadow = (mode, level = 1) => {
    const isDark = mode === 'dark';
    const base = [
        'none',
        isDark
            ? `0 2px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.7), inset 0 1px 0 ${alpha(TOKENS[mode].brand, 0.08)}`
            : `0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 ${alpha(TOKENS[mode].brand, 0.06)}`,
        isDark
            ? `0 4px 16px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.7), inset 0 1px 0 ${alpha(TOKENS[mode].brand, 0.1)}`
            : `0 4px 16px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 ${alpha(TOKENS[mode].brand, 0.08)}`,
        isDark
            ? `0 8px 32px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.75), inset 0 1px 0 ${alpha(TOKENS[mode].brand, 0.12)}`
            : `0 8px 32px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.12), inset 0 1px 0 ${alpha(TOKENS[mode].brand, 0.1)}`,
        isDark
            ? `0 16px 48px rgba(0,0,0,0.65), 0 8px 16px rgba(0,0,0,0.8), inset 0 1px 0 ${alpha(TOKENS[mode].brand, 0.15)}`
            : `0 16px 48px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.15), inset 0 1px 0 ${alpha(TOKENS[mode].brand, 0.12)}`,
        isDark
            ? `0 24px 64px rgba(0,0,0,0.7), 0 12px 24px rgba(0,0,0,0.85), inset 0 1px 0 ${alpha(TOKENS[mode].brand, 0.18)}`
            : `0 24px 64px rgba(0,0,0,0.12), 0 12px 24px rgba(0,0,0,0.2), inset 0 1px 0 ${alpha(TOKENS[mode].brand, 0.15)}`,
    ];
    return base[Math.min(level, 5)];
};

// ─── Create a full MUI theme from mode ──────────────────────────────────────
const createAppTheme = (mode) => {
    const t = TOKENS[mode];
    const isDark = mode === 'dark';

    return createTheme({
        palette: {
            mode,
            background: {
                default: t.bg,
                paper: t.bgRaised,
            },
            primary: {
                main: t.brand,
                dark: t.brandDark,
                light: t.gold,
                contrastText: '#FFF8ED',
            },
            secondary: {
                main: t.goldMuted,
                dark: t.brandDeep,
                light: t.gold,
                contrastText: '#FFF8ED',
            },
            success: { main: t.success },
            error: { main: t.error },
            warning: { main: t.warning },
            info: { main: t.info },
            text: {
                primary: t.textPrimary,
                secondary: t.textSecondary,
                disabled: t.textDisabled,
            },
            divider: t.borderBase,
            action: {
                hover: alpha(t.brand, 0.08),
                selected: alpha(t.brand, 0.14),
                disabledBackground: alpha(t.surface, 0.4),
                disabled: t.textDisabled,
            },
        },

        typography: {
            fontFamily: '"Inter", system-ui, sans-serif',
            h1: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, letterSpacing: '-0.02em' },
            h2: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, letterSpacing: '-0.015em' },
            h3: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 600, letterSpacing: '-0.01em' },
            h4: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 600 },
            h5: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 600 },
            h6: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 600 },
            subtitle1: { color: t.textSecondary, fontWeight: 500 },
            subtitle2: { color: t.textMuted, fontWeight: 500, fontSize: '0.8rem' },
            body1: { color: t.textPrimary, lineHeight: 1.65 },
            body2: { color: t.textSecondary, lineHeight: 1.6, fontSize: '0.875rem' },
            caption: { color: t.textMuted, fontSize: '0.75rem', letterSpacing: '0.02em' },
            overline: { color: t.textMuted, fontSize: '0.7rem', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' },
            button: { fontWeight: 600, letterSpacing: '0.02em', textTransform: 'none' },
        },

        shape: { borderRadius: 12 },

        shadows: [
            'none',
            depthShadow(mode, 1),
            depthShadow(mode, 1),
            depthShadow(mode, 2),
            depthShadow(mode, 2),
            depthShadow(mode, 3),
            depthShadow(mode, 3),
            depthShadow(mode, 3),
            depthShadow(mode, 4),
            depthShadow(mode, 4),
            depthShadow(mode, 4),
            depthShadow(mode, 4),
            depthShadow(mode, 5),
            ...Array(12).fill(depthShadow(mode, 5)),
        ],

        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundColor: t.bg,
                        backgroundImage: isDark
                            ? `radial-gradient(ellipse at 20% 0%, ${alpha(t.brandDeep, 0.35)} 0%, transparent 55%),
                               radial-gradient(ellipse at 80% 100%, ${alpha(t.brand, 0.12)} 0%, transparent 50%)`
                            : `radial-gradient(ellipse at 20% 0%, ${alpha(t.brand, 0.05)} 0%, transparent 55%),
                               radial-gradient(ellipse at 80% 100%, ${alpha(t.brand, 0.03)} 0%, transparent 50%)`,
                        backgroundAttachment: 'fixed',
                    },
                },
            },

            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        backgroundColor: t.bgRaised,
                        border: `1px solid ${t.borderBase}`,
                        backdropFilter: 'blur(12px)',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            inset: 0,
                            background: `linear-gradient(145deg, ${alpha(t.brand, 0.04)} 0%, transparent 60%)`,
                            pointerEvents: 'none',
                            borderRadius: 'inherit',
                        },
                        position: 'relative',
                        overflow: 'hidden',
                    },
                    elevation1: { boxShadow: depthShadow(mode, 1) },
                    elevation2: { boxShadow: depthShadow(mode, 2) },
                    elevation3: { boxShadow: depthShadow(mode, 3) },
                    elevation4: { boxShadow: depthShadow(mode, 4) },
                    elevation8: { boxShadow: depthShadow(mode, 5) },
                },
            },

            MuiCard: {
                styleOverrides: {
                    root: {
                        backgroundImage: `linear-gradient(145deg, ${alpha(t.surface, 0.9)} 0%, ${alpha(t.bgRaised, 0.95)} 100%)`,
                        border: `1px solid ${t.borderBase}`,
                        boxShadow: depthShadow(mode, 2),
                        transition: 'box-shadow 250ms ease, border-color 250ms ease, transform 250ms ease',
                        '&:hover': {
                            boxShadow: `${depthShadow(mode, 4)}, 0 0 20px ${alpha(t.brand, 0.25)}`,
                            borderColor: t.borderStrong,
                            transform: 'translateY(-2px)',
                        },
                    },
                },
            },

            MuiButton: {
                defaultProps: { disableRipple: false },
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        fontWeight: 600,
                        transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
                        textTransform: 'none',
                    },
                    containedPrimary: {
                        background: `linear-gradient(135deg, ${t.brand} 0%, ${t.brandDark} 100%)`,
                        boxShadow: `0 4px 16px ${alpha(t.brand, 0.3)}, inset 0 1px 0 ${alpha('#fff', 0.15)}`,
                        border: `1px solid ${alpha(t.brand, 0.4)}`,
                        color: '#FFF8ED',
                        '&:hover': {
                            background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)`,
                            boxShadow: `0 8px 24px ${alpha(t.brand, 0.45)}, inset 0 1px 0 ${alpha('#fff', 0.2)}`,
                            transform: 'translateY(-1px)',
                        },
                        '&:active': { transform: 'translateY(0)' },
                        '&.Mui-disabled': { opacity: 0.45, background: t.surface },
                    },
                    outlinedPrimary: {
                        borderColor: t.borderStrong,
                        color: t.textSecondary,
                        background: alpha(t.surface, 0.8),
                        '&:hover': {
                            borderColor: t.borderGlow,
                            background: alpha(t.brand, 0.08),
                            color: t.textPrimary,
                            boxShadow: `0 0 12px ${alpha(t.brand, 0.15)}`,
                        },
                    },
                    textPrimary: {
                        color: t.textMuted,
                        '&:hover': {
                            background: alpha(t.brand, 0.07),
                            color: t.textSecondary,
                        },
                    },
                    sizeLarge: { padding: '12px 28px', fontSize: '1rem' },
                    sizeMedium: { padding: '9px 20px' },
                    sizeSmall: { padding: '5px 14px', fontSize: '0.8rem' },
                },
            },

            MuiIconButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                        color: t.textMuted,
                        transition: 'all 150ms ease',
                        '&:hover': {
                            background: alpha(t.brand, 0.1),
                            color: t.textSecondary,
                        },
                    },
                },
            },

            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        background: alpha(t.surface, 0.8),
                        borderRadius: 12,
                        color: t.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: t.borderBase,
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: t.borderStrong,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: t.brand,
                            borderWidth: 1,
                            boxShadow: `0 0 0 3px ${alpha(t.brand, 0.15)}`,
                        },
                    },
                    input: {
                        '&::placeholder': { color: t.textMuted, opacity: 1 },
                    },
                },
            },

            MuiInputLabel: {
                styleOverrides: {
                    root: {
                        color: t.textMuted,
                        '&.Mui-focused': { color: t.brand },
                    },
                },
            },

            MuiSelect: {
                styleOverrides: {
                    icon: { color: t.textMuted },
                },
            },

            MuiMenu: {
                styleOverrides: {
                    paper: {
                        background: t.bgRaised,
                        border: `1px solid ${t.borderStrong}`,
                        boxShadow: depthShadow(mode, 5),
                        '& .MuiMenuItem-root': {
                            color: t.textSecondary,
                            borderRadius: 8,
                            margin: '2px 6px',
                            '&:hover': { background: alpha(t.brand, 0.1), color: t.textPrimary },
                            '&.Mui-selected': {
                                background: alpha(t.brand, 0.15),
                                color: t.brand,
                                '&:hover': { background: alpha(t.brand, 0.2) },
                            },
                        },
                    },
                },
            },

            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: 999,
                        fontWeight: 600,
                        fontSize: '0.72rem',
                        height: 24,
                    },
                    colorDefault: {
                        background: alpha(t.surface, 0.9),
                        color: t.textSecondary,
                        border: `1px solid ${t.borderBase}`,
                    },
                    colorPrimary: {
                        background: alpha(t.brand, 0.15),
                        color: t.brand,
                        border: `1px solid ${alpha(t.brand, 0.3)}`,
                    },
                    colorSuccess: {
                        background: alpha(t.success, 0.15),
                        color: t.success,
                        border: `1px solid ${alpha(t.success, 0.3)}`,
                    },
                    colorError: {
                        background: alpha(t.error, 0.15),
                        color: t.error,
                        border: `1px solid ${alpha(t.error, 0.3)}`,
                    },
                    colorWarning: {
                        background: alpha(t.warning, 0.15),
                        color: t.warning,
                        border: `1px solid ${alpha(t.warning, 0.3)}`,
                    },
                    colorInfo: {
                        background: alpha(t.info, 0.15),
                        color: t.info,
                        border: `1px solid ${alpha(t.info, 0.3)}`,
                    },
                },
            },

            MuiDialog: {
                styleOverrides: {
                    paper: {
                        background: `linear-gradient(145deg, ${alpha(t.surface, 0.97)} 0%, ${alpha(t.bgRaised, 0.99)} 100%)`,
                        border: `1px solid ${t.borderStrong}`,
                        boxShadow: `${depthShadow(mode, 5)}, 0 0 0 1px ${alpha(t.brand, 0.12)}`,
                        backdropFilter: 'blur(24px)',
                        borderRadius: 20,
                    },
                    container: {
                        backdropFilter: 'blur(6px)',
                    },
                },
            },

            MuiDialogTitle: {
                styleOverrides: {
                    root: {
                        fontFamily: '"Playfair Display", Georgia, serif',
                        color: t.textPrimary,
                        borderBottom: `1px solid ${t.borderBase}`,
                        paddingBottom: 16,
                    },
                },
            },

            MuiTabs: {
                styleOverrides: {
                    root: {
                        background: alpha(t.surface, 0.6),
                        borderRadius: 12,
                        padding: '4px',
                        minHeight: 40,
                    },
                    indicator: {
                        background: `linear-gradient(90deg, ${t.brand}, ${t.gold})`,
                        borderRadius: 999,
                        height: 3,
                        boxShadow: `0 0 8px ${alpha(t.brand, 0.6)}`,
                    },
                },
            },

            MuiTab: {
                styleOverrides: {
                    root: {
                        color: t.textMuted,
                        fontWeight: 600,
                        minHeight: 40,
                        textTransform: 'none',
                        borderRadius: 10,
                        transition: 'all 200ms ease',
                        '&:hover': { color: t.textSecondary, background: alpha(t.brand, 0.06) },
                        '&.Mui-selected': { color: t.brand },
                    },
                },
            },

            MuiDivider: {
                styleOverrides: {
                    root: {
                        borderColor: 'transparent',
                        background: `linear-gradient(90deg, transparent, ${alpha(t.brand, 0.2)} 50%, transparent)`,
                        height: 1,
                        border: 'none',
                    },
                },
            },

            MuiTooltip: {
                styleOverrides: {
                    tooltip: {
                        background: alpha(t.bgRaised, 0.97),
                        color: t.textSecondary,
                        border: `1px solid ${t.borderStrong}`,
                        borderRadius: 8,
                        fontSize: '0.75rem',
                        boxShadow: depthShadow(mode, 3),
                        backdropFilter: 'blur(12px)',
                    },
                },
            },

            MuiBadge: {
                styleOverrides: {
                    badge: {
                        background: t.error,
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        boxShadow: `0 0 8px ${alpha(t.error, 0.6)}`,
                    },
                },
            },

            MuiLinearProgress: {
                styleOverrides: {
                    root: {
                        borderRadius: 999,
                        background: alpha(t.surface, 0.8),
                        height: 6,
                    },
                    bar: {
                        borderRadius: 999,
                        background: `linear-gradient(90deg, ${t.brand}, ${t.gold})`,
                        boxShadow: `0 0 8px ${alpha(t.brand, 0.5)}`,
                    },
                },
            },

            MuiCircularProgress: {
                defaultProps: { thickness: 3.5 },
                styleOverrides: {
                    colorPrimary: { color: t.brand },
                },
            },

            MuiSkeleton: {
                styleOverrides: {
                    root: {
                        background: `linear-gradient(90deg, ${t.surface} 25%, ${t.surfaceRaised} 50%, ${t.surface} 75%)`,
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite',
                        borderRadius: 10,
                        '@keyframes shimmer': {
                            '0%': { backgroundPosition: '-200% 0' },
                            '100%': { backgroundPosition: '200% 0' },
                        },
                    },
                },
            },

            MuiAlert: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        border: '1px solid',
                        backdropFilter: 'blur(8px)',
                        fontWeight: 500,
                    },
                    standardSuccess: {
                        background: alpha(t.success, 0.08),
                        borderColor: alpha(t.success, 0.25),
                        color: t.success,
                        '& .MuiAlert-icon': { color: t.success },
                    },
                    standardError: {
                        background: alpha(t.error, 0.08),
                        borderColor: alpha(t.error, 0.25),
                        color: t.error,
                        '& .MuiAlert-icon': { color: t.error },
                    },
                    standardWarning: {
                        background: alpha(t.warning, 0.08),
                        borderColor: alpha(t.warning, 0.25),
                        color: t.warning,
                        '& .MuiAlert-icon': { color: t.warning },
                    },
                    standardInfo: {
                        background: alpha(t.info, 0.08),
                        borderColor: alpha(t.info, 0.25),
                        color: t.info,
                        '& .MuiAlert-icon': { color: t.info },
                    },
                },
            },

            MuiSwitch: {
                styleOverrides: {
                    root: { padding: 6 },
                    track: {
                        borderRadius: 999,
                        background: t.surface,
                        border: `1px solid ${t.borderBase}`,
                        opacity: '1 !important',
                    },
                    thumb: {
                        background: t.textDisabled,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    },
                    switchBase: {
                        '&.Mui-checked': {
                            '& .MuiSwitch-thumb': {
                                background: '#FFF8ED',
                                boxShadow: `0 2px 8px ${alpha(t.brand, 0.5)}`,
                            },
                            '& + .MuiSwitch-track': {
                                background: `linear-gradient(90deg, ${t.brandDark}, ${t.brand})`,
                                borderColor: alpha(t.brand, 0.4),
                                boxShadow: `inset 0 0 8px ${alpha(t.brand, 0.3)}`,
                            },
                        },
                    },
                },
            },
        },
    });
};

// ─── Context ────────────────────────────────────────────────────────────────
const ThemeContext = createContext();

export const useThemeMode = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useThemeMode must be used within ThemeProvider');
    return context;
};

export function ThemeProvider({ children }) {
    return (
        <ReactNativeWrapper>
            <RenderThemeProvider>{children}</RenderThemeProvider>
        </ReactNativeWrapper>
    );
}

function RenderThemeProvider({ children }) {
    const [mode, setMode] = useState('dark'); // default dark (matches original theme)
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const savedMode = localStorage.getItem('theme-mode');
        if (savedMode) setMode(savedMode);
        else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setMode('dark');
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && typeof window !== 'undefined') {
            localStorage.setItem('theme-mode', mode);
        }
    }, [mode, isMounted]);

    const theme = useMemo(() => createAppTheme(mode), [mode]);

    const toggleTheme = useCallback(() => {
        setMode(prev => (prev === 'light' ? 'dark' : 'light'));
    }, []);

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme, theme }}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
}