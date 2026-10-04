"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import { platformApi } from "@/lib/api";

export default function SupportPage() {
  const [contacts, setContacts] = useState({ email: "", phone: "", whatsapp: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    let active = true;
    platformApi.getAppLinks()
      .then((response) => {
        if (!active) return;
        setContacts({
          email: response.email || "",
          phone: response.supportPhoneNumber || "",
          whatsapp: response.whatsappSupportNumber || "",
        });
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Unable to load support contact details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const copyNumber = async () => {
    const number = contacts.phone || contacts.whatsapp;
    if (!number) return;
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(number);
        copied = true;
      }
    } catch {
      copied = false;
    }
    if (!copied) {
      const textarea = document.createElement("textarea");
      textarea.value = number;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      try {
        textarea.select();
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      } finally {
        textarea.remove();
      }
    }
    setCopyMessage(
      copied ? "Support number copied." : "Could not copy the support number. Please copy it manually."
    );
  };

  const phoneLink = contacts.phone.replace(/[^\d+]/g, "");
  const whatsappNumber = contacts.whatsapp.replace(/\D/g, "");

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "#100904", color: "#F9EDD8", px: 2, py: 5 }}>
      <Card
        elevation={0}
        sx={{
          maxWidth: 620,
          mx: "auto",
          bgcolor: "rgba(45,18,0,0.7)",
          color: "inherit",
          border: "1px solid rgba(212,133,10,0.25)",
          borderRadius: 4,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={2.5} alignItems="flex-start">
            <SupportAgentOutlinedIcon sx={{ color: "#D4850A", fontSize: 42 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: '"Playfair Display", Georgia, serif' }}>
                Contact support
              </Typography>
              <Typography sx={{ color: "#D4A872", mt: 1 }}>
                Choose the way that works best for you.
              </Typography>
            </Box>

            {loading && <CircularProgress size={24} aria-label="Loading support details" />}
            {error && <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert>}
            {!loading && !error && !contacts.phone && !contacts.whatsapp && !contacts.email && (
              <Alert severity="info" sx={{ width: "100%" }}>
                Support contact details have not been configured yet.
              </Alert>
            )}
            {copyMessage && (
              <Alert severity={copyMessage === "Support number copied." ? "success" : "error"} sx={{ width: "100%" }}>
                {copyMessage}
              </Alert>
            )}

            {contacts.phone && (
              <Button
                component="a"
                href={`tel:${phoneLink}`}
                startIcon={<CallOutlinedIcon />}
                variant="contained"
                fullWidth
                sx={{ justifyContent: "flex-start", py: 1.4, bgcolor: "#D4850A", color: "#1C0A00" }}
              >
                Call support · {contacts.phone}
              </Button>
            )}
            {contacts.whatsapp && whatsappNumber && (
              <Button
                component="a"
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<ChatOutlinedIcon />}
                variant="outlined"
                fullWidth
                sx={{ justifyContent: "flex-start", py: 1.4, color: "#F9EDD8", borderColor: "rgba(212,133,10,0.45)" }}
              >
                Message support on WhatsApp · {contacts.whatsapp}
              </Button>
            )}
            {(contacts.phone || contacts.whatsapp) && (
              <Button
                onClick={copyNumber}
                startIcon={<ContentCopyIcon />}
                variant="outlined"
                fullWidth
                sx={{ justifyContent: "flex-start", py: 1.4, color: "#F9EDD8", borderColor: "rgba(212,133,10,0.45)" }}
              >
                Copy support number
              </Button>
            )}
            {contacts.email && (
              <Button
                component="a"
                href={`mailto:${contacts.email}?subject=SmartMenu%20AI%20support`}
                startIcon={<EmailOutlinedIcon />}
                variant="outlined"
                fullWidth
                sx={{ justifyContent: "flex-start", py: 1.4, color: "#F9EDD8", borderColor: "rgba(212,133,10,0.45)" }}
              >
                Email support · {contacts.email}
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
