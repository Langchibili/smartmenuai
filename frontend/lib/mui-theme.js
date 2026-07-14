// ─────────────────────────────────────────────────────────────────────────────
// FILE: smartmenuai/frontend/lib/mui-theme.js
// ─────────────────────────────────────────────────────────────────────────────
import { createTheme, alpha } from "@mui/material/styles";

const RAW = {
    bg: "#0D0400",
    bgRaised: "#1C0A00",
    surface: "#2D1200",
    surfaceRaised: "#3B1A06",
    surfaceHover: "#4F240A",

    brand: "#D4850A",
    brandDark: "#A0622A",
    brandDeep: "#6B3318",
    gold: "#F5C842",
    goldMuted: "#D4A017",

    textPrimary: "#F9EDD8",
    textSecondary: "#D4A872",
    textMuted: "#8B6038",
    textDisabled: "#5F3E22",

    borderBase: "rgba(212,133,10,0.15)",
    borderStrong: "rgba(212,133,10,0.30)",
    borderGlow: "rgba(212,133,10,0.50)",

    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
};

export const tokens = RAW;

const glowShadow = (color = RAW.brand, spread = 16) =>
    `0 0 ${spread}px ${alpha(color, 0.35)}`;

const depthShadow = (level = 1) => {
    const base = [
        "none",
        `0 2px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.7), inset 0 1px 0 ${alpha(RAW.brand, 0.08)}`,
        `0 4px 16px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.7), inset 0 1px 0 ${alpha(RAW.brand, 0.1)}`,
        `0 8px 32px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.75), inset 0 1px 0 ${alpha(RAW.brand, 0.12)}`,
        `0 16px 48px rgba(0,0,0,0.65), 0 8px 16px rgba(0,0,0,0.8), inset 0 1px 0 ${alpha(RAW.brand, 0.15)}`,
        `0 24px 64px rgba(0,0,0,0.7), 0 12px 24px rgba(0,0,0,0.85), inset 0 1px 0 ${alpha(RAW.brand, 0.18)}`,
    ];
    return base[Math.min(level, 5)];
};

