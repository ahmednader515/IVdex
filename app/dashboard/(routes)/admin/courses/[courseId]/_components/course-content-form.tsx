"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Chapter, Course, Quiz } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { CourseContentList } from "./course-content-list";
import { InlineChapterEditor } from "./inline-chapter-editor";
import { InlineQuizEditor } from "./inline-quiz-editor";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface CourseContentFormProps {
    initialData: Course & {
        chapters: Chapter[];
        quizzes: (Quiz & { _count?: { quizResults: number } })[];
    };
    courseId: string;
    /** From ?openChapter=… when redirecting from legacy chapter URL */
    initialOpenChapterId?: string;
    /** From ?openQuiz=… when redirecting from teacher quiz edit URL */
    initialOpenQuizId?: string;
}

export const CourseContentForm = ({
    initialData,
    courseId,
    initialOpenChapterId,
    initialOpenQuizId,
}: CourseContentFormProps) => {
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [title, setTitle] = useState("");
    const [chapterSheetOpen, setChapterSheetOpen] = useState(false);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
    const [quizSheetOpen, setQuizSheetOpen] = useState(false);
    const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

    const router = useRouter();
    const pathname = usePathname();
    const openedChapterFromQueryRef = useRef(false);
    const openedQuizFromQueryRef = useRef(false);

    const openChapterEditor = (id: string) => {
        setActiveChapterId(id);
        setChapterSheetOpen(true);
    };

    const openQuizEditor = (id: string) => {
        setActiveQuizId(id);
        setQuizSheetOpen(true);
    };

    const onChapterSheetOpenChange = (open: boolean) => {
        setChapterSheetOpen(open);
        if (!open) setActiveChapterId(null);
    };

    const onQuizSheetOpenChange = (open: boolean) => {
        setQuizSheetOpen(open);
        if (!open) setActiveQuizId(null);
    };

    useEffect(() => {
        if (!initialOpenChapterId || openedChapterFromQueryRef.current) return;
        openedChapterFromQueryRef.current = true;
        setActiveChapterId(initialOpenChapterId);
        setChapterSheetOpen(true);
        router.replace(pathname, { scroll: false });
    }, [initialOpenChapterId, pathname, router]);

    useEffect(() => {
        if (!initialOpenQuizId || openedQuizFromQueryRef.current) return;
        openedQuizFromQueryRef.current = true;
        setActiveQuizId(initialOpenQuizId);
        setQuizSheetOpen(true);
        router.replace(pathname, { scroll: false });
    }, [initialOpenQuizId, pathname, router]);

    const onCreate = async () => {
        try {
            setIsUpdating(true);
            const { data } = await axios.post<{ id: string }>(`/api/courses/${courseId}/chapters`, { title });
            toast.success("تم انشاء الدرس");
            setTitle("");
            setIsCreating(false);
            router.refresh();
            if (data?.id) {
                openChapterEditor(data.id);
            }
        } catch {
            toast.error("حدث خطأ");
        } finally {
            setIsUpdating(false);
        }
    }

    const onDelete = async (id: string, type: "chapter" | "quiz") => {
        try {
            setIsUpdating(true);
            if (type === "chapter") {
                if (activeChapterId === id) {
                    onChapterSheetOpenChange(false);
                }
                await axios.delete(`/api/courses/${courseId}/chapters/${id}`);
                toast.success("تم حذف الدرس");
            } else {
                if (activeQuizId === id) {
                    onQuizSheetOpenChange(false);
                }
                await axios.delete(`/api/courses/${courseId}/quizzes/${id}`);
                toast.success("تم حذف الاختبار");
            }
            router.refresh();
        } catch {
            toast.error("حدث خطأ");
        } finally {
            setIsUpdating(false);
        }
    }

    const onReorder = async (updateData: { id: string; position: number; type: "chapter" | "quiz" }[]) => {
        try {
            setIsUpdating(true);
            await axios.put(`/api/courses/${courseId}/reorder`, {
                list: updateData
            });
            toast.success("تم ترتيب المحتوى");
            router.refresh();
        } catch {
            toast.error("حدث خطأ");
        } finally {
            setIsUpdating(false);
        }
    }

    const onEdit = (id: string, type: "chapter" | "quiz") => {
        if (type === "chapter") {
            openChapterEditor(id);
        } else {
            openQuizEditor(id);
        }
    }

    const onQuizResults = (quizId: string) => {
        router.push(`/dashboard/admin/quiz-results?quizId=${quizId}`);
    }

    // Combine chapters and quizzes for display
    const courseItems = [
        ...initialData.chapters.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            position: chapter.position,
            isPublished: chapter.isPublished,
            type: "chapter" as const,
            isFree: chapter.isFree
        })),
        ...initialData.quizzes.map(quiz => ({
            id: quiz.id,
            title: quiz.title,
            position: quiz.position,
            isPublished: quiz.isPublished,
            type: "quiz" as const
        }))
    ].sort((a, b) => a.position - b.position);

    return (
        <div className="relative mt-0 rounded-xl border border-border/80 bg-card p-4 shadow-sm md:p-5">
            {isUpdating && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/50">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            )}
            <div className="text-base font-semibold tracking-tight">
                محتوى الكورس (دروس واختبارات)
            </div>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                أضف دروساً واختبارات ورتّبها بالسحب. ابدأ بإضافة درس أو اختبار من الأزرار أدناه.
            </p>
            {isCreating && (
                <div className="mt-4 space-y-3">
                    <Input
                        disabled={isUpdating}
                        placeholder="مثال: الدرس الأول — المقدمة"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="min-h-12 text-base"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-11 w-full sm:w-auto"
                            disabled={isUpdating}
                            onClick={() => {
                                setIsCreating(false);
                                setTitle("");
                            }}
                        >
                            إلغاء
                        </Button>
                        <Button
                            onClick={onCreate}
                            disabled={!title || isUpdating}
                            type="button"
                            className="min-h-11 w-full bg-brand hover:bg-brand/90 sm:w-auto sm:min-w-[120px]"
                        >
                            إنشاء الدرس
                        </Button>
                    </div>
                </div>
            )}
            {!isCreating && (
                <div
                    className={cn(
                        "mt-3 text-sm",
                        !courseItems.length && "text-muted-foreground"
                    )}
                >
                    {!courseItems.length && (
                        <p className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 py-8 text-center text-sm italic leading-relaxed">
                            لا يوجد محتوى بعد. استخدم الأزرار أسفل الصفحة لإضافة أول درس أو اختبار.
                        </p>
                    )}
                    {courseItems.length > 0 && (
                        <CourseContentList
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onReorder={onReorder}
                            onQuizResults={onQuizResults}
                            items={courseItems}
                        />
                    )}
                </div>
            )}
            {!isCreating && courseItems.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground sm:mt-4">
                    اسحب من المقبض ← لإعادة ترتيب الدروس والاختبارات
                </p>
            )}
            {!isCreating && (
                <div className="mt-4 flex flex-col gap-3 border-t border-border/80 pt-4 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="order-1 min-h-12 w-full justify-center gap-2 text-base font-medium sm:order-1 sm:h-10 sm:min-h-10 sm:w-auto sm:text-sm"
                        onClick={() => router.push(`/dashboard/admin/quizzes/create?courseId=${courseId}`)}
                    >
                        <PlusCircle className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
                        إضافة اختبار
                    </Button>
                    <Button
                        type="button"
                        className="order-2 min-h-12 w-full justify-center gap-2 bg-brand text-base font-medium hover:bg-brand/90 sm:order-2 sm:h-10 sm:min-h-10 sm:w-auto sm:text-sm"
                        onClick={() => setIsCreating((current) => !current)}
                    >
                        <PlusCircle className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
                        إضافة درس
                    </Button>
                </div>
            )}
            <InlineChapterEditor
                open={chapterSheetOpen}
                onOpenChange={onChapterSheetOpenChange}
                courseId={courseId}
                chapterId={activeChapterId}
            />
            <InlineQuizEditor
                open={quizSheetOpen}
                onOpenChange={onQuizSheetOpenChange}
                courseId={courseId}
                quizId={activeQuizId}
            />
        </div>
    );
}; 