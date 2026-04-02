"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, LayoutDashboard, Files } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import axios from "axios";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Editor } from "@/components/editor";
import { Checkbox } from "@/components/ui/checkbox";
import { IconBadge } from "@/components/icon-badge";
import { AttachmentsForm } from "./attachments-form";
import { VideoForm } from "./video-form";

interface ChapterAttachment {
    id: string;
    name: string;
    url: string;
    position: number;
    createdAt: Date | string;
}

const cardClass =
    "rounded-xl border border-border/80 bg-card p-4 shadow-sm md:p-5 ring-offset-background focus-within:ring-2 focus-within:ring-brand/20 focus-within:ring-offset-2";

interface ChapterFormProps {
    initialData: {
        title: string;
        description: string | null;
        isFree: boolean;
        isPublished: boolean;
        attachments: ChapterAttachment[];
        videoUrl: string | null;
        videoType: string | null;
        youtubeVideoId: string | null;
    };
    courseId: string;
    chapterId: string;
    onSaved?: () => void;
}

const titleSchema = z.object({
    title: z.string().min(1, { message: "Lesson title is required" }),
});

const descriptionSchema = z.object({
    description: z.string().min(1, { message: "Description is required" }),
});

const accessSchema = z.object({
    isFree: z.boolean().default(false),
});

