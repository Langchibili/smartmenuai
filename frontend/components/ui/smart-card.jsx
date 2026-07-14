// FILE: smartmenuai/frontend/components/ui/smart-card.jsx
// Premium glass-morphic card with Framer Motion & MUI.
// Usage:
//   <SmartCard>…</SmartCard>
//   <SmartCard variant="brand" glow hover={false}>…</SmartCard>
//   <SmartCard variant="stat" icon="💰" label="Revenue" value="$4,200" />

"use client";
import { forwardRef } from "react";
import { Box, Typography, Skeleton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import { tokens } from "@/lib/mui-theme";

// ─── Variant token map ───────────────────────────────────────────────────────
const VARIANTS = {
  default: {
    bg: `linear-gradient(145deg, ${alpha(tokens.surface, 0.92)} 0%, ${alpha(tokens.bgRaised, 0.96)} 100%)`,
    border: tokens.borderBase,
    glow: alpha(tokens.brand, 0.12),
    shine: alpha(tokens.brand, 0.05),
  },
  brand: {
    bg: `linear-gradient(145deg, ${alpha(tokens.surface, 0.92)} 0%, ${alpha(tokens.bgRaised, 0.96)} 100%)`,
    border: tokens.borderStrong,
    glow: alpha(tokens.brand, 0.25),
    shine: alpha(tokens.brand, 0.1),
  },
  gold: {
    bg: `linear-gradient(145deg, rgba(60,35,5,0.92) 0%, rgba(35,15,0,0.97) 100%)`,
    border: alpha(tokens.gold, 0.35),
    glow: alpha(tokens.gold, 0.2),
    shine: alpha(tokens.gold, 0.08),
  },
  danger: {
    bg: `linear-gradient(145deg, rgba(50,10,10,0.92) 0%, rgba(28,5,5,0.97) 100%)`,
    border: alpha(tokens.error, 0.3),
    glow: alpha(tokens.error, 0.18),
    shine: alpha(tokens.error, 0.06),
  },
  success: {
    bg: `linear-gradient(145deg, rgba(5,35,15,0.92) 0%, rgba(3,20,8,0.97) 100%)`,
    border: alpha(tokens.success, 0.28),
    glow: alpha(tokens.success, 0.15),
    shine: alpha(tokens.success, 0.06),
  },
};

// ─── Color helpers for stat card ─────────────────────────────────────────────
const ACCENT_MAP = {
  amber: { text: tokens.brand, bg: alpha(tokens.brand, 0.12), border: alpha(tokens.brand, 0.2) },
  gold: { text: tokens.gold, bg: alpha(tokens.gold, 0.10), border: alpha(tokens.gold, 0.2) },
  green: { text: tokens.success, bg: alpha(tokens.success, 0.10), border: alpha(tokens.success, 0.2) },
  red: { text: tokens.error, bg: alpha(tokens.error, 0.10), border: alpha(tokens.error, 0.2) },
  blue: { text: tokens.info, bg: alpha(tokens.info, 0.10), border: alpha(tokens.info, 0.2) },
  purple: { text: "#a855f7", bg: alpha("#a855f7", 0.10), border: alpha("#a855f7", 0.2) },
};

// ─── Framer variants ─────────────────────────────────────────────────────────
const cardMotion = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.2 } },
  whileHover: { y: -3, transition: { duration: 0.2, ease: "easeOut" } },
  whileTap: { scale: 0.985, transition: { duration: 0.1 } },
};

const shineMotion = {
  initial: { x: "-120%", opacity: 0 },
  animate: { x: "120%", opacity: [0, 0.6, 0] },
  transition: { duration: 1.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 4 },
};

