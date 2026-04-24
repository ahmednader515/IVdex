import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function canDeleteComment(userId: string, courseId: string, commentId: string) {
  const comment = await db.chapterComment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      userId: true,
      chapter: { select: { id: true, courseId: true, course: { select: { userId: true } } } },
    },
  });

  if (!comment || comment.chapter.courseId !== courseId) {
    return { ok: false as const, status: 404 as const, message: "Not found" };
  }

  // Owner can delete their own comment
  if (comment.userId === userId) return { ok: true as const };

  // Admin or teacher (course owner) can delete
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === "ADMIN" || comment.chapter.course.userId === userId) {
    return { ok: true as const };
  }

  return { ok: false as const, status: 403 as const, message: "Forbidden" };
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string; commentId: string }> }
) {
  try {
    const { userId } = await auth();
    const { courseId, chapterId, commentId } = await params;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    // Ensure chapter belongs to course (also prevents cross-course deletes).
    const chapter = await db.chapter.findUnique({
      where: { id: chapterId, courseId },
      select: { id: true },
    });
    if (!chapter) return new NextResponse("Not found", { status: 404 });

    const allowed = await canDeleteComment(userId, courseId, commentId);
    if (!allowed.ok) return new NextResponse(allowed.message, { status: allowed.status });

    await db.chapterComment.delete({ where: { id: commentId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.log("[CHAPTER_COMMENT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

