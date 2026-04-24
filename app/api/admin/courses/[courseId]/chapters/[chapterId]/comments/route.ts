import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const MAX_COMMENT_LENGTH = 2000;

async function assertAdminOrOwner(userId: string, courseId: string, role?: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, userId: true },
  });

  if (!course) return { ok: false as const, status: 404 as const, message: "Not found" };

  const isAdmin = role === "ADMIN";
  const isOwner = course.userId === userId;

  if (!isAdmin && !isOwner) {
    return { ok: false as const, status: 403 as const, message: "Forbidden" };
  }

  return { ok: true as const };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  try {
    const { userId, user } = await auth();
    const { courseId, chapterId } = await params;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const allowed = await assertAdminOrOwner(userId, courseId, user?.role);
    if (!allowed.ok) return new NextResponse(allowed.message, { status: allowed.status });

    const chapter = await db.chapter.findUnique({
      where: { id: chapterId, courseId },
      select: { id: true },
    });
    if (!chapter) return new NextResponse("Not found", { status: 404 });

    const comments = await db.chapterComment.findMany({
      where: { chapterId },
      include: { user: { select: { id: true, fullName: true, image: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.log("[ADMIN_CHAPTER_COMMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  try {
    const { userId, user } = await auth();
    const { courseId, chapterId } = await params;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const allowed = await assertAdminOrOwner(userId, courseId, user?.role);
    if (!allowed.ok) return new NextResponse(allowed.message, { status: allowed.status });

    const bodyJson = await req.json().catch(() => ({}));
    const body = String((bodyJson as { body?: unknown }).body ?? "").trim();
    const parentIdRaw = (bodyJson as { parentId?: unknown }).parentId;
    const parentId = typeof parentIdRaw === "string" && parentIdRaw.length > 0 ? parentIdRaw : null;
    if (!body) return new NextResponse("Empty comment", { status: 400 });
    if (body.length > MAX_COMMENT_LENGTH) return new NextResponse("Comment too long", { status: 400 });

    const chapter = await db.chapter.findUnique({
      where: { id: chapterId, courseId },
      select: { id: true },
    });
    if (!chapter) return new NextResponse("Not found", { status: 404 });

    if (parentId) {
      const parent = await db.chapterComment.findFirst({
        where: { id: parentId, chapterId },
        select: { id: true },
      });
      if (!parent) return new NextResponse("Parent comment not found", { status: 404 });
    }

    const comment = await db.chapterComment.create({
      data: {
        chapterId,
        userId,
        body,
        isHidden: false,
        parentId: parentId ?? undefined,
      },
      include: {
        user: { select: { id: true, fullName: true, image: true, role: true } },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.log("[ADMIN_CHAPTER_COMMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

