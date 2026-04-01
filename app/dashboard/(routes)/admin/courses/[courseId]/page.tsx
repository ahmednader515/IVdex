import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation";
import { Banner } from "@/components/banner";
import { TeacherCourseHub } from "./_components/teacher-course-hub";

export default async function CourseIdPage({
    params,
    searchParams,
}: {
    params: Promise<{ courseId: string }>;
    searchParams?: Promise<{ openChapter?: string; openQuiz?: string; tab?: string }>;
}) {
    const resolvedParams = await params;
    const { courseId } = resolvedParams;
    const sp = searchParams ? await searchParams : {};
    const initialOpenChapterId =
        typeof sp.openChapter === "string" && sp.openChapter.length > 0
            ? sp.openChapter
            : undefined;
    const initialOpenQuizId =
        typeof sp.openQuiz === "string" && sp.openQuiz.length > 0 ? sp.openQuiz : undefined;
    const tabParam = typeof sp.tab === "string" ? sp.tab : "";
    const initialTab =
        tabParam === "overview" ||
        tabParam === "details" ||
        tabParam === "content" ||
        tabParam === "students"
            ? tabParam
            : undefined;

    const { userId, user } = await auth();

    if (!userId) {
        return redirect("/");
    }

    const course = await db.course.findUnique({
        where: {
            id: courseId,
        },
        include: {
            chapters: {
                orderBy: {
                    position: "asc",
                },
            },
            quizzes: {
                orderBy: {
                    position: "asc",
                },
                include: {
                    _count: {
                        select: { quizResults: true },
                    },
                },
            },
        }
    });

    if (!course) {
        return redirect("/");
    }

    if (user?.role !== "ADMIN" && course.userId !== userId) {
        return redirect("/dashboard");
    }

    const purchases = await db.purchase.findMany({
        where: { courseId },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    phoneNumber: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const hasPublishedChapter = course.chapters.some(
        (chapter) => chapter.isPublished
    );
    const hasPriceSet =
        course.price !== null && course.price !== undefined;

    const completionChecks = [
        !!course.title,
        !!course.description,
        !!course.imageUrl,
        hasPriceSet,
        hasPublishedChapter,
    ];

    const totalFields = completionChecks.length;
    const completedFields = completionChecks.filter(Boolean).length;

    const isComplete = completionChecks.every(Boolean);

    const completionStatus = {
        title: !!course.title,
        description: !!course.description,
        imageUrl: !!course.imageUrl,
        price: course.price !== null && course.price !== undefined,
        publishedChapters: course.chapters.some(chapter => chapter.isPublished)
    };

    const purchasesSerialized = purchases.map((p) => ({
        id: p.id,
        createdAt: p.createdAt.toISOString(),
        user: p.user,
    }));

    return (
        <>
            {!course.isPublished && (
                <Banner
                    variant="warning"
                    label="هذه الكورس غير منشورة. لن تكون مرئية للطلاب."
                />
            )}
            <TeacherCourseHub
                courseId={courseId}
                course={course}
                purchases={purchasesSerialized}
                completionStatus={completionStatus}
                isComplete={isComplete}
                completedFields={completedFields}
                totalFields={totalFields}
                isPublished={course.isPublished}
                initialOpenChapterId={initialOpenChapterId}
                initialOpenQuizId={initialOpenQuizId}
                initialTab={initialTab}
            />
        </>
    );
}
