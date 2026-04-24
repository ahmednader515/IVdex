import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const MAX_COMMENT_LENGTH = 2000;

async function assertEnrolled(userId: string, courseId: string) {
  const purchase = await db.purchase.findFirst({
    where: {
      userId,
      courseId,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (!purchase) {
    return { ok: false as const, status: 403 as const, message: "Forbidden" };
  }

  return { ok: true as const };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  try {
    const { userId } = await auth();
    const { courseId, chapterId } = await params;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const enrolled = await assertEnrolled(userId, courseId);
    if (!enrolled.ok) return new NextResponse(enrolled.message, { status: enrolled.status });

    const chapter = await db.chapter.findUnique({
      where: { id: chapterId, courseId },
      select: { id: true },
    });
    if (!chapter) return new NextResponse("Not found", { status: 404 });

    const comments = await db.chapterComment.findMany({
      where: { chapterId, isHidden: false },
      include: {
        user: {
          select: { id: true, fullName: true, image: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.log("[CHAPTER_COMMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  try {
    const { userId } = await auth();
    const { courseId, chapterId } = await params;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const enrolled = await assertEnrolled(userId, courseId);
    if (!enrolled.ok) return new NextResponse(enrolled.message, { status: enrolled.status });

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
        where: {
          id: parentId,
          chapterId,
          isHidden: false,
        },
        select: { id: true },
      });
      if (!parent) return new NextResponse("Parent comment not found", { status: 404 });
    }

    const comment = await db.chapterComment.create({
      data: {
        chapterId,
        userId,
        body,
        parentId: parentId ?? undefined,
      },
      include: {
        user: {
          select: { id: true, fullName: true, image: true, role: true },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.log("[CHAPTER_COMMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