export const ChapterForm = ({
    initialData,
    courseId,
    chapterId,
    onSaved,
}: ChapterFormProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const titleForm = useForm<z.infer<typeof titleSchema>>({
        resolver: zodResolver(titleSchema),
        defaultValues: { title: initialData?.title || "" },
    });

    const descriptionForm = useForm<z.infer<typeof descriptionSchema>>({
        resolver: zodResolver(descriptionSchema),
        defaultValues: { description: initialData?.description || "" },
    });

    const accessForm = useForm<z.infer<typeof accessSchema>>({
        resolver: zodResolver(accessSchema),
        defaultValues: { isFree: !!initialData.isFree },
    });

    useEffect(() => {
        titleForm.reset({ title: initialData?.title || "" });
    }, [initialData?.title, titleForm.reset]);

    useEffect(() => {
        descriptionForm.reset({ description: initialData?.description || "" });
    }, [initialData?.description, descriptionForm.reset]);

    useEffect(() => {
        accessForm.reset({ isFree: !!initialData.isFree });
    }, [initialData?.isFree, accessForm.reset]);

    const { isSubmitting: isSubmittingTitle, isValid: isValidTitle } = titleForm.formState;
    const { isSubmitting: isSubmittingDescription, isValid: isValidDescription } =
        descriptionForm.formState;
    const { isSubmitting: isSubmittingAccess, isValid: isValidAccess } = accessForm.formState;

    const onSubmitTitle = async (values: z.infer<typeof titleSchema>) => {
        try {
            const response = await fetch(`/api/courses/${courseId}/chapters/${chapterId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (!response.ok) throw new Error("Failed to update chapter title");
            toast.success("Lesson title saved");
            onSaved?.();
            router.refresh();
        } catch (error) {
            console.error("[CHAPTER_TITLE]", error);
            toast.error("Something went wrong");
        }
    };

    const onSubmitDescription = async (values: z.infer<typeof descriptionSchema>) => {
        try {
            const response = await fetch(`/api/courses/${courseId}/chapters/${chapterId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (!response.ok) throw new Error("Failed to update chapter description");
            toast.success("Lesson description saved");
            onSaved?.();
            router.refresh();
        } catch (error) {
            console.error("[CHAPTER_DESCRIPTION]", error);
            toast.error("Something went wrong");
        }
    };

    const onSubmitAccess = async (values: z.infer<typeof accessSchema>) => {
        try {
            const res = await fetch(`/api/courses/${courseId}/chapters/${chapterId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (!res.ok) throw new Error("access");
            toast.success("Preview settings saved");
            onSaved?.();
            router.refresh();
        } catch (error) {
            console.error("[CHAPTER_ACCESS]", error);
            toast.error("Something went wrong");
        }
    };

    const onPublish = async () => {
        try {
            setIsLoading(true);
            await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}/publish`);
            toast.success(initialData.isPublished ? "Lesson unpublished" : "Lesson published");
            onSaved?.();
            router.refresh();
        } catch {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isMounted) {
        return null;
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-x-2">
                <IconBadge icon={LayoutDashboard} />
                <h2 className="text-xl font-semibold tracking-tight">Lesson settings</h2>
            </div>

            <div className={cardClass}>
                <Form {...titleForm}>
                    <form onSubmit={titleForm.handleSubmit(onSubmitTitle)} className="space-y-3">
                        <FormField
                            control={titleForm.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-base font-semibold">Lesson title</FormLabel>
                                    <FormDescription className="text-sm leading-relaxed">
                                        Shown to students in the lesson list.
                                    </FormDescription>
                                    <FormControl>
                                        <Input
                                            disabled={isSubmittingTitle}
                                            placeholder="e.g. Lesson 1 — Introduction"
                                            className="min-h-12 text-base md:min-h-11"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            disabled={!isValidTitle || isSubmittingTitle}
                            className="mt-2 w-full min-h-11 bg-brand text-white hover:bg-brand/90 sm:w-auto sm:min-h-10"
                        >
                            {isSubmittingTitle ? "Saving..." : "Save title"}
                        </Button>
                    </form>
                </Form>
            </div>

            <div className={cardClass}>
                <Form {...descriptionForm}>
                    <form
                        onSubmit={descriptionForm.handleSubmit(onSubmitDescription)}
                        className="space-y-3"
                    >
                        <FormField
                            control={descriptionForm.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-base font-semibold">Lesson description</FormLabel>
                                    <FormDescription className="text-sm leading-relaxed">
                                        A short overview of what students learn in this lesson.
                                    </FormDescription>
                                    <FormControl>
                                        <Editor
                                            onChange={field.onChange}
                                            value={field.value}
                                            placeholder="Write the lesson description..."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            disabled={!isValidDescription || isSubmittingDescription}
                            className="mt-2 w-full min-h-11 bg-brand text-white hover:bg-brand/90 sm:w-auto sm:min-h-10"
                        >
                            {isSubmittingDescription ? "Saving..." : "Save description"}
                        </Button>
                    </form>
                </Form>
            </div>

            <div className={cardClass}>
                <Form {...accessForm}>
                    <form onSubmit={accessForm.handleSubmit(onSubmitAccess)} className="space-y-3">
                        <FormLabel className="text-base font-semibold">Free preview</FormLabel>
                        <FormDescription className="text-sm leading-relaxed">
                            Allow this lesson to be viewed without purchasing the full course.
                        </FormDescription>
                        <FormField
                            control={accessForm.control}
                            name="isFree"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-lg border border-border/60 bg-muted/20 p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            className="mt-1"
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-snug">
                                        <span className="text-sm font-medium">Free preview lesson</span>
                                        <p className="text-xs text-muted-foreground">
                                            When enabled, visitors can watch this lesson before purchase.
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            disabled={!isValidAccess || isSubmittingAccess}
                            className="w-full min-h-11 bg-brand text-white hover:bg-brand/90 sm:w-auto sm:min-h-10"
                        >
                            {isSubmittingAccess ? "Saving..." : "Save preview settings"}
                        </Button>
                    </form>
                </Form>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-x-2">
                    <IconBadge icon={Files} />
                    <h3 className="text-lg font-semibold tracking-tight">Lesson documents</h3>
                </div>
                <AttachmentsForm
                    initialData={{ attachments: initialData.attachments || [] }}
                    courseId={courseId}
                    chapterId={chapterId}
                    onSaved={onSaved}
                />
            </div>

            <div className="space-y-3">
                <VideoForm
                    initialData={{
                        videoUrl: initialData.videoUrl,
                        videoType: initialData.videoType,
                        youtubeVideoId: initialData.youtubeVideoId,
                    }}
                    courseId={courseId}
                    chapterId={chapterId}
                    onSaved={onSaved}
                />
            </div>

            <div className={cn(cardClass, "space-y-4")}>
                <div>
                    <h3 className="text-base font-semibold">
                        {initialData.isPublished ? "Lesson is published" : "Lesson is not published"}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {initialData.isPublished
                            ? "Students can view this lesson now. You can unpublish to hide it temporarily."
                            : "This lesson will not be visible to students until you publish it."}
                    </p>
                </div>
                <Button
                    onClick={onPublish}
                    disabled={isLoading}
                    variant={initialData.isPublished ? "outline" : "default"}
                    className={cn(
                        "w-full min-h-12 text-base font-semibold sm:w-auto sm:min-h-11",
                        !initialData.isPublished && "bg-brand text-white hover:bg-brand/90"
                    )}
                >
                    {initialData.isPublished ? (
                        <>
                            <EyeOff className="h-5 w-5 mr-2 shrink-0" />
                            Unpublish
                        </>
                    ) : (
                        <>
                            <Eye className="h-5 w-5 mr-2 shrink-0" />
                            Publish lesson
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
