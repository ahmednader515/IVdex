import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const courses = await db.course.findMany({
      where: {
        isPublished: true,
      },
      include: {
        user: true,
        chapters: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          }
        },
        quizzes: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          }
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      cacheStrategy: process.env.NODE_ENV === "production" ? { ttl: 120 } : undefined,
    });

    const courseIds = courses.map((c) => c.id);
    const ratingAgg = courseIds.length
      ? await db.courseRating.groupBy({
          by: ["courseId"],
          where: { courseId: { in: courseIds } },
          _avg: { rating: true },
          _count: { rating: true },
        })
      : [];

    const ratingByCourseId = new Map(
      ratingAgg.map((r) => [
        r.courseId,
        {
          ratingAverage: r._avg.rating ?? 0,
          ratingCount: r._count.rating ?? 0,
        },
      ])
    );

    // Return courses with default progress of 0 for public view
    const coursesWithDefaultProgress = courses.map(course => ({
      ...course,
      progress: 0,
      ...(ratingByCourseId.get(course.id) ?? { ratingAverage: 0, ratingCount: 0 }),
    }));

    return NextResponse.json(coursesWithDefaultProgress);
  } catch (error) {
    console.log("[COURSES_PUBLIC]", error);
    
    // If the table doesn't exist or there's a database connection issue,
    // return an empty array instead of an error
    if (error instanceof Error && (
      error.message.includes("does not exist") || 
      error.message.includes("P2021") ||
      error.message.includes("table")
    )) {
      return NextResponse.json([]);
    }
    
    return new NextResponse("Internal Error", { status: 500 });
  }
} 