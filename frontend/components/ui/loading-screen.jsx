"use client";
import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

export function LoadingScreen() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0D0400",
      }}
    >
      <Box sx={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            background: "linear-gradient(135deg, #D4850A, #6B3318)",
            boxShadow: "0 0 24px rgba(212,133,10,0.4)",
          }}
        >
          <Typography sx={{ fontSize: "1.5rem" }}>🍺</Typography>
        </Box>
        <Typography
          sx={{
            fontSize: "0.875rem",
            color: "#D4A872",
            fontFamily: "var(--font-playfair)",
          }}
        >
          Loading{dots}
        </Typography>
      </Box>
    </Box>
  );
}