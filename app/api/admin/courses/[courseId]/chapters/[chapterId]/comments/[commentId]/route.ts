import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function assertAdminOrOwner(userId: string, courseId: string, role?: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, userId: true },
  });

  if (!course) return { ok: false as const, status: 404 as const, message: "Not found" };

  const isAdmin = role === "ADMIN";
  const isOwner = course.userId === userId;

  if (!isAdmin && !isOwner) return { ok: false as const, status: 403 as const, message: "Forbidden" };
  return { ok: true as const };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string; commentId: string }> }
) {
  try {
    const { userId, user } = await auth();
    const { courseId, chapterId, commentId } = await params;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const allowed = await assertAdminOrOwner(userId, courseId, user?.role);
    if (!allowed.ok) return new NextResponse(allowed.message, { status: allowed.status });

    const payload = await req.json().catch(() => ({}));
    const isHidden = Boolean((payload as { isHidden?: unknown }).isHidden);

    // Ensure chapter belongs to course
    const chapter = await db.chapter.findUnique({
      where: { id: chapterId, courseId },
      select: { id: true },
    });
    if (!chapter) return new NextResponse("Not found", { status: 404 });

    const existing = await db.chapterComment.findUnique({
      where: { id: commentId },
      select: { id: true, chapterId: true },
    });
    if (!existing || existing.chapterId !== chapterId) return new NextResponse("Not found", { status: 404 });

    const updated = await db.chapterComment.update({
      where: { id: commentId },
      data: { isHidden },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.log("[ADMIN_CHAPTER_COMMENT_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string; commentId: string }> }
) {
  try {
    const { userId, user } = await auth();
    const { courseId, chapterId, commentId } = await params;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const allowed = await assertAdminOrOwner(userId, courseId, user?.role);
    if (!allowed.ok) return new NextResponse(allowed.message, { status: allowed.status });

    const chapter = await db.chapter.findUnique({
      where: { id: chapterId, courseId },
      select: { id: true },
    });
    if (!chapter) return new NextResponse("Not found", { status: 404 });

    const existing = await db.chapterComment.findUnique({
      where: { id: commentId },
      select: { id: true, chapterId: true },
    });
    if (!existing || existing.chapterId !== chapterId) return new NextResponse("Not found", { status: 404 });

    await db.chapterComment.delete({ where: { id: commentId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.log("[ADMIN_CHAPTER_COMMENT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