// ─── SmartCard ───────────────────────────────────────────────────────────────
export const SmartCard = forwardRef(function SmartCard(
  {
    children,
    variant = "default",
    glow = false,
    hover = true,
    animate = true,
    onClick,
    sx = {},
    style = {},
    className,
  },
  ref
) {
  const v = VARIANTS[variant] ?? VARIANTS.default;

  return (
    <motion.div
      ref={ref}
      variants={cardMotion}
      initial={animate ? "initial" : false}
      animate="animate"
      exit={animate ? "exit" : undefined}
      whileHover={hover && onClick ? "whileHover" : undefined}
      whileTap={hover && onClick ? "whileTap" : undefined}
      onClick={onClick}
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 16,
        border: `1px solid ${v.border}`,
        background: v.bg,
        backdropFilter: "blur(12px)",
        boxShadow: glow
          ? `0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px ${v.border}, 0 0 24px ${v.glow}`
          : `0 4px 20px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.7), inset 0 1px 0 ${v.shine}`,
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {/* Ambient inner shine */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `linear-gradient(145deg, ${v.shine} 0%, transparent 55%)`,
          borderRadius: "inherit",
        }}
      />

      {/* Sweep shine animation */}
      {hover && (
        <motion.div
          aria-hidden
          variants={shineMotion}
          initial="initial"
          animate="animate"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: "45%",
            background: `linear-gradient(90deg, transparent, ${alpha("#fff", 0.04)}, transparent)`,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      {/* Content */}
      <Box sx={{ position: "relative", zIndex: 1, ...sx }}>
        {children}
      </Box>
    </motion.div>
  );
});

// ─── StatCard ────────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
  color = "amber",
  loading = false,
  animate: doAnimate = true,
}) {
  const c = ACCENT_MAP[color] ?? ACCENT_MAP.amber;

  const counterMotion = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.4, ease: "easeOut" } },
  };

  return (
    <SmartCard animate={doAnimate} glow sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
        <Typography
          variant="overline"
          sx={{ color: tokens.textMuted, fontSize: "0.68rem", letterSpacing: "0.1em" }}
        >
          {label}
        </Typography>

        {icon && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              background: c.bg,
              border: `1px solid ${c.border}`,
              flexShrink: 0,
              boxShadow: `0 0 12px ${alpha(c.text, 0.2)}`,
            }}
          >
            {icon}
          </Box>
        )}
      </Box>

      {loading ? (
        <Skeleton variant="text" width="60%" height={48} sx={{ my: 0.5 }} />
      ) : (
        <motion.div variants={counterMotion} initial="initial" animate="animate">
          <Typography
            sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: "1.85rem",
              fontWeight: 700,
              color: c.text,
              lineHeight: 1.1,
              mb: 0.5,
              textShadow: `0 0 20px ${alpha(c.text, 0.3)}`,
            }}
          >
            {value}
          </Typography>
        </motion.div>
      )}

      {sub && (
        <Typography variant="caption" sx={{ color: tokens.textDisabled, display: "block" }}>
          {sub}
        </Typography>
      )}

      {trend != null && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: trend >= 0 ? tokens.success : tokens.error,
              background: alpha(trend >= 0 ? tokens.success : tokens.error, 0.1),
              px: 0.8,
              py: 0.3,
              borderRadius: 99,
            }}
          >
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </Typography>
          <Typography variant="caption" sx={{ color: tokens.textDisabled }}>
            vs last period
          </Typography>
        </Box>
      )}
    </SmartCard>
  );
}

// ─── GlowCard — accent border that pulses ─────────────────────────────────────
export function GlowCard({ children, color = tokens.brand, sx = {}, ...props }) {
  return (
    <motion.div
      animate={{
        boxShadow: [
          `0 0 12px ${alpha(color, 0.25)}, 0 4px 20px rgba(0,0,0,0.55)`,
          `0 0 28px ${alpha(color, 0.45)}, 0 4px 20px rgba(0,0,0,0.55)`,
          `0 0 12px ${alpha(color, 0.25)}, 0 4px 20px rgba(0,0,0,0.55)`,
        ],
      }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      style={{
        borderRadius: 16,
        border: `1px solid ${alpha(color, 0.4)}`,
        overflow: "hidden",
        background: `linear-gradient(145deg, ${alpha(tokens.surface, 0.92)}, ${alpha(tokens.bgRaised, 0.96)})`,
        backdropFilter: "blur(12px)",
      }}
      {...props}
    >
      <Box sx={{ p: 2.5, ...sx }}>{children}</Box>
    </motion.div>
  );
}

// ─── OrderRowCard ─────────────────────────────────────────────────────────────
export function OrderRowCard({ children, active = false, onClick, sx = {} }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, height: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      whileHover={{ x: 2 }}
      onClick={onClick}
      style={{
        borderRadius: 14,
        border: `1px solid ${active ? tokens.borderStrong : tokens.borderBase}`,
        background: active
          ? `linear-gradient(145deg, ${alpha(tokens.brand, 0.08)}, ${alpha(tokens.surface, 0.9)})`
          : `linear-gradient(145deg, ${alpha(tokens.surface, 0.85)}, ${alpha(tokens.bgRaised, 0.92)})`,
        backdropFilter: "blur(8px)",
        boxShadow: active
          ? `0 4px 20px rgba(0,0,0,0.5), 0 0 16px ${alpha(tokens.brand, 0.15)}`
          : `0 2px 10px rgba(0,0,0,0.4)`,
        cursor: onClick ? "pointer" : "default",
        overflow: "hidden",
        transition: "border-color 200ms ease, background 200ms ease",
      }}
    >
      <Box sx={{ px: 2.5, py: 1.8, ...sx }}>{children}</Box>
    </motion.div>
  );
}

export default SmartCard;