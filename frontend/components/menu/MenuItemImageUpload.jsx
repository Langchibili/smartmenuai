"use client";

import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { menuApi } from "@/lib/api";
import { getMediaUrl } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function MenuItemImageUpload({
  menuItemId,
  image,
  disabled = false,
  onImageChange,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const previewUrl = typeof image === "string" ? getMediaUrl(image) : getMediaUrl(image?.url);

  const upload = async (file) => {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be 5 MB or smaller.");
      return;
    }
    if (!menuItemId) {
      setError("Save the menu item before uploading its image.");
      return;
    }

    setUploading(true);
    try {
      const media = await menuApi.uploadMenuItemImage(menuItemId, file);
      onImageChange(media);
    } catch (uploadError) {
      setError(uploadError.message || "Image upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    if (!menuItemId || uploading) return;
    setError("");
    setUploading(true);
    try {
      await menuApi.removeMenuItemImage(menuItemId);
      onImageChange(null);
    } catch (removeError) {
      setError(removeError.message || "Could not remove the image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        borderColor: error ? "error.main" : "rgba(212,133,10,0.24)",
        opacity: disabled ? 0.58 : 1,
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{
          px: 2.5,
          py: 2,
          background: "linear-gradient(135deg, rgba(212,133,10,0.1), rgba(212,133,10,0.04))",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(212,133,10,0.14)",
            color: "#D4850A",
          }}
        >
          <CloudUploadOutlinedIcon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>Menu item photo</Typography>
          <Typography variant="caption" color="text.secondary">
            {disabled
              ? "Save the menu item first to attach its image."
              : "Add a clear photo of this item (JPG, PNG, or WEBP, max 5 MB)."}
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ p: 2.5 }}>
        <input
          ref={inputRef}
          hidden
          type="file"
          accept="image/*"
          aria-label="Choose menu item image"
          onChange={(event) => upload(event.target.files?.[0])}
        />

        {previewUrl ? (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              border: "1px solid rgba(34,197,94,0.3)",
              bgcolor: "rgba(34,197,94,0.04)",
            }}
          >
            <Box
              component="img"
              src={previewUrl}
              alt="Menu item"
              sx={{ width: { xs: "100%", sm: 112 }, height: 96, borderRadius: 2, objectFit: "cover" }}
            />
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
              <CheckCircleOutlineIcon sx={{ color: "#22c55e" }} />
              <Typography variant="body2" fontWeight={600} sx={{ overflowWrap: "anywhere" }}>
                Image attached
              </Typography>
            </Stack>
            <Button
              color="error"
              size="small"
              disabled={uploading || disabled}
              onClick={remove}
              startIcon={<CloseIcon />}
            >
              Remove
            </Button>
          </Stack>
        ) : (
          <Box
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (!disabled) upload(event.dataTransfer.files?.[0]);
            }}
            sx={{
              border: "2px dashed rgba(212,133,10,0.34)",
              borderRadius: 3,
              p: { xs: 2.5, sm: 3.5 },
              textAlign: "center",
              bgcolor: "rgba(212,133,10,0.025)",
            }}
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                mx: "auto",
                mb: 1.5,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                bgcolor: "rgba(212,133,10,0.12)",
                color: "#D4850A",
              }}
            >
              <CloudUploadOutlinedIcon />
            </Box>
            <Typography variant="body2" fontWeight={700}>Choose or drop an image</Typography>
            <Typography variant="caption" color="text.secondary">
              JPG · PNG · WEBP · Max 5 MB
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 2, justifyContent: "center" }}>
              <Button
                variant="outlined"
                disabled={disabled || uploading}
                startIcon={<CloudUploadOutlinedIcon />}
                onClick={() => inputRef.current?.click()}
              >
                Choose image
              </Button>
            </Stack>
          </Box>
        )}

        {uploading && <LinearProgress sx={{ mt: 2 }} />}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Box>
    </Paper>
  );
}
