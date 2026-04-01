"use client";

import { useState } from "react";
import Link from "next/link";
import { Chapter, Course, Quiz } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ArrowLeft,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

type QuizWithCount = Quiz & { _count?: { quizResults: number } };

type HubTab = "overview" | "details" | "content" | "students";

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
      initialTab === "overview"
    ) {
      return initialTab;
    }
    return "overview";
  });

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
          label: "أكمل الحقول واحفظها · الصعود لأعلى الصفحة",
          switchTab: false,
        };
      }
      return {
        kind: "next",
        tab: "details",
        label: "الخطوة ١: تفاصيل الكورس",
        switchTab: true,
      };
    }
    if (!contentDone) {
      if (tab === "content") {
        return {
          kind: "next",
          tab: "content",
          label: "أضف درساً وانشره على الأقل · الصعود لأعلى",
          switchTab: false,
        };
      }
      return {
        kind: "next",
        tab: "content",
        label: "الخطوة ٢: الدروس والاختبارات",
        switchTab: true,
      };
    }
    if (tab === "overview") {
      return { kind: "publish" };
    }
    return {
      kind: "next",
      tab: "overview",
      label: "الخطوة ٣: النشر — انتقل لنظرة عامة للنشر",
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
      label: "تفاصيل الكورس",
      description: "عنوان، وصف، سعر، وصورة الغلاف",
      done: detailsDone,
      tab: "details",
    },
    {
      key: "content",
      label: "الدروس والاختبارات",
      description: "أضف دروساً واختبارات ورتّبها قبل أن يظهر الكورس للطلاب",
      done: contentDone,
      tab: "content",
    },
    {
      key: "publish",
      label: "النشر",
      description: "انشر الكورس ليصبح ظاهراً للطلاب ويستطيعوا التسجيل والشراء",
      done: isPublished,
      tab: "overview",
    },
    {
      key: "observe",
      label: "المتابعة والمراقبة",
      description:
        "بعد النشر: تابع المسجلين ومحاولات الاختبارات من تبويب الطلاب والإحصائيات أعلاه",
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
                كل الكورسات
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight truncate">
            {course.title || "كورس بدون عنوان"}
          </h1>
          <p className="text-sm text-muted-foreground">
            مركز تعديل الكورس: كل التفاصيل والمحتوى والطلاب والاختبارات من مكان واحد.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant={isPublished ? "default" : "secondary"}>
              {isPublished ? "منشور" : "غير منشور"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              اكتمال الإعداد: {completedFields}/{totalFields}
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
        dir="rtl"
        className="w-full"
      >
        <TabsList className="grid w-full h-auto grid-cols-2 lg:grid-cols-4 gap-2 p-2 bg-muted/80">
          <TabsTrigger value="overview" className={tabTriggerClass}>
            <ListChecks className="shrink-0" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="details" className={tabTriggerClass}>
            <LayoutDashboard className="shrink-0" />
            تفاصيل الكورس
          </TabsTrigger>
          <TabsTrigger value="content" className={tabTriggerClass}>
            <BookOpen className="shrink-0" />
            الدروس والاختبارات
          </TabsTrigger>
          <TabsTrigger value="students" className={tabTriggerClass}>
            <Users className="shrink-0" />
            الطلاب ({purchases.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">طلاب مسجلون</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-brand">{purchases.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">دروس</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {publishedChapters}/{course.chapters.length}{" "}
                  <span className="text-sm font-normal text-muted-foreground">منشور</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">اختبارات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{course.quizzes.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">محاولات اختبار</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totalQuizAttempts}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>مسار العمل المقترح</CardTitle>
              <CardDescription>
                ثلاث خطوات لإطلاق الكورس (تفاصيل → محتوى → نشر)، ثم خطوة متابعة بعد أن يصبح
                الكورس مرئياً للطلاب.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {flowSteps.map((step, i) => {
                const isObserveBeforePublish =
                  step.hintIfUnpublished && !isPublished;
                const rowClass = cn(
                  "flex w-full items-start gap-3 rounded-lg border p-4 text-right",
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
                            ? `بعد الإطلاق — ${step.label}`
                            : step.label}
                        </span>
                      </div>
                      <p className="pr-6 text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                      {isObserveBeforePublish && (
                        <p className="pr-6 text-xs text-muted-foreground italic">
                          تُفعَّل عملياً بعد نشر الكورس؛ لا يظهر الطلاب في المنصة قبل ذلك.
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
                <CardTitle className="text-base">نتائج الاختبارات بأختصار</CardTitle>
                <CardDescription>
                  افتح نتائج كل اختبار مباشرة، أو استخدم زر «النتائج» بجانب الاختبار في تبويب المحتوى.
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
                        {quiz._count?.quizResults ?? 0} محاولة
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
            عبّئ الحقول مباشرة واضغط «حفظ» تحت كل قسم. على الجوال تظهر معلومات الكورس أولاً ثم صورة الغلاف.
          </p>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
            <div className="order-1 space-y-5 lg:order-1">
              <div className="flex items-center gap-x-2">
                <IconBadge icon={LayoutDashboard} />
                <h2 className="text-xl font-semibold tracking-tight">معلومات الكورس</h2>
              </div>
              <TitleForm initialData={course} courseId={course.id} />
              <DescriptionForm initialData={course} courseId={course.id} />
              <PriceForm initialData={course} courseId={course.id} />
            </div>
            <div className="order-2 lg:order-2">
              <div className="mb-4 flex items-center gap-x-2 lg:mb-5">
                <IconBadge icon={LayoutDashboard} />
                <h2 className="text-xl font-semibold tracking-tight">الغلاف البصري</h2>
              </div>
              <ImageForm initialData={course} courseId={course.id} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <Card className="border-brand/15">
            <CardHeader className="pb-2">
              <CardTitle>محتوى الكورس</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                أدر الدروس والاختبارات من الصندوق أدناه — التفاصيل والأزرار مُحسَّنة للجوال.
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
              <CardTitle>الطلاب المسجلون في هذا الكورس</CardTitle>
              <CardDescription>
                الطلاب الذين اشتروا أو فعّلوا الكورس. لإدارة الحسابات العامة، استخدم «إدارة الطلاب» من القائمة.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  لا يوجد طلاب مسجلون بعد في هذا الكورس.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">الهاتف</TableHead>
                      <TableHead className="text-right">تاريخ التسجيل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell label="الاسم" className="font-medium">
                          {p.user.fullName}
                        </TableCell>
                        <TableCell label="الهاتف" dir="ltr" className="text-right">
                          {p.user.phoneNumber}
                        </TableCell>
                        <TableCell label="تاريخ التسجيل">
                          {format(new Date(p.createdAt), "dd MMM yyyy", { locale: ar })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/admin/management">إدارة جميع الطلاب</Link>
                </Button>
              </div>
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
