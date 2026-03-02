import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const RATING_DISMISSED_KEY = "biofit_rating_dismissed";
const RATING_SUBMITTED_KEY = "biofit_rating_submitted";

export default function RatingPopup() {
  const [open, setOpen] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const alreadySubmitted = localStorage.getItem(RATING_SUBMITTED_KEY);
    const dismissed = localStorage.getItem(RATING_DISMISSED_KEY);

    if (alreadySubmitted) return;

    // If dismissed, wait 24h before showing again
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return;
    }

    const timer = setTimeout(() => setOpen(true), 15000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    if (selectedStar === 0) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("ratings").insert({
      rating: selectedStar,
      user_id: user?.id ?? "anonymous",
    });

    setSubmitting(false);

    if (error) {
      toast({ title: "Oops", description: "Could not save your rating. Try again later.", variant: "destructive" });
      return;
    }

    localStorage.setItem(RATING_SUBMITTED_KEY, "true");
    toast({ title: "Thank you! 🎉", description: "Your feedback helps us improve BioFit." });
    setOpen(false);
  };

  const handleLater = () => {
    localStorage.setItem(RATING_DISMISSED_KEY, Date.now().toString());
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleLater(); }}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Enjoying BioFit?</DialogTitle>
          <DialogDescription>Tap a star to rate your experience</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setSelectedStar(star)}
              className="transition-transform hover:scale-110 focus:outline-none"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={`w-10 h-10 transition-colors ${
                  star <= (hoveredStar || selectedStar)
                    ? "text-biofit-amber fill-biofit-amber"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleSubmit} disabled={selectedStar === 0 || submitting} className="w-full">
            {submitting ? "Submitting…" : "Submit Rating"}
          </Button>
          <Button variant="ghost" onClick={handleLater} className="w-full text-muted-foreground">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