const theme = createTheme({
    palette: {
        mode: "dark",
        background: { default: RAW.bg, paper: RAW.bgRaised },
        primary: { main: RAW.brand, dark: RAW.brandDark, light: RAW.gold, contrastText: "#FFF8ED" },
        secondary: { main: RAW.goldMuted, dark: RAW.brandDeep, light: RAW.gold, contrastText: "#FFF8ED" },
        success: { main: RAW.success },
        error: { main: RAW.error },
        warning: { main: RAW.warning },
        info: { main: RAW.info },
        text: { primary: RAW.textPrimary, secondary: RAW.textSecondary, disabled: RAW.textDisabled },
        divider: RAW.borderBase,
        action: { hover: alpha(RAW.brand, 0.08), selected: alpha(RAW.brand, 0.14), disabledBackground: alpha(RAW.surface, 0.4), disabled: RAW.textDisabled },
    },
    typography: {
        fontFamily: '"Inter", system-ui, sans-serif',
        h1: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, letterSpacing: "-0.02em" },
        h2: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, letterSpacing: "-0.015em" },
        h3: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 600, letterSpacing: "-0.01em" },
        h4: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 600 },
        h5: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 600 },
        h6: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 600 },
        subtitle1: { color: RAW.textSecondary, fontWeight: 500 },
        subtitle2: { color: RAW.textMuted, fontWeight: 500, fontSize: "0.8rem" },
        body1: { color: RAW.textPrimary, lineHeight: 1.65 },
        body2: { color: RAW.textSecondary, lineHeight: 1.6, fontSize: "0.875rem" },
        caption: { color: RAW.textMuted, fontSize: "0.75rem", letterSpacing: "0.02em" },
        overline: { color: RAW.textMuted, fontSize: "0.7rem", letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase" },
        button: { fontWeight: 600, letterSpacing: "0.02em", textTransform: "none" },
    },
    shape: { borderRadius: 12 },
    shadows: [
        "none",
        depthShadow(1), depthShadow(1), depthShadow(2), depthShadow(2),
        depthShadow(3), depthShadow(3), depthShadow(3), depthShadow(4),
        ...Array(16).fill(depthShadow(5)),
    ],
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: RAW.bg,
                    backgroundImage: `radial-gradient(ellipse at 20% 0%, ${alpha(RAW.brandDeep, 0.35)} 0%, transparent 55%),
                            radial-gradient(ellipse at 80% 100%, ${alpha(RAW.brand, 0.12)} 0%, transparent 50%)`,
                    backgroundAttachment: "fixed",
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                    backgroundColor: RAW.bgRaised,
                    border: `1px solid ${RAW.borderBase}`,
                    backdropFilter: "blur(12px)",
                    "&::before": {
                        content: '""', position: "absolute", inset: 0,
                        background: `linear-gradient(145deg, ${alpha(RAW.brand, 0.04)} 0%, transparent 60%)`,
                        pointerEvents: "none", borderRadius: "inherit",
                    },
                    position: "relative", overflow: "hidden",
                },
                elevation1: { boxShadow: depthShadow(1) },
                elevation2: { boxShadow: depthShadow(2) },
                elevation3: { boxShadow: depthShadow(3) },
                elevation4: { boxShadow: depthShadow(4) },
                elevation8: { boxShadow: depthShadow(5) },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: `linear-gradient(145deg, ${alpha(RAW.surface, 0.9)} 0%, ${alpha(RAW.bgRaised, 0.95)} 100%)`,
                    border: `1px solid ${RAW.borderBase}`,
                    boxShadow: depthShadow(2),
                    transition: "box-shadow 250ms ease, border-color 250ms ease, transform 250ms ease",
                    "&:hover": {
                        boxShadow: `${depthShadow(4)}, ${glowShadow(RAW.brand, 20)}`,
                        borderColor: RAW.borderStrong,
                        transform: "translateY(-2px)",
                    },
                },
            },
        },
        MuiButton: {
            defaultProps: { disableRipple: false },
            styleOverrides: {
                root: { borderRadius: 12, fontWeight: 600, transition: "all 150ms cubic-bezier(0.4,0,0.2,1)", textTransform: "none" },
                containedPrimary: {
                    background: `linear-gradient(135deg, ${RAW.brand} 0%, ${RAW.brandDark} 100%)`,
                    boxShadow: `0 4px 16px ${alpha(RAW.brand, 0.3)}, inset 0 1px 0 ${alpha("#fff", 0.15)}`,
                    border: `1px solid ${alpha(RAW.brand, 0.4)}`,
                    color: "#FFF8ED",
                    "&:hover": {
                        background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)`,
                        boxShadow: `0 8px 24px ${alpha(RAW.brand, 0.45)}, inset 0 1px 0 ${alpha("#fff", 0.2)}`,
                        transform: "translateY(-1px)",
                    },
                    "&:active": { transform: "translateY(0)" },
                    "&.Mui-disabled": { opacity: 0.45, background: RAW.surface },
                },
                outlinedPrimary: {
                    borderColor: RAW.borderStrong, color: RAW.textSecondary, background: alpha(RAW.surface, 0.8),
                    "&:hover": {
                        borderColor: RAW.borderGlow, background: alpha(RAW.brand, 0.08),
                        color: RAW.textPrimary, boxShadow: `0 0 12px ${alpha(RAW.brand, 0.15)}`,
                    },
                },
                textPrimary: {
                    color: RAW.textMuted,
                    "&:hover": { background: alpha(RAW.brand, 0.07), color: RAW.textSecondary },
                },
                sizeLarge: { padding: "12px 28px", fontSize: "1rem" },
                sizeMedium: { padding: "9px 20px" },
                sizeSmall: { padding: "5px 14px", fontSize: "0.8rem" },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10, color: RAW.textMuted, transition: "all 150ms ease",
                    "&:hover": { background: alpha(RAW.brand, 0.1), color: RAW.textSecondary },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    background: alpha(RAW.surface, 0.8), borderRadius: 12, color: RAW.textPrimary,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: RAW.borderBase },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: RAW.borderStrong },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: RAW.brand, borderWidth: 1, boxShadow: `0 0 0 3px ${alpha(RAW.brand, 0.15)}`,
                    },
                },
                input: { "&::placeholder": { color: RAW.textMuted, opacity: 1 } },
            },
        },
        MuiInputLabel: {
            styleOverrides: { root: { color: RAW.textMuted, "&.Mui-focused": { color: RAW.brand } } },
        },
        MuiSelect: {
            styleOverrides: { icon: { color: RAW.textMuted } },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    background: RAW.bgRaised, border: `1px solid ${RAW.borderStrong}`, boxShadow: depthShadow(5),
                    "& .MuiMenuItem-root": {
                        color: RAW.textSecondary, borderRadius: 8, margin: "2px 6px",
                        "&:hover": { background: alpha(RAW.brand, 0.1), color: RAW.textPrimary },
                        "&.Mui-selected": { background: alpha(RAW.brand, 0.15), color: RAW.brand, "&:hover": { background: alpha(RAW.brand, 0.2) } },
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: { borderRadius: 999, fontWeight: 600, fontSize: "0.72rem", height: 24, letterSpacing: "0.02em" },
                colorDefault: { background: alpha(RAW.surface, 0.9), color: RAW.textSecondary, border: `1px solid ${RAW.borderBase}` },
                colorPrimary: { background: alpha(RAW.brand, 0.15), color: RAW.brand, border: `1px solid ${alpha(RAW.brand, 0.3)}` },
                colorSuccess: { background: alpha(RAW.success, 0.15), color: RAW.success, border: `1px solid ${alpha(RAW.success, 0.3)}` },
                colorError: { background: alpha(RAW.error, 0.15), color: RAW.error, border: `1px solid ${alpha(RAW.error, 0.3)}` },
                colorWarning: { background: alpha(RAW.warning, 0.15), color: RAW.warning, border: `1px solid ${alpha(RAW.warning, 0.3)}` },
                colorInfo: { background: alpha(RAW.info, 0.15), color: RAW.info, border: `1px solid ${alpha(RAW.info, 0.3)}` },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    background: `linear-gradient(145deg, ${alpha(RAW.surface, 0.97)} 0%, ${alpha(RAW.bgRaised, 0.99)} 100%)`,
                    border: `1px solid ${RAW.borderStrong}`, boxShadow: `${depthShadow(5)}, 0 0 0 1px ${alpha(RAW.brand, 0.12)}`,
                    backdropFilter: "blur(24px)", borderRadius: 20,
                },
                container: { backdropFilter: "blur(6px)" },
            },
        },
        MuiDialogTitle: {
            styleOverrides: { root: { fontFamily: '"Playfair Display", Georgia, serif', color: RAW.textPrimary, borderBottom: `1px solid ${RAW.borderBase}`, paddingBottom: 16 } },
        },
        MuiTabs: {
            styleOverrides: {
                root: { background: alpha(RAW.surface, 0.6), borderRadius: 12, padding: "4px", minHeight: 40 },
                indicator: { background: `linear-gradient(90deg, ${RAW.brand}, ${RAW.gold})`, borderRadius: 999, height: 3, boxShadow: `0 0 8px ${alpha(RAW.brand, 0.6)}` },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    color: RAW.textMuted, fontWeight: 600, minHeight: 40, textTransform: "none", borderRadius: 10,
                    transition: "all 200ms ease",
                    "&:hover": { color: RAW.textSecondary, background: alpha(RAW.brand, 0.06) },
                    "&.Mui-selected": { color: RAW.brand },
                },
            },
        },
        MuiDivider: {
            styleOverrides: {
                root: { borderColor: "transparent", background: `linear-gradient(90deg, transparent, ${alpha(RAW.brand, 0.2)} 50%, transparent)`, height: 1, border: "none" },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: { background: alpha(RAW.bgRaised, 0.97), color: RAW.textSecondary, border: `1px solid ${RAW.borderStrong}`, borderRadius: 8, fontSize: "0.75rem", boxShadow: depthShadow(3), backdropFilter: "blur(12px)" },
            },
        },
        MuiBadge: {
            styleOverrides: {
                badge: { background: RAW.error, color: "#fff", fontSize: "0.65rem", fontWeight: 700, boxShadow: `0 0 8px ${alpha(RAW.error, 0.6)}` },
            },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: { borderRadius: 999, background: alpha(RAW.surface, 0.8), height: 6 },
                bar: { borderRadius: 999, background: `linear-gradient(90deg, ${RAW.brand}, ${RAW.gold})`, boxShadow: `0 0 8px ${alpha(RAW.brand, 0.5)}` },
            },
        },
        MuiCircularProgress: {
            defaultProps: { thickness: 3.5 },
            styleOverrides: { colorPrimary: { color: RAW.brand } },
        },
        MuiSkeleton: {
            styleOverrides: {
                root: {
                    background: `linear-gradient(90deg, ${RAW.surface} 25%, ${RAW.surfaceRaised} 50%, ${RAW.surface} 75%)`,
                    backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", borderRadius: 10,
                    "@keyframes shimmer": { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: { borderRadius: 12, border: "1px solid", backdropFilter: "blur(8px)", fontWeight: 500 },
                standardSuccess: { background: alpha(RAW.success, 0.08), borderColor: alpha(RAW.success, 0.25), color: RAW.success, "& .MuiAlert-icon": { color: RAW.success } },
                standardError: { background: alpha(RAW.error, 0.08), borderColor: alpha(RAW.error, 0.25), color: RAW.error, "& .MuiAlert-icon": { color: RAW.error } },
                standardWarning: { background: alpha(RAW.warning, 0.08), borderColor: alpha(RAW.warning, 0.25), color: RAW.warning, "& .MuiAlert-icon": { color: RAW.warning } },
                standardInfo: { background: alpha(RAW.info, 0.08), borderColor: alpha(RAW.info, 0.25), color: RAW.info, "& .MuiAlert-icon": { color: RAW.info } },
            },
        },
        MuiSwitch: {
            styleOverrides: {
                root: { padding: 6 },
                track: { borderRadius: 999, background: RAW.surface, border: `1px solid ${RAW.borderBase}`, opacity: "1 !important" },
                thumb: { background: RAW.textDisabled, boxShadow: "0 2px 4px rgba(0,0,0,0.4)" },
                switchBase: {
                    "&.Mui-checked": {
                        "& .MuiSwitch-thumb": { background: "#FFF8ED", boxShadow: `0 2px 8px ${alpha(RAW.brand, 0.5)}` },
                        "& + .MuiSwitch-track": { background: `linear-gradient(90deg, ${RAW.brandDark}, ${RAW.brand})`, borderColor: alpha(RAW.brand, 0.4), boxShadow: `inset 0 0 8px ${alpha(RAW.brand, 0.3)}` },
                    },
                },
            },
        },
    },
});

export { glowShadow, depthShadow };
export default theme;