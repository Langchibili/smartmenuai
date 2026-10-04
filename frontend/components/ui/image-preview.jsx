"use client";

import { useState } from "react";
import { Box, Button, Dialog, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function ImagePreview({ src, alt, sx, imageSx }) {
  const [open, setOpen] = useState(false);
  if (!src) return null;

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-label={`Open ${alt || "image"} full screen`}
        onClick={() => setOpen(true)}
        sx={{
          display: "block",
          p: 0,
          border: 0,
          bgcolor: "transparent",
          cursor: "zoom-in",
          overflow: "hidden",
          ...sx,
        }}
      >
        <Box
          component="img"
          src={src}
          alt={alt || ""}
          sx={{ display: "block", width: "100%", height: "100%", objectFit: "cover", ...imageSx }}
        />
      </Box>
      <Dialog
        fullScreen
        open={open}
        onClose={() => setOpen(false)}
        aria-label={`${alt || "Image"} full-screen preview`}
        PaperProps={{ sx: { bgcolor: "#080604" } }}
      >
        <Box sx={{ position: "relative", width: "100%", height: "100dvh", display: "grid", placeItems: "center" }}>
          <IconButton
            aria-label="Cancel image preview"
            onClick={() => setOpen(false)}
            sx={{
              position: "absolute",
              zIndex: 1,
              top: { xs: 12, sm: 20 },
              right: { xs: 12, sm: 20 },
              color: "#fff",
              bgcolor: "rgba(0,0,0,0.65)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.85)" },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Button
            onClick={() => setOpen(false)}
            sx={{
              position: "absolute",
              zIndex: 1,
              top: { xs: 14, sm: 22 },
              right: { xs: 58, sm: 68 },
              color: "#fff",
              textTransform: "none",
              bgcolor: "rgba(0,0,0,0.65)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.85)" },
            }}
          >
            Cancel
          </Button>
          <Box
            component="img"
            src={src}
            alt={alt || ""}
            sx={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </Box>
      </Dialog>
    </>
  );
}
