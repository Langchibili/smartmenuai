"use client";
import { Box, Typography, Skeleton as MuiSkeleton } from "@mui/material";
import { alpha } from "@mui/material/styles";

// ─── Design tokens (matching other MUI pages) ─────────────────────────────
const BRAND = "#D4850A";
const TEXT_P = "#F9EDD8";
const TEXT_S = "#D4A872";
const TEXT_M = "#8B6038";
const TEXT_D = "#5F3E22";
const GREEN = "#22c55e";
const BLUE = "#3b82f6";
const ERROR = "#ef4444";

// ─── PageHeader ──────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions, icon }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 2,
        mb: 4,
        flexWrap: "wrap",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        {icon && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
              flexShrink: 0,
              background: `linear-gradient(135deg, ${alpha(BRAND, 0.2)}, ${alpha("#6B3318", 0.15)})`,
              border: `1px solid ${alpha(BRAND, 0.2)}`,
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 700,
              color: TEXT_P,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: { xs: "1.25rem", md: "1.5rem" },
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{ mt: 0.3, color: TEXT_M, fontSize: "0.875rem" }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {actions && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────
const colorMap = {
  amber: { text: BRAND, bg: alpha(BRAND, 0.12), border: alpha(BRAND, 0.2) },
  green: { text: GREEN, bg: alpha(GREEN, 0.1), border: alpha(GREEN, 0.2) },
  blue: { text: BLUE, bg: alpha(BLUE, 0.1), border: alpha(BLUE, 0.2) },
  red: { text: ERROR, bg: alpha(ERROR, 0.1), border: alpha(ERROR, 0.2) },
};

export function StatCard({ label, value, sub, icon, trend, color = "amber", sx, valueSx }) {
  const c = colorMap[color] || colorMap.amber;
  const isLongTextValue = typeof value === "string" && value.length > 10;
  const calculatedFontSize = isLongTextValue
    ? `clamp(0.75rem, ${Math.max(0.75, 20 / value.length)}rem, 2rem)`
    : "2rem";

  return (
    <Box
      sx={[
        {
          p: 2.5,
          borderRadius: "16px",
          background: "linear-gradient(145deg, rgba(45,18,0,0.6) 0%, rgba(28,10,0,0.7) 100%)",
          border: "1px solid rgba(107,51,24,0.25)",
          backdropFilter: "blur(6px)",
        },
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: TEXT_M,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontSize: "0.7rem",
          }}
        >
          {label}
        </Typography>
        {icon && (
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.875rem",
              background: c.bg,
              border: `1px solid ${c.border}`,
            }}
          >
            {icon}
          </Box>
        )}
      </Box>

      <Typography
        sx={{
          fontFamily: '"Playfair Display", serif',
          fontWeight: 700,
          fontSize: calculatedFontSize,
          color: c.text,
          mb: 0.5,
          lineHeight: 1.1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          ...valueSx,
        }}
      >
        {value}
      </Typography>

      {sub && (
        <Typography variant="caption" sx={{ color: TEXT_D }}>
          {sub}
        </Typography>
      )}

      {trend && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: trend.value >= 0 ? GREEN : ERROR,
            }}
          >
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
          </Typography>
          <Typography variant="caption" sx={{ color: TEXT_D }}>
            {trend.label}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 10,
        px: 2,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2rem",
          mb: 2,
          background: "rgba(45,18,0,0.6)",
          border: "1px solid rgba(107,51,24,0.3)",
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontFamily: '"Playfair Display", serif',
          fontWeight: 600,
          color: TEXT_S,
          mb: 1,
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          sx={{
            color: TEXT_D,
            maxWidth: "20rem",
            mb: 3,
          }}
        >
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}

// ─── Skeleton (MUI wrapper, backwards-compatible with old className usage) ──
export function Skeleton({ className, ...props }) {
  // Parse Tailwind-like classes into sx overrides (basic support)
  const sxFromClass = {};
  if (typeof className === "string") {
    const parts = className.split(/\s+/);
    parts.forEach((cls) => {
      if (cls.startsWith("h-")) {
        const val = cls.replace("h-", "");
        const num = parseInt(val, 10) * 4; // Tailwind h-1 = 4px
        if (!isNaN(num)) sxFromClass.height = `${num}px`;
      } else if (cls.startsWith("w-")) {
        const val = cls.replace("w-", "");
        const num = parseInt(val, 10) * 4;
        if (!isNaN(num)) sxFromClass.width = `${num}px`;
      } else if (cls.startsWith("mb-")) {
        const val = cls.replace("mb-", "");
        const num = parseInt(val, 10) * 4;
        if (!isNaN(num)) sxFromClass.marginBottom = `${num}px`;
      }
    });
  }

  return (
    <MuiSkeleton
      variant="rounded"
      animation="wave"
      sx={{
        bgcolor: "rgba(45,18,0,0.6)",
        borderRadius: "12px",
        ...sxFromClass,
        ...props.sx,
      }}
      {...props}
    />
  );
}