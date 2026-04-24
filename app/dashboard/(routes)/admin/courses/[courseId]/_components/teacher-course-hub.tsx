"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Chapter, Course, Quiz } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconBadge } from "@/components/icon-badge";
import { PublishCourseBar } from "./actions";
import { TitleForm } from "./title-form";
import { DescriptionForm } from "./description-form";
import { ImageForm } from "./image-form";
import { PriceForm } from "./price-form";
import { CourseContentForm } from "./course-content-form";
import {
  LayoutDashboard,
  ListChecks,
  BookOpen,
  Users,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Trash2,
  CornerDownRight,
} from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type QuizWithCount = Quiz & { _count?: { quizResults: number } };

type HubTab = "overview" | "details" | "content" | "students" | "comments";

type AdminChapterComment = {
  id: string;
  body: string;
  isHidden: boolean;
  createdAt: string | Date;
  parentId?: string | null;
  user: { id: string; fullName: string; image: string | null; role?: string | null };
};

function formatCommenterDisplayName(
  user: AdminChapterComment["user"],
  courseOwnerId: string
) {
  const base = user.fullName?.trim() || "User";
  const role = user.role ?? "STUDENT";

  if (role === "ADMIN") return `${base} (Admin)`;
  if (role === "ADMIN_ASSISTANT") return `${base} (Admin assistant)`;
  if (user.id === courseOwnerId) return `${base} (Teacher)`;

  return base;
}

export type CoursePurchaseRow = {
  id: string;
  createdAt: string;
  user: { id: string; fullName: string; phoneNumber: string };
};

type CompletionStatus = {
  title: boolean;
  description: boolean;
  imageUrl: boolean;
  price: boolean;
  publishedChapters: boolean;
};

type TeacherCourseHubProps = {
  courseId: string;
  course: Course & { chapters: Chapter[]; quizzes: QuizWithCount[] };
  purchases: CoursePurchaseRow[];
  completionStatus: CompletionStatus;
  isComplete: boolean;
  completedFields: number;
  totalFields: number;
  isPublished: boolean;
  /** Opens content tab + chapter sheet when set (e.g. ?openChapter= from legacy URL) */
  initialOpenChapterId?: string;
  /** Opens content tab + quiz sheet when set (e.g. ?openQuiz= from quiz edit redirect) */
  initialOpenQuizId?: string;
  /** Deep-link hub tab e.g. ?tab=content after creating a quiz */
  initialTab?: HubTab;
};

