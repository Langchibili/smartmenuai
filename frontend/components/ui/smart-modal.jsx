// FILE: smartmenuai/frontend/components/ui/smart-modal.jsx
// Premium animated modal built on MUI Dialog + Framer Motion.
// Usage:
//   <SmartModal open={open} onClose={close} title="Edit Item" size="md">
//     <SmartModal.Body>…</SmartModal.Body>
//     <SmartModal.Footer>
//       <Button onClick={close}>Cancel</Button>
//       <Button variant="contained">Save</Button>
//     </SmartModal.Footer>
//   </SmartModal>

"use client";
import { useEffect, useId } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import CloseIcon from "@mui/icons-material/Close";
import { tokens } from "@/lib/mui-theme";

// ─── Size map ────────────────────────────────────────────────────────────────
const SIZE_MAP = {
  xs: "xs",
  sm: "sm",
  md: "sm",   // MUI 'sm' = ~600px, close enough to "md"
  lg: "md",
  xl: "lg",
  full: false,
};

// ─── Framer animations ───────────────────────────────────────────────────────
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const dialogVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: 24,
    scale: 0.96,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

// Bottom-sheet variant for mobile
const sheetVariants = {
  hidden: { opacity: 0, y: "100%" },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: "100%", transition: { duration: 0.22, ease: "easeIn" } },
};

// ─── MotionDialog helper – wraps MUI Dialog Paper ───────────────────────────
function MotionPaper({ children, bottomSheet, ...props }) {
  return (
    <motion.div
      variants={bottomSheet ? sheetVariants : dialogVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ width: "100%" }}
    >
      <Box
        {...props}
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: bottomSheet ? "20px 20px 0 0" : "20px",
          border: `1px solid ${tokens.borderStrong}`,
          background: `linear-gradient(145deg, ${alpha(tokens.surface, 0.97)} 0%, ${alpha(tokens.bgRaised, 0.99)} 100%)`,
          backdropFilter: "blur(24px)",
          boxShadow: `0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px ${alpha(tokens.brand, 0.1)}, inset 0 1px 0 ${alpha(tokens.brand, 0.15)}`,
          width: "100%",
          ...props.sx,
        }}
      >
        {/* Top shine line */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${alpha(tokens.brand, 0.5)}, transparent)`,
            pointerEvents: "none",
          }}
        />

        {/* Corner glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 200,
            height: 200,
            background: `radial-gradient(circle, ${alpha(tokens.brand, 0.07)} 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        {children}
      </Box>
    </motion.div>
  );
}

