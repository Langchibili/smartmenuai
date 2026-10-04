"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { platformApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast-provider";

export default function PlatformSettingsPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [links, setLinks] = useState({ android: "", ios: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user || !profile?.is_platform_admin) {
      router.replace("/login");
      return;
    }

    let active = true;
    platformApi.getAppLinks()
      .then((response) => {
        if (active) {
          setLinks({
            android: response.appLinks?.android || "",
            ios: response.appLinks?.ios || "",
          });
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Unable to load app links.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [authLoading, profile?.is_platform_admin, router, user]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await platformApi.updateAppLinks(links);
      toast("App download links saved", "success");
    } catch (saveError) {
      setError(saveError.message || "Unable to save app links.");
      toast(saveError.message || "Unable to save app links.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <Box sx={{ p: 4, color: "#F9EDD8" }}>Loading platform settings…</Box>;
  }

  return (
    <Box sx={{ minHeight: "100dvh", px: { xs: 2, sm: 4 }, py: 4, bgcolor: "#0D0400" }}>
      <Paper
        component="form"
        onSubmit={save}
        elevation={0}
        sx={{
          maxWidth: 720,
          mx: "auto",
          p: { xs: 2.5, sm: 4 },
          bgcolor: "rgba(45,18,0,0.7)",
          color: "#F9EDD8",
          border: "1px solid rgba(212,133,10,0.25)",
          borderRadius: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700 }}>
          Platform settings
        </Typography>
        <Typography sx={{ mt: 1, mb: 3, color: "#D4A872" }}>
          Configure the app store links shown to customers on the web experience.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2.5}>
          <TextField
            label="Android app link"
            type="url"
            value={links.android}
            onChange={(event) => setLinks((current) => ({ ...current, android: event.target.value }))}
            placeholder="https://play.google.com/store/apps/details?id=..."
            fullWidth
            helperText="Use the Google Play listing URL, or leave blank until it is available."
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="iOS app link"
            type="url"
            value={links.ios}
            onChange={(event) => setLinks((current) => ({ ...current, ios: event.target.value }))}
            placeholder="https://apps.apple.com/app/..."
            fullWidth
            helperText="Use the App Store listing URL, or leave blank until it is available."
            InputLabelProps={{ shrink: true }}
          />
          <Button type="submit" variant="contained" disabled={saving} sx={{ alignSelf: "flex-start" }}>
            {saving ? "Saving…" : "Save app links"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
