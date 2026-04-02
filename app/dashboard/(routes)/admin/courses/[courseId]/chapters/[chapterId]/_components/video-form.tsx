"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Video, Youtube, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { PlyrVideoPlayer } from "@/components/plyr-video-player";
import { IconBadge } from "@/components/icon-badge";
import { cn } from "@/lib/utils";

interface VideoFormProps {
    initialData: {
        videoUrl: string | null;
        videoType: string | null;
        youtubeVideoId: string | null;
    };
    courseId: string;
    chapterId: string;
    onSaved?: () => void;
}

const cardClass =
    "rounded-xl border border-border/80 bg-card p-4 shadow-sm md:p-5 ring-offset-background focus-within:ring-2 focus-within:ring-brand/20 focus-within:ring-offset-2";

export const VideoForm = ({
    initialData,
    courseId,
    chapterId,
    onSaved,
}: VideoFormProps) => {
    const [isMounted, setIsMounted] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const onSubmitYouTube = async () => {
        if (!youtubeUrl.trim()) {
            toast.error("Please enter a YouTube URL");
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await fetch(`/api/courses/${courseId}/chapters/${chapterId}/youtube`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ youtubeUrl }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || "Failed to add YouTube video");
            }

            toast.success("YouTube video added successfully");
            setYoutubeUrl("");
            onSaved?.();
            router.refresh();
        } catch (error) {
            console.error("[CHAPTER_YOUTUBE]", error);
            toast.error(error instanceof Error ? error.message : "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isMounted) {
        return null;
    }

    return (
        <div className={cn(cardClass, "space-y-4")}>
            <div className="flex items-center gap-x-2">
                <IconBadge icon={Video} />
                <div>
                    <h3 className="text-base font-semibold">Lesson video</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Attach a YouTube video for this lesson. An aspect ratio that works on small screens is recommended.
                    </p>
                </div>
            </div>

            <div
                className={cn(
                    "relative w-full overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/40",
                    "aspect-video max-h-[240px] sm:max-h-[280px]"
                )}
            >
                {initialData.videoUrl ? (
                    <PlyrVideoPlayer
                        videoUrl={initialData.videoType === "UPLOAD" ? initialData.videoUrl : undefined}
                        youtubeVideoId={
                            initialData.videoType === "YOUTUBE"
                                ? initialData.youtubeVideoId || undefined
                                : undefined
                        }
                        videoType={(initialData.videoType as "UPLOAD" | "YOUTUBE") || "UPLOAD"}
                        className="h-full w-full"
                    />
                ) : (
                    <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 p-6 text-center">
                        <Video className="h-12 w-12 text-muted-foreground/70" aria-hidden />
                        <p className="text-sm font-medium text-muted-foreground">No video yet</p>
                        <p className="text-xs text-muted-foreground">Enter a YouTube link below</p>
                    </div>
                )}
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 sm:p-4">
                <div className="mb-3 flex items-center gap-2">
                    <Youtube className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                    <p className="text-sm font-medium">YouTube video URL</p>
                </div>
                <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                    Paste the video URL from YouTube. Supports youtube.com/watch, youtu.be, and /embed/
                </p>
                <div className="space-y-2">
                    <Label htmlFor="youtube-url" className="text-base font-medium">
                        URL
                    </Label>
                    <Input
                        id="youtube-url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="min-h-12 text-base"
                        disabled={isSubmitting}
                    />
                    <Button
                        type="button"
                        onClick={onSubmitYouTube}
                        disabled={isSubmitting || !youtubeUrl.trim()}
                        className="w-full min-h-11 bg-brand text-white hover:bg-brand/90 sm:w-auto"
                    >
                        <Link className="h-4 w-4 mr-2" />
                        {initialData.videoType === "YOUTUBE" && initialData.youtubeVideoId
                            ? "Update video"
                            : "Add video"}
                    </Button>
                </div>
            </div>
        </div>
    );
};
