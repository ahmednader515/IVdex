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
                    <h1 className="text-2xl font-bold">My courses</h1>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                        Create a new course, then manage everything from one place: details, lessons, quizzes, student results, and enrollments.
                        Use the Edit course button next to any course.
                    </p>
                </div>
                <Link href="/dashboard/admin/courses/create" className="shrink-0">
                    <Button className="bg-brand hover:bg-brand/90 text-white w-full sm:w-auto">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create new course
                    </Button>
                </Link>
            </div>

            {hasUnpublishedCourses && (
                <Alert className="mt-6 border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                        <div className="mb-2">
                            <strong>To publish courses on the home page, you need to:</strong>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Add a course title</li>
                            <li>Add a course description</li>
                            <li>Add a course image</li>
                            <li>Add at least one lesson and publish it</li>
                            <li>Click Publish on the course settings page</li>
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
