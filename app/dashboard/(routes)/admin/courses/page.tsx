import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CoursesTable } from "./_components/courses-table";
import { columns } from "./_components/columns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CoursesPage = async () => {
    const { userId } = await auth();

    if (!userId) {
        return redirect("/");
    }

    const courses = await db.course.findMany({
        where: {
            userId,
        },
        include: {
            chapters: {
                select: {
                    id: true,
                    isPublished: true,
                }
            },
            quizzes: {
                select: {
                    id: true,
                    isPublished: true,
                }
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    }).then(courses => courses.map(course => ({
        ...course,
        price: course.price || 0,
        publishedChaptersCount: course.chapters.filter(ch => ch.isPublished).length,
        publishedQuizzesCount: course.quizzes.filter(q => q.isPublished).length,
    })));

    const unpublishedCourses = courses.filter(course => !course.isPublished);
    const hasUnpublishedCourses = unpublishedCourses.length > 0;

    return (
        <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">كورساتي</h1>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                        أنشئ كورسًا جديدًا ثم أدِر كل شيء من صفحة واحدة: التفاصيل، الدروس، الاختبارات، نتائج الطلاب، والمسجّلين.
                        استخدم زر «تعديل الكورس» بجانب أي كورس.
                    </p>
                </div>
                <Link href="/dashboard/admin/courses/create" className="shrink-0">
                    <Button className="bg-brand hover:bg-brand/90 text-white w-full sm:w-auto">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        إنشاء كورس جديد
                    </Button>
                </Link>
            </div>

            {hasUnpublishedCourses && (
                <Alert className="mt-6 border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                        <div className="mb-2">
                            <strong>لنشر الكورسات على الصفحة الرئيسية، تحتاج إلى:</strong>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>إضافة عنوان للكورس</li>
                            <li>إضافة وصف للكورس</li>
                            <li>إضافة صورة للكورس</li>
                            <li>إضافة درس واحد على الأقل ونشره</li>
                            <li>النقر على زر "نشر" في صفحة إعدادات الكورس</li>
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            <div className="mt-6">
                <CoursesTable columns={columns} data={courses} />
            </div>
        </div>
    );
};

export default CoursesPage;
