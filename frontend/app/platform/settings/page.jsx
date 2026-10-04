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
  const [links, setLinks] = useState({
    email: "",
    supportPhoneNumber: "",
    android: "",
    ios: "",
    waiterCallDelay: 1,
    requestBillDelay: 1,
    businessTerminology: JSON.stringify({
      bar: {
        menu: "drinks",
        waiter: "atteindant",
      },
    }, null, 2),
  });
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
            email: response.email || "",
            supportPhoneNumber: response.supportPhoneNumber || "",
            android: response.appLinks?.android || "",
            ios: response.appLinks?.ios || "",
            waiterCallDelay: response.waiterCallDelay || 1,
            requestBillDelay: response.requestBillDelay || 1,
            businessTerminology: JSON.stringify(response.businessTerminology || {}, null, 2),
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
    const delay = Number(links.waiterCallDelay);
    const billDelay = Number(links.requestBillDelay);
    if (!Number.isInteger(delay) || delay < 1 || delay > 1440 ||
      !Number.isInteger(billDelay) || billDelay < 1 || billDelay > 1440) {
      setError("Waiter call and bill request delays must be whole numbers from 1 to 1440 minutes.");
      return;
    }
    let businessTerminology;
    try {
      businessTerminology = JSON.parse(links.businessTerminology);
    } catch {
      setError("Business terminology must be valid JSON.");
      return;
    }
    if (!businessTerminology || typeof businessTerminology !== "object" || Array.isArray(businessTerminology)) {
      setError("Business terminology must be a JSON object grouped by business type.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await platformApi.updateAppLinks({ ...links, businessTerminology });
      toast("Platform settings saved", "success");
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
          Configure customer app links and the table-level waiter and bill-request cooldowns.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2.5}>
          <TextField
            label="Email"
            type="email"
            value={links.email}
            onChange={(event) => setLinks((current) => ({ ...current, email: event.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="Support phone number"
            type="tel"
            value={links.supportPhoneNumber}
            onChange={(event) => setLinks((current) => ({
              ...current,
              supportPhoneNumber: event.target.value,
            }))}
            fullWidth
          />
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
          <TextField
            label="Waiter call delay (minutes)"
            type="number"
            value={links.waiterCallDelay}
            onChange={(event) => setLinks((current) => ({
              ...current,
              waiterCallDelay: event.target.value,
            }))}
            inputProps={{ min: 1, max: 1440, step: 1 }}
            helperText="Minimum time before a customer can call a waiter again. Default: 1 minute."
            fullWidth
            required
          />
          <TextField
            label="Request bill delay (minutes)"
            type="number"
            value={links.requestBillDelay}
            onChange={(event) => setLinks((current) => ({
              ...current,
              requestBillDelay: event.target.value,
            }))}
            inputProps={{ min: 1, max: 1440, step: 1 }}
            helperText="Minimum time before a customer can request the bill again for the same table. Default: 1 minute."
            fullWidth
            required
          />
          <TextField
            label="Business terminology (JSON)"
            value={links.businessTerminology}
            onChange={(event) => setLinks((current) => ({
              ...current,
              businessTerminology: event.target.value,
            }))}
            multiline
            minRows={6}
            fullWidth
            helperText={'Map business types to word overrides, e.g. {"bar":{"menu":"drinks","waiter":"atteindant"}}.'}
            InputLabelProps={{ shrink: true }}
          />
          <Button type="submit" variant="contained" disabled={saving} sx={{ alignSelf: "flex-start" }}>
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
