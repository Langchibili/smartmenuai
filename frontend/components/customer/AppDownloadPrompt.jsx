"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { platformApi } from "@/lib/api";

export default function AppDownloadPrompt({ hidden = false }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [links, setLinks] = useState({
    android: "",
    ios: "",
    email: "",
    supportPhoneNumber: "",
  });

  const openDownloadDialog = async () => {
    setOpen(true);
    setError("");
    setLoading(true);
    try {
      const response = await platformApi.getAppLinks();
      setLinks({
        android: response.appLinks?.android || "",
        ios: response.appLinks?.ios || "",
        email: response.email || "",
        supportPhoneNumber: response.supportPhoneNumber || "",
      });
    } catch (loadError) {
      setError(loadError.message || "Unable to load app download links.");
    } finally {
      setLoading(false);
    }
  };

  if (hidden) return null;

  return (
    <>
      <Button
        fullWidth
        variant="text"
        onClick={openDownloadDialog}
        sx={{
          color: "#1C0A00",
          bgcolor: "#D4850A",
          fontWeight: 700,
          "&:hover": { bgcolor: "#E8970F" },
        }}
      >
        Download the app for a better experience
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="customer-app-download-title"
      >
        <DialogTitle id="customer-app-download-title">
          Download SmartMenu AI
        </DialogTitle>
        <DialogContent>
          {error ? (
            <Alert severity="error">{error}</Alert>
          ) : loading ? (
            <Typography color="text.secondary">Loading app links…</Typography>
          ) : (
            <Stack spacing={1.5} sx={{ minWidth: { sm: 360 }, pt: 1 }}>
              {links.android ? (
                <Button component="a" href={links.android} target="_blank" rel="noopener noreferrer" variant="contained">
                  Get it on Google Play
                </Button>
              ) : (
                <Alert severity="info">Android app link has not been configured yet.</Alert>
              )}
              {links.ios ? (
                <Button component="a" href={links.ios} target="_blank" rel="noopener noreferrer" variant="outlined">
                  Download on the App Store
                </Button>
              ) : (
                <Alert severity="info">iOS app link has not been configured yet.</Alert>
              )}
              {(links.email || links.supportPhoneNumber) && (
                <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
                  Support: {links.email}
                  {links.email && links.supportPhoneNumber ? " · " : ""}
                  {links.supportPhoneNumber}
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
