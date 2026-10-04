"use client";

import { useState } from "react";
import { Alert, Button, Dialog, DialogContent, DialogTitle, Rating, Stack, TextField, Typography } from "@mui/material";
import { orderApi } from "@/lib/api";

export default function OrderReviewDialog({ order, installationId, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!order || !rating || saving) return;
    setSaving(true);
    setError("");
    try {
      await orderApi.submitOrderReview(order.id, installationId, rating, review);
      onSubmitted({ id: order.id, customer_rating: rating, customer_review: review.trim() || null });
    } catch (submitError) {
      setError(submitError.message || "Unable to submit your rating.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={Boolean(order)}
      fullWidth
      maxWidth="xs"
      disableEscapeKeyDown
      onClose={() => {}}
      aria-labelledby="order-review-title"
      PaperProps={{ sx: { bgcolor: "#21150D", color: "#F9EDD8", border: "1px solid #D4850A" } }}
    >
      <DialogTitle id="order-review-title" sx={{ fontWeight: 800 }}>
        Rate your experience
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} alignItems="flex-start">
          <Typography color="#D4A872">
            Your order from {order?.business?.business_name || "this business"} is complete. How was your experience?
          </Typography>
          <Rating
            name="business-rating"
            value={rating}
            onChange={(_, value) => setRating(value || 0)}
            size="large"
            aria-label="Rate this business from one to five stars"
          />
          <TextField
            label="Review (optional)"
            value={review}
            onChange={(event) => setReview(event.target.value)}
            multiline
            minRows={3}
            fullWidth
            inputProps={{ maxLength: 1000 }}
            helperText={`${review.length}/1000`}
            sx={{
              "& .MuiInputBase-root": { color: "#F9EDD8" },
              "& .MuiInputLabel-root": { color: "#D4A872" },
            }}
          />
          {error && <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert>}
          <Button
            onClick={submit}
            disabled={!rating || saving || !installationId}
            variant="contained"
            fullWidth
            sx={{ bgcolor: "#D4850A", color: "#1C0A00", fontWeight: 700 }}
          >
            {saving ? "Submitting…" : "Submit rating"}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