// ─── SmartModal ──────────────────────────────────────────────────────────────
export default function SmartModal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  size = "md",
  bottomSheet = false,
  disableClose = false,
  noPadding = false,
  maxHeight = "82vh",
}) {
  const titleId = useId();

  // Escape key handling
  useEffect(() => {
    if (!open || disableClose) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, disableClose]);

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={disableClose ? undefined : onClose}
          maxWidth={SIZE_MAP[size] ?? "sm"}
          fullWidth
          aria-labelledby={titleId}
          PaperProps={{ component: "div", style: { background: "transparent", boxShadow: "none", overflow: "visible" } }}
          slotProps={{
            backdrop: {
              component: motion.div,
              variants: backdropVariants,
              initial: "hidden",
              animate: "visible",
              exit: "exit",
              style: { backgroundColor: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" },
            },
          }}
          sx={{
            "& .MuiDialog-container": { alignItems: bottomSheet ? "flex-end" : "center" },
            "& .MuiDialog-paper": {
              background: "transparent",
              boxShadow: "none",
              margin: bottomSheet ? 0 : 2,
              width: "100%",
              maxWidth: bottomSheet ? "100%" : undefined,
              maxHeight: "none",
              overflow: "visible",
            },
          }}
        >
          <MotionPaper bottomSheet={bottomSheet}>
            {/* ── Header ─────────────────────────────────────────── */}
            {(title || !disableClose) && (
              <>
                <DialogTitle
                  id={titleId}
                  sx={{
                    p: 0,
                    px: 3,
                    pt: 3,
                    pb: title ? 2 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  {icon && (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.3rem",
                        background: `linear-gradient(135deg, ${alpha(tokens.brand, 0.2)}, ${alpha(tokens.brandDeep, 0.15)})`,
                        border: `1px solid ${alpha(tokens.brand, 0.25)}`,
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </Box>
                  )}

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {title && (
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: '"Playfair Display", Georgia, serif',
                          color: tokens.textPrimary,
                          fontWeight: 600,
                          lineHeight: 1.3,
                        }}
                      >
                        {title}
                      </Typography>
                    )}
                    {subtitle && (
                      <Typography variant="caption" sx={{ color: tokens.textMuted, display: "block", mt: 0.3 }}>
                        {subtitle}
                      </Typography>
                    )}
                  </Box>

                  {!disableClose && (
                    <IconButton
                      onClick={onClose}
                      size="small"
                      sx={{
                        color: tokens.textMuted,
                        background: alpha(tokens.surface, 0.8),
                        border: `1px solid ${tokens.borderBase}`,
                        width: 32,
                        height: 32,
                        flexShrink: 0,
                        "&:hover": {
                          background: alpha(tokens.brand, 0.1),
                          color: tokens.textSecondary,
                          borderColor: tokens.borderStrong,
                        },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </DialogTitle>

                <Divider sx={{ mx: 3 }} />
              </>
            )}

            {/* ── Body ───────────────────────────────────────────── */}
            <DialogContent
              sx={{
                p: noPadding ? 0 : 3,
                overflowY: "auto",
                maxHeight,
                "&::-webkit-scrollbar": { width: 5 },
                "&::-webkit-scrollbar-track": { background: "transparent" },
                "&::-webkit-scrollbar-thumb": {
                  background: alpha(tokens.brand, 0.2),
                  borderRadius: 99,
                },
              }}
            >
              {children}
            </DialogContent>
          </MotionPaper>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

// ─── Compound sub-components ─────────────────────────────────────────────────
SmartModal.Body = function ModalBody({ children, sx = {} }) {
  return <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, ...sx }}>{children}</Box>;
};

SmartModal.Footer = function ModalFooter({ children, sx = {} }) {
  return (
    <>
      <Divider sx={{ mx: 3 }} />
      <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5, justifyContent: "flex-end", ...sx }}>
        {children}
      </DialogActions>
    </>
  );
};

SmartModal.Section = function ModalSection({ title, children, sx = {} }) {
  return (
    <Box sx={sx}>
      {title && (
        <Typography
          variant="overline"
          sx={{ color: tokens.textMuted, display: "block", mb: 1.5, letterSpacing: "0.1em" }}
        >
          {title}
        </Typography>
      )}
      {children}
    </Box>
  );
};

SmartModal.InfoRow = function InfoRow({ label, value, accent = false }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 1.5,
        borderBottom: `1px solid ${tokens.borderBase}`,
        "&:last-child": { borderBottom: "none" },
      }}
    >
      <Typography variant="body2" sx={{ color: tokens.textMuted }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: accent ? tokens.brand : tokens.textSecondary,
          fontWeight: accent ? 700 : 500,
          fontFamily: accent ? '"Playfair Display", Georgia, serif' : undefined,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

// ─── ConfirmModal — quick-use destructive confirmation ────────────────────────
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  danger = false,
  loading = false,
}) {
  return (
    <SmartModal open={open} onClose={onClose} title={title} icon={danger ? "⚠️" : "❓"} size="xs">
      <SmartModal.Body>
        {message && (
          <Typography variant="body2" sx={{ color: tokens.textSecondary, lineHeight: 1.7 }}>
            {message}
          </Typography>
        )}
      </SmartModal.Body>

      <SmartModal.Footer>
        <Box
          component="button"
          onClick={onClose}
          sx={{
            px: 3,
            py: 1.2,
            borderRadius: "10px",
            border: `1px solid ${tokens.borderStrong}`,
            background: alpha(tokens.surface, 0.8),
            color: tokens.textSecondary,
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            transition: "all 150ms",
            "&:hover": { background: tokens.surface, color: tokens.textPrimary },
          }}
        >
          Cancel
        </Box>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onConfirm}
          disabled={loading}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: `1px solid ${danger ? alpha(tokens.error, 0.4) : alpha(tokens.brand, 0.4)}`,
            background: danger
              ? `linear-gradient(135deg, #dc2626, #991b1b)`
              : `linear-gradient(135deg, ${tokens.brand}, ${tokens.brandDark})`,
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.875rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
            boxShadow: `0 4px 16px ${alpha(danger ? tokens.error : tokens.brand, 0.3)}`,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {loading ? "Loading…" : confirmLabel}
        </motion.button>
      </SmartModal.Footer>
    </SmartModal>
  );
}