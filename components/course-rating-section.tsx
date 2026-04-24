"use client";

import { useEffect, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type RatingState = {
  ratingAverage: number;
  ratingCount: number;
  myRating: number | null;
};

export function CourseRatingSection({ courseId }: { courseId: string }) {
  const [state, setState] = useState<RatingState>({
    ratingAverage: 0,
    ratingCount: 0,
    myRating: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const effectiveRating = hoverRating ?? state.myRating ?? 0;

  const ratingLabel = useMemo(() => {
    if (state.ratingCount === 0) return "No ratings yet";
    return `${state.ratingAverage.toFixed(1)} (${state.ratingCount})`;
  }, [state.ratingAverage, state.ratingCount]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/courses/${courseId}/rating`);
        if (!cancelled) setState(res.data as RatingState);
      } catch (error) {
        // If the user isn't eligible, don't spam errors—just hide the section quietly.
        const axiosError = error as AxiosError;
        if (!cancelled && axiosError.response?.status !== 403) {
          toast.error("Failed to load rating");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const setRating = async (rating: number) => {
    try {
      setSaving(true);
      setState((prev) => ({ ...prev, myRating: rating }));
      await axios.put(`/api/courses/${courseId}/rating`, { rating });
      const refreshed = await axios.get(`/api/courses/${courseId}/rating`);
      setState(refreshed.data as RatingState);
      toast.success("Rating saved");
    } catch (error) {
      toast.error("Failed to save rating");
      // Best-effort: refetch to reconcile UI if optimistic update was wrong.
      try {
        const refreshed = await axios.get(`/api/courses/${courseId}/rating`);
        setState(refreshed.data as RatingState);
      } catch {
        // ignore
      }
    } finally {
      setSaving(false);
    }
  };

  // If user isn't allowed (403), API call will fail; we keep it simple and show nothing.
  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="h-4 w-40 rounded bg-muted animate-pulse" />
        <div className="mt-3 flex gap-1">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-5 w-5 rounded bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">Rate this course</p>
          <p className="text-xs text-muted-foreground">{ratingLabel}</p>
        </div>
        {saving ? <span className="text-xs text-muted-foreground">Saving…</span> : null}
      </div>

      <div
        className={cn("mt-3 flex items-center gap-1", saving && "opacity-70 pointer-events-none")}
        onMouseLeave={() => setHoverRating(null)}
      >
        {Array.from({ length: 5 }).map((_, i) => {
          const starValue = i + 1;
          const active = starValue <= effectiveRating;
          return (
            <button
              key={starValue}
              type="button"
              className="p-0.5"
              aria-label={`Rate ${starValue} star${starValue === 1 ? "" : "s"}`}
              onMouseEnter={() => setHoverRating(starValue)}
              onFocus={() => setHoverRating(starValue)}
              onClick={() => setRating(starValue)}
            >
              <Star
                className={cn(
                  "h-5 w-5 transition-colors",
                  active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

