import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function coerceRating(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) return parsed;
  }
  return null;
}

async function assertHasAccess(userId: string, courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId, isPublished: true },
    select: {
      id: true,
      price: true,
      purchases: {
        where: { userId },
        select: { status: true },
      },
    },
  });

  if (!course) {
    return { ok: false as const, status: 404 as const, message: "Not found" };
  }

  if (course.price === 0) {
    return { ok: true as const };
  }

  const hasActivePurchase = course.purchases.some((p) => p.status === "ACTIVE");
  if (!hasActivePurchase) {
    return { ok: false as const, status: 403 as const, message: "Forbidden" };
  }

  return { ok: true as const };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { userId } = await auth();
    const { courseId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const access = await assertHasAccess(userId, courseId);
    if (!access.ok) {
      return new NextResponse(access.message, { status: access.status });
    }

    const [agg, myRating] = await Promise.all([
      db.courseRating.aggregate({
        where: { courseId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      db.courseRating.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: { rating: true },
      }),
    ]);

    return NextResponse.json({
      ratingAverage: agg._avg.rating ?? 0,
      ratingCount: agg._count.rating ?? 0,
      myRating: myRating?.rating ?? null,
    });
  } catch (error) {
    console.log("[COURSE_RATING_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { userId } = await auth();
    const { courseId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const access = await assertHasAccess(userId, courseId);
    if (!access.ok) {
      return new NextResponse(access.message, { status: access.status });
    }

    const body = await req.json().catch(() => ({}));
    const rating = coerceRating((body as { rating?: unknown }).rating);
    if (rating === null || rating < 1 || rating > 5) {
      return new NextResponse("Invalid rating", { status: 400 });
    }

    const saved = await db.courseRating.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { rating },
      create: { userId, courseId, rating },
      select: { rating: true },
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.log("[COURSE_RATING_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

