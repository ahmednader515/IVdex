import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { userId, user } = await auth();
    const resolvedParams = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: { id: resolvedParams.courseId },
      select: { id: true, userId: true },
    });

    if (!courseOwner) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (courseOwner.userId !== userId && user?.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updated = await db.course.update({
      where: { id: resolvedParams.courseId },
      data: { isPublished: false },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.log("[COURSE_UNPUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