export function TeacherCourseHub({
  courseId,
  course,
  purchases,
  completionStatus,
  isComplete,
  completedFields,
  totalFields,
  isPublished,
  initialOpenChapterId,
  initialOpenQuizId,
  initialTab,
}: TeacherCourseHubProps) {
  const [tab, setTab] = useState<HubTab>(() => {
    if (initialOpenChapterId || initialOpenQuizId) return "content";
    if (
      initialTab === "content" ||
      initialTab === "details" ||
      initialTab === "students" ||
      initialTab === "overview" ||
      initialTab === "comments"
    ) {
      return initialTab;
    }
    return "overview";
  });

  const [selectedChapterId, setSelectedChapterId] = useState<string>(() => {
    const first = course.chapters[0]?.id;
    return first || "";
  });
  const [comments, setComments] = useState<AdminChapterComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentBusyId, setCommentBusyId] = useState<string | null>(null);
  const [newCommentBody, setNewCommentBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyPosting, setReplyPosting] = useState(false);

  const adminCommentChildrenByParentId = useMemo(() => {
    const byParent = new Map<string, AdminChapterComment[]>();
    for (const c of comments) {
      if (!c.parentId) continue;
      const arr = byParent.get(c.parentId) ?? [];
      arr.push(c);
      byParent.set(c.parentId, arr);
    }
    for (const [, arr] of byParent) {
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return byParent;
  }, [comments]);

  const adminCommentRoots = useMemo(() => {
    return comments
      .filter((c) => !c.parentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [comments]);

  const refreshAdminComments = async () => {
    if (!selectedChapterId) return;
    const res = await axios.get(
      `/api/admin/courses/${courseId}/chapters/${selectedChapterId}/comments`
    );
    setComments(res.data as AdminChapterComment[]);
  };

  const postAdminReply = async (parentId: string) => {
    const trimmed = replyBody.trim();
    if (!trimmed || !selectedChapterId) return;
    try {
      setReplyPosting(true);
      await axios.post(
        `/api/admin/courses/${courseId}/chapters/${selectedChapterId}/comments`,
        { body: trimmed, parentId }
      );
      setReplyBody("");
      setReplyToId(null);
      await refreshAdminComments();
      toast.success("Reply posted");
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setReplyPosting(false);
    }
  };

  const publishedChapters = course.chapters.filter((c) => c.isPublished).length;
  const totalQuizAttempts = course.quizzes.reduce(
    (acc, q) => acc + (q._count?.quizResults ?? 0),
    0
  );

  const detailsDone =
    completionStatus.title &&
    completionStatus.description &&
    completionStatus.price &&
    completionStatus.imageUrl;

  const contentDone =
    course.chapters.length > 0 && completionStatus.publishedChapters;

  type BottomAction =
    | { kind: "next"; tab: HubTab; label: string; switchTab: boolean }
    | { kind: "publish" };

  const bottomAction: BottomAction = (() => {
    if (isPublished) {
      return {
        kind: "next",
        tab: "overview",
        label: "",
        switchTab: false,
      };
    }
    if (!detailsDone) {
      if (tab === "details") {
        return {
          kind: "next",
          tab: "details",
          label: "Complete the fields and save · scroll to top",
          switchTab: false,
        };
      }
      return {
        kind: "next",
        tab: "details",
        label: "Step 1: Course details",
        switchTab: true,
      };
    }
    if (!contentDone) {
      if (tab === "content") {
        return {
          kind: "next",
          tab: "content",
          label: "Add and publish at least one lesson · scroll to top",
          switchTab: false,
        };
      }
      return {
        kind: "next",
        tab: "content",
        label: "Step 2: Lessons and quizzes",
        switchTab: true,
      };
    }
    if (tab === "overview") {
      return { kind: "publish" };
    }
    return {
      kind: "next",
      tab: "overview",
      label: "Step 3: Publish — go to the overview tab",
      switchTab: true,
    };
  })();

  const scrollToHubTop = () => {
    document.getElementById("teacher-course-hub-top")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const onNextStepClick = () => {
    scrollToHubTop();
    if (bottomAction.kind === "next" && bottomAction.switchTab) {
      setTab(bottomAction.tab);
    }
  };

  const flowSteps: Array<{
    key: string;
    label: string;
    description: string;
    done: boolean;
    tab: HubTab;
    hintIfUnpublished?: boolean;
    /** Not a workflow action — display only */
    informationalOnly?: boolean;
  }> = [
    {
      key: "details",
      label: "Course details",
      description: "Title, description, price, and cover image",
      done: detailsDone,
      tab: "details",
    },
    {
      key: "content",
      label: "Lessons and quizzes",
      description: "Add lessons and quizzes and order them before the course is visible to students",
      done: contentDone,
      tab: "content",
    },
    {
      key: "publish",
      label: "Publish",
      description: "Publish so students can find, enroll, and purchase the course",
      done: isPublished,
      tab: "overview",
    },
    {
      key: "observe",
      label: "Follow-up",
      description:
        "After publishing: track enrollees and quiz attempts from the Students tab and analytics above",
      done: false,
      tab: "students",
      hintIfUnpublished: true,
      informationalOnly: true,
    },
  ];

  const tabTriggerClass =
    "gap-2 min-h-[52px] py-3 px-3 text-sm font-medium leading-tight lg:min-h-10 lg:py-1.5 lg:px-3 lg:text-sm [&_svg]:size-5 lg:[&_svg]:size-4";

  return (
    <div className="space-y-6 p-4 pb-40 md:p-6 md:pb-6">
      <div id="teacher-course-hub-top" className="scroll-mt-24" aria-hidden />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 px-2 -mr-2 text-muted-foreground" asChild>
              <Link href="/dashboard/admin/courses">
                <ArrowLeft className="h-4 w-4 ml-1" />
                All courses
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight truncate">
            {course.title || "Untitled course"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Course editor: details, content, students, and quizzes in one place.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant={isPublished ? "default" : "secondary"}>
              {isPublished ? "Published" : "Draft"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Setup: {completedFields}/{totalFields}
            </span>
            {isPublished && (
              <PublishCourseBar
                variant="compact"
                courseId={courseId}
                isPublished={isPublished}
                disabled={false}
                className="shrink-0"
              />
            )}
          </div>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as HubTab)}
        className="w-full"
      >
        <TabsList className="grid w-full h-auto grid-cols-2 lg:grid-cols-5 gap-2 p-2 bg-muted/80">
          <TabsTrigger value="overview" className={tabTriggerClass}>
            <ListChecks className="shrink-0" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="details" className={tabTriggerClass}>
            <LayoutDashboard className="shrink-0" />
            Course details
          </TabsTrigger>
          <TabsTrigger value="content" className={tabTriggerClass}>
            <BookOpen className="shrink-0" />
            Lessons & quizzes
          </TabsTrigger>
          <TabsTrigger value="students" className={tabTriggerClass}>
            <Users className="shrink-0" />
            Students ({purchases.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className={tabTriggerClass}>
            <MessageSquare className="shrink-0" />
            Comments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Enrolled students</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-brand">{purchases.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Lessons</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {publishedChapters}/{course.chapters.length}{" "}
                  <span className="text-sm font-normal text-muted-foreground">published</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{course.quizzes.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Quiz attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totalQuizAttempts}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Suggested workflow</CardTitle>
              <CardDescription>
                Three steps to launch (details → content → publish), then follow up once the course is visible to students.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {flowSteps.map((step, i) => {
                const isObserveBeforePublish =
                  step.hintIfUnpublished && !isPublished;
                const rowClass = cn(
                  "flex w-full items-start gap-3 rounded-lg border p-4 text-left",
                  !step.informationalOnly &&
                    "transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
                  step.informationalOnly &&
                    "border-dashed border-muted-foreground/25 bg-muted/15 cursor-default",
                  !step.informationalOnly && step.done && "border-brand/30 bg-brand/5",
                  isObserveBeforePublish && "opacity-80"
                );
                const body = (
                  <>
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        step.informationalOnly
                          ? "bg-muted/80 text-muted-foreground"
                          : "bg-muted"
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {!step.informationalOnly &&
                          (step.done ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ))}
                        <span className="font-medium">
                          {step.informationalOnly
                            ? `After launch — ${step.label}`
                            : step.label}
                        </span>
                      </div>
                      <p className="pl-6 text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                      {isObserveBeforePublish && (
                        <p className="pl-6 text-xs text-muted-foreground italic">
                          This becomes useful after you publish; students are not visible on the platform before then.
                        </p>
                      )}
                    </div>
                  </>
                );
                if (step.informationalOnly) {
                  return (
                    <div
                      key={step.key}
                      className={rowClass}
                      role="note"
                      aria-label={`${step.label}: ${step.description}`}
                    >
                      {body}
                    </div>
                  );
                }
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setTab(step.tab)}
                    className={rowClass}
                  >
                    {body}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {course.quizzes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quiz results at a glance</CardTitle>
                <CardDescription>
                  Open results for each quiz directly, or use the Results button next to a quiz on the Content tab.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {course.quizzes.map((quiz) => (
                  <Button key={quiz.id} variant="outline" size="sm" asChild>
                    <Link
                      href={`/dashboard/admin/quiz-results?quizId=${quiz.id}`}
                      className="justify-between gap-2"
                    >
                      <span className="truncate max-w-[200px]">{quiz.title}</span>
                      <Badge variant="secondary" className="shrink-0">
                        {quiz._count?.quizResults ?? 0} attempt{(quiz._count?.quizResults ?? 0) !== 1 ? "s" : ""}
                      </Badge>
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Fill in each section and press Save below it. On mobile, course info appears first, then the cover image.
          </p>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
            <div className="order-1 space-y-5 lg:order-1">
              <div className="flex items-center gap-x-2">
                <IconBadge icon={LayoutDashboard} />
                <h2 className="text-xl font-semibold tracking-tight">Course information</h2>
              </div>
              <TitleForm initialData={course} courseId={course.id} />
              <DescriptionForm initialData={course} courseId={course.id} />
              <PriceForm initialData={course} courseId={course.id} />
            </div>
            <div className="order-2 lg:order-2">
              <div className="mb-4 flex items-center gap-x-2 lg:mb-5">
                <IconBadge icon={LayoutDashboard} />
                <h2 className="text-xl font-semibold tracking-tight">Visual cover</h2>
              </div>
              <ImageForm initialData={course} courseId={course.id} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <Card className="border-brand/15">
            <CardHeader className="pb-2">
              <CardTitle>Course content</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Manage lessons and quizzes below — layout and actions are optimized for mobile.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <CourseContentForm
                initialData={course}
                courseId={course.id}
                initialOpenChapterId={initialOpenChapterId}
                initialOpenQuizId={initialOpenQuizId}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Students enrolled in this course</CardTitle>
              <CardDescription>
                Students who purchased or activated this course. Use Student management in the menu for all accounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No students enrolled in this course yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Name</TableHead>
                      <TableHead className="text-left">Phone</TableHead>
                      <TableHead className="text-left">Enrolled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell label="Name" className="font-medium">
                          {p.user.fullName}
                        </TableCell>
                        <TableCell label="Phone" dir="ltr" className="text-left">
                          {p.user.phoneNumber}
                        </TableCell>
                        <TableCell label="Enrolled">
                          {format(new Date(p.createdAt), "MMM d, yyyy", { locale: enUS })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/admin/management">Manage all students</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Chapter comments</CardTitle>
              <CardDescription>
                Select a lesson to review student comments. You can hide/unhide or delete comments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full max-w-xl">
                  <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lesson" />
                    </SelectTrigger>
                    <SelectContent>
                      {course.chapters.map((ch) => (
                        <SelectItem key={ch.id} value={ch.id}>
                          {ch.title || "Untitled lesson"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!selectedChapterId) return;
                    try {
                      setCommentsLoading(true);
                      const res = await axios.get(
                        `/api/admin/courses/${courseId}/chapters/${selectedChapterId}/comments`
                      );
                      setComments(res.data as AdminChapterComment[]);
                    } catch {
                      toast.error("Failed to load comments");
                    } finally {
                      setCommentsLoading(false);
                    }
                  }}
                  disabled={!selectedChapterId || commentsLoading}
                >
                  Refresh
                </Button>
              </div>

              {/* auto-load when entering tab or changing chapter */}
              <CommentsAutoLoader
                enabled={tab === "comments"}
                courseId={courseId}
                chapterId={selectedChapterId}
                setComments={setComments}
                setCommentsLoading={setCommentsLoading}
              />

              <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
                <p className="text-sm font-semibold">Add a comment</p>
                <Textarea
                  value={newCommentBody}
                  onChange={(e) => setNewCommentBody(e.target.value)}
                  placeholder="Write a comment as admin/teacher…"
                  maxLength={2000}
                  className="min-h-24 bg-background"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    className="bg-brand hover:bg-brand/90 text-white"
                    disabled={posting || !selectedChapterId || newCommentBody.trim().length === 0}
                    onClick={async () => {
                      const trimmed = newCommentBody.trim();
                      if (!trimmed || !selectedChapterId) return;
                      try {
                        setPosting(true);
                        await axios.post(
                          `/api/admin/courses/${courseId}/chapters/${selectedChapterId}/comments`,
                          { body: trimmed }
                        );
                        setNewCommentBody("");
                        const res = await axios.get(
                          `/api/admin/courses/${courseId}/chapters/${selectedChapterId}/comments`
                        );
                        setComments(res.data as AdminChapterComment[]);
                        toast.success("Comment posted");
                      } catch {
                        toast.error("Failed to post comment");
                      } finally {
                        setPosting(false);
                      }
                    }}
                  >
                    Post comment
                  </Button>
                </div>
              </div>

              {commentsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 w-full rounded-md bg-muted animate-pulse" />
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">
                  No comments for this lesson.
                </p>
              ) : (
                <div className="space-y-3">
                  {adminCommentRoots.map((c) => (
                    <AdminChapterCommentNode
                      key={c.id}
                      comment={c}
                      depth={0}
                      courseId={courseId}
                      chapterId={selectedChapterId}
                      courseOwnerId={course.userId}
                      childrenByParentId={adminCommentChildrenByParentId}
                      commentBusyId={commentBusyId}
                      setCommentBusyId={setCommentBusyId}
                      refreshComments={refreshAdminComments}
                      replyToId={replyToId}
                      replyBody={replyBody}
                      replyPosting={replyPosting}
                      onReplyToggle={(id) => {
                        setReplyToId((prev) => (prev === id ? null : id));
                        setReplyBody("");
                      }}
                      onReplyBodyChange={setReplyBody}
                      onCancelReply={() => {
                        setReplyToId(null);
                        setReplyBody("");
                      }}
                      onPostReply={postAdminReply}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]",
          "max-md:bottom-[calc(4rem+env(safe-area-inset-bottom,0px))]",
          "pb-[max(1rem,env(safe-area-inset-bottom))]",
          "md:relative md:inset-auto md:bottom-auto md:z-auto md:border-0 md:bg-transparent md:shadow-none md:backdrop-blur-none md:p-0 md:pb-0 md:mt-8"
        )}
      >
        <div className="mx-auto max-w-6xl w-full">
          {isPublished ? (
            <PublishCourseBar
              variant="hero"
              courseId={courseId}
              isPublished
              disabled={false}
            />
          ) : bottomAction.kind === "publish" ? (
            <PublishCourseBar
              variant="hero"
              courseId={courseId}
              isPublished={false}
              disabled={!isComplete}
            />
          ) : (
            <Button
              type="button"
              className="w-full min-h-14 sm:min-h-16 text-base sm:text-lg font-semibold rounded-xl bg-brand hover:bg-brand/90 text-white shadow-md"
              onClick={onNextStepClick}
            >
              {bottomAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminChapterCommentNode({
  comment,
  depth,
  courseId,
  chapterId,
  courseOwnerId,
  childrenByParentId,
  commentBusyId,
  setCommentBusyId,
  refreshComments,
  replyToId,
  replyBody,
  replyPosting,
  onReplyToggle,
  onReplyBodyChange,
  onCancelReply,
  onPostReply,
}: {
  comment: AdminChapterComment;
  depth: number;
  courseId: string;
  chapterId: string;
  courseOwnerId: string;
  childrenByParentId: Map<string, AdminChapterComment[]>;
  commentBusyId: string | null;
  setCommentBusyId: (id: string | null) => void;
  refreshComments: () => Promise<void>;
  replyToId: string | null;
  replyBody: string;
  replyPosting: boolean;
  onReplyToggle: (id: string) => void;
  onReplyBodyChange: (v: string) => void;
  onCancelReply: () => void;
  onPostReply: (parentId: string) => Promise<void>;
}) {
  const created = new Date(comment.createdAt);
  const children = childrenByParentId.get(comment.id) ?? [];

  return (
    <div className={cn(depth > 0 && "ml-6 sm:ml-10")}>
      <div
        className={cn(
          "rounded-lg border",
          depth === 0 ? "p-4" : "p-3",
          comment.isHidden ? "bg-muted/40 border-muted" : "bg-background"
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {depth > 0 ? (
                <span className="text-muted-foreground">
                  <CornerDownRight className="h-4 w-4 inline-block mr-1 align-[-2px]" />
                </span>
              ) : null}
              <span
                className={cn(
                  "truncate max-w-[22rem]",
                  depth === 0 ? "text-sm font-semibold" : "text-sm font-medium"
                )}
              >
                {formatCommenterDisplayName(comment.user, courseOwnerId)}
              </span>
              {comment.isHidden ? (
                <Badge variant="secondary">Hidden</Badge>
              ) : (
                <Badge variant="default">Visible</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {Number.isNaN(created.getTime())
                  ? ""
                  : format(created, "MMM d, yyyy", { locale: enUS })}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{comment.body}</p>

            <div className="pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => onReplyToggle(comment.id)}
              >
                Reply
              </Button>
            </div>

            {replyToId === comment.id ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={replyBody}
                  onChange={(e) => onReplyBodyChange(e.target.value)}
                  placeholder="Write a reply…"
                  maxLength={2000}
                  className="min-h-20 bg-background"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button type="button" variant="outline" onClick={onCancelReply}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="bg-brand hover:bg-brand/90 text-white"
                    disabled={replyPosting || replyBody.trim().length === 0}
                    onClick={() => onPostReply(comment.id)}
                  >
                    Post reply
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              disabled={commentBusyId === comment.id}
              onClick={async () => {
                try {
                  setCommentBusyId(comment.id);
                  await axios.patch(
                    `/api/admin/courses/${courseId}/chapters/${chapterId}/comments/${comment.id}`,
                    { isHidden: !comment.isHidden }
                  );
                  await refreshComments();
                } catch {
                  toast.error("Failed to update comment");
                } finally {
                  setCommentBusyId(null);
                }
              }}
            >
              {comment.isHidden ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Unhide
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={commentBusyId === comment.id}
              onClick={async () => {
                try {
                  setCommentBusyId(comment.id);
                  await axios.delete(
                    `/api/admin/courses/${courseId}/chapters/${chapterId}/comments/${comment.id}`
                  );
                  await refreshComments();
                } catch {
                  toast.error("Failed to delete comment");
                } finally {
                  setCommentBusyId(null);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {children.length > 0 ? (
        <div className="mt-3 space-y-3">
          {children.map((child) => (
            <AdminChapterCommentNode
              key={child.id}
              comment={child}
              depth={depth + 1}
              courseId={courseId}
              chapterId={chapterId}
              courseOwnerId={courseOwnerId}
              childrenByParentId={childrenByParentId}
              commentBusyId={commentBusyId}
              setCommentBusyId={setCommentBusyId}
              refreshComments={refreshComments}
              replyToId={replyToId}
              replyBody={replyBody}
              replyPosting={replyPosting}
              onReplyToggle={onReplyToggle}
              onReplyBodyChange={onReplyBodyChange}
              onCancelReply={onCancelReply}
              onPostReply={onPostReply}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CommentsAutoLoader({
  enabled,
  courseId,
  chapterId,
  setComments,
  setCommentsLoading,
}: {
  enabled: boolean;
  courseId: string;
  chapterId: string;
  setComments: (comments: AdminChapterComment[]) => void;
  setCommentsLoading: (v: boolean) => void;
}) {
  useEffect(() => {
    if (!enabled || !chapterId) return;
    let cancelled = false;
    const run = async () => {
      try {
        setCommentsLoading(true);
        const res = await axios.get(
          `/api/admin/courses/${courseId}/chapters/${chapterId}/comments`
        );
        if (!cancelled) setComments(res.data as AdminChapterComment[]);
      } catch {
        if (!cancelled) toast.error("Failed to load comments");
      } finally {
        if (!cancelled) setCommentsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [enabled, courseId, chapterId, setComments, setCommentsLoading]);

  return null;
}
