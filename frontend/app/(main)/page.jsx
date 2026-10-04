// ─────────────────────────────────────────────────────────────────────────────
// FILE: smartmenuai/frontend/app/(main)/page.jsx
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Stack,
    Typography,
    alpha,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import { useState } from "react";
import { useReactNative } from "@/lib/contexts/ReactNativeWrapper";
import AppDownloadPrompt from "@/components/customer/AppDownloadPrompt";

export default function MainPage() {
    const { isNative, openCustomerQrScanner } = useReactNative();
    const [scanDialogOpen, setScanDialogOpen] = useState(false);
    const [scanError, setScanError] = useState("");

    const handleScanQrCode = async () => {
        setScanError("");
        if (!isNative && !window.ReactNativeWebView) {
            setScanDialogOpen(true);
            return;
        }

        try {
            await openCustomerQrScanner();
        } catch (error) {
            setScanError(error.message || "Unable to open the QR scanner.");
            setScanDialogOpen(true);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100dvh",
                display: "grid",
                placeItems: "center",
                px: { xs: 2, sm: 3 },
                py: { xs: 5, sm: 8 },
                background: "radial-gradient(ellipse at 50% 0%, rgba(212,133,10,0.12), transparent 55%), #0D0400",
            }}
        >
            <Stack spacing={3} sx={{ width: "100%", maxWidth: 760, textAlign: "center" }}>
                <Typography
                    component="h1"
                    sx={{
                        color: "#F9EDD8",
                        fontFamily: '"Playfair Display", Georgia, serif',
                        fontSize: { xs: "2.4rem", sm: "3.6rem" },
                        fontWeight: 700,
                        lineHeight: 1.1,
                    }}
                >
                    Welcome to SmartMenu AI
                </Typography>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, sm: 5 },
                        borderRadius: 4,
                        bgcolor: "rgba(45,18,0,0.52)",
                        border: `1px solid ${alpha("#D4850A", 0.24)}`,
                    }}
                >
                    <Stack alignItems="center" spacing={2}>
                        <Typography sx={{ color: "#F5C842", fontWeight: 700, fontSize: "1.2rem" }}>
                            Are you a customer?
                        </Typography>
                        <Typography sx={{ maxWidth: 560, color: "#D4A872", lineHeight: 1.7 }}>
                            Scan the QR code at your table with your phone camera to open that
                            business&apos;s menu, place an order, and request service. No account is
                            needed.
                        </Typography>
                    </Stack>
                </Paper>
                <AppDownloadPrompt hidden={isNative} />
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<QrCodeScannerIcon />}
                    onClick={handleScanQrCode}
                    sx={{
                        alignSelf: "center",
                        color: "#1C0A00",
                        bgcolor: "#D4850A",
                        borderRadius: 3,
                        px: 3,
                        fontWeight: 700,
                        "&:hover": { bgcolor: "#E8970F" },
                    }}
                >
                    Scan QR code
                </Button>
                <Button
                    component="a"
                    href="/business-landing"
                    variant="outlined"
                    size="large"
                    sx={{
                        alignSelf: "center",
                        color: "#F9EDD8",
                        borderColor: alpha("#D4850A", 0.45),
                        borderRadius: 3,
                        px: 3,
                        "&:hover": {
                            borderColor: "#D4850A",
                            bgcolor: alpha("#D4850A", 0.08),
                        },
                    }}
                >
                    Manage Business Instead
                </Button>
            </Stack>
            <Dialog
                open={scanDialogOpen}
                onClose={() => setScanDialogOpen(false)}
                aria-labelledby="scan-qr-dialog-title"
            >
                <DialogTitle id="scan-qr-dialog-title">
                    {scanError ? "QR scanner unavailable" : "Scan a table QR code"}
                </DialogTitle>
                <DialogContent>
                    <Alert severity={scanError ? "error" : "info"}>
                        {scanError ||
                            "Open your phone's camera app, scan the QR code at your table, and follow the link displayed to open the menu."}
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setScanDialogOpen(false)} autoFocus>
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}