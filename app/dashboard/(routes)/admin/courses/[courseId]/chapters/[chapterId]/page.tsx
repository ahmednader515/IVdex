import { redirect } from "next/navigation";

/**
 * Legacy chapter editor URL — editing now happens in the course hub (content tab + sheet).
 */
export default async function TeacherChapterLegacyRedirect({
    params,
}: {
    params: Promise<{ courseId: string; chapterId: string }>;
}) {
    const { courseId, chapterId } = await params;
    redirect(
        `/dashboard/admin/courses/${courseId}?openChapter=${encodeURIComponent(chapterId)}`
    );
}
