"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChapterForm } from "@/app/dashboard/(routes)/admin/courses/[courseId]/chapters/[chapterId]/_components/chapter-form";
import { Loader2, X } from "lucide-react";

type ChapterApiPayload = {
  id: string;
  title: string;
  description: string | null;
  isFree: boolean;
  isPublished: boolean;
  videoUrl: string | null;
  videoType: string | null;
  youtubeVideoId: string | null;
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    position: number;
    createdAt: string;
  }>;
};

interface InlineChapterEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  chapterId: string | null;
}

export function InlineChapterEditor({
  open,
  onOpenChange,
  courseId,
  chapterId,
}: InlineChapterEditorProps) {
  const router = useRouter();
  const [chapter, setChapter] = useState<ChapterApiPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const loadChapter = useCallback(async (bumpFormKey: boolean) => {
    if (!chapterId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/chapters/${chapterId}`);
      if (!res.ok) {
        throw new Error("تعذر تحميل الدرس");
      }
      const data = await res.json();
      setChapter({
        id: data.id,
        title: data.title,
        description: data.description,
        isFree: data.isFree,
        isPublished: data.isPublished,
        videoUrl: data.videoUrl,
        videoType: data.videoType,
        youtubeVideoId: data.youtubeVideoId,
        attachments: (data.attachments || []).map(
          (a: { id: string; name: string; url: string; position: number; createdAt: string | Date }) => ({
            ...a,
            createdAt: typeof a.createdAt === "string" ? a.createdAt : a.createdAt.toISOString(),
          })
        ),
      });
      if (bumpFormKey) setReloadKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
      setChapter(null);
    } finally {
      setLoading(false);
    }
  }, [courseId, chapterId]);

  useEffect(() => {
    if (!open || !chapterId) {
      setChapter(null);
      setError(null);
      return;
    }
    loadChapter(false);
  }, [open, chapterId, loadChapter]);

  const onSaved = useCallback(() => {
    loadChapter(true);
    router.refresh();
  }, [loadChapter, router]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        dir="rtl"
        className="flex w-full max-w-full flex-col gap-0 overflow-hidden border-l p-0 sm:max-w-xl md:max-w-2xl"
      >
        <SheetHeader className="relative space-y-1 border-b px-4 py-4 pr-14 text-right sm:px-6 sm:pr-16">
          <SheetClose className="absolute left-3 top-3 rounded-md p-2 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="h-5 w-5" />
            <span className="sr-only">إغلاق</span>
          </SheetClose>
          <SheetTitle className="text-lg sm:text-xl">
            {chapter?.title ? `تعديل: ${chapter.title}` : "إعدادات الدرس"}
          </SheetTitle>
          <SheetDescription className="text-sm leading-relaxed">
            كل التفاصيل في هذه اللوحة — لا حاجة لصفحة أخرى. أغلق اللوحة للعودة لقائمة المحتوى.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-brand" />
              <p className="text-sm">جاري تحميل الدرس...</p>
            </div>
          )}
          {error && !loading && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center text-sm text-destructive">
              {error}
            </p>
          )}
          {chapter && !loading && !error && (
            <div key={reloadKey} className="space-y-8 pb-8">
              <ChapterForm
                initialData={{
                  title: chapter.title,
                  description: chapter.description,
                  isFree: chapter.isFree,
                  isPublished: chapter.isPublished,
                  attachments: chapter.attachments,
                  videoUrl: chapter.videoUrl,
                  videoType: chapter.videoType,
                  youtubeVideoId: chapter.youtubeVideoId,
                }}
                courseId={courseId}
                chapterId={chapterId!}
                onSaved={onSaved}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
