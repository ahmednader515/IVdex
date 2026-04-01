import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * GET /api/teacher/courses
 * Returns all courses for the current teacher (including drafts).
 * Used by quiz create/edit and other teacher dashboard pages that need to show course names for draft courses.
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courses = await db.course.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        title: true,
        isPublished: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("[TEACHER_COURSES]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
