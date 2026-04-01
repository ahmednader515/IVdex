import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

// Generate unique code
function generateCode(): string {
  return randomBytes(8).toString("hex").toUpperCase();
}

// GET - List all codes
export async function GET(req: NextRequest) {
  try {
    const { userId, user } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (user?.role !== "ADMIN_ASSISTANT") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const codes = await db.purchaseCode.findMany({
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(codes);
  } catch (error) {
    console.error("[ADMIN_CODES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST - Generate new codes
export async function POST(req: NextRequest) {
  try {
    const { userId, user } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (user?.role !== "ADMIN_ASSISTANT") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { courseId, count } = await req.json();

    if (!courseId || !count || count < 1 || count > 100) {
      return new NextResponse("Invalid request: courseId and count (1-100) required", { status: 400 });
    }

    // Verify course exists
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Generate codes
    const codes = [];
    for (let i = 0; i < count; i++) {
      let code: string;
      let isUnique = false;
      
      // Ensure code is unique
      while (!isUnique) {
        code = generateCode();
        const existing = await db.purchaseCode.findUnique({
          where: { code },
        });
        if (!existing) {
          isUnique = true;
        }
      }

      codes.push({
        code,
        courseId,
        createdBy: userId,
        isUsed: false,
      });
    }

    // Create codes in database
    const createdCodes = await db.purchaseCode.createMany({
      data: codes,
    });

    // Fetch created codes with course info
    const createdCodesWithDetails = await db.purchaseCode.findMany({
      where: {
        createdBy: userId,
        courseId,
        code: {
          in: codes.map((c) => c.code),
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: count,
    });

    return NextResponse.json({
      success: true,
      codes: createdCodesWithDetails,
      count: createdCodes.count,
    });
  } catch (error) {
    console.error("[ADMIN_CODES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE - Delete single code OR delete all codes for a course
export async function DELETE(req: NextRequest) {
  try {
    const { userId, user } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (user?.role !== "ADMIN_ASSISTANT") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json().catch(() => ({} as any));
    const codeId = typeof body?.codeId === "string" ? body.codeId : null;
    const courseId = typeof body?.courseId === "string" ? body.courseId : null;

    if (!codeId && !courseId) {
      return new NextResponse("Invalid request: codeId or courseId is required", { status: 400 });
    }

    if (codeId) {
      const deleted = await db.purchaseCode.deleteMany({
        where: { id: codeId },
      });

      if (deleted.count === 0) {
        return new NextResponse("Code not found", { status: 404 });
      }

      return NextResponse.json({ success: true, deleted: deleted.count });
    }

    const deleted = await db.purchaseCode.deleteMany({
      where: { courseId: courseId! },
    });

    return NextResponse.json({ success: true, deleted: deleted.count });
  } catch (error) {
    console.error("[ADMIN_ASSISTANT_CODES_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

