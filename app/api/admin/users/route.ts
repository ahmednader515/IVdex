import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        console.log("[ADMIN_USERS_GET] Session:", { userId: session?.user?.id, role: session?.user?.role });

        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            console.log("[ADMIN_USERS_GET] Access denied:", { userId: session.user.id, role: session.user.role });
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Admin can see all users (STUDENT, ADMIN, and ADMIN_ASSISTANT roles)
        const users = await db.user.findMany({
            where: {
                role: {
                    in: ["STUDENT", "ADMIN", "ADMIN_ASSISTANT"]
                }
            },
            select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                parentPhoneNumber: true,
                role: true,
                balance: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        courses: true,
                        purchases: true,
                        userProgress: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        console.log("[ADMIN_USERS_GET] Found users:", users.length);
        console.log("[ADMIN_USERS_GET] Users by role:", {
            STUDENT: users.filter(u => u.role === "STUDENT").length,
            ADMIN: users.filter(u => u.role === "ADMIN").length,
            ADMIN_ASSISTANT: users.filter(u => u.role === "ADMIN_ASSISTANT").length
        });
        console.log("[ADMIN_USERS_GET] Admin assistant users:", users.filter(u => u.role === "ADMIN_ASSISTANT"));
        return NextResponse.json(users);
    } catch (error) {
        console.error("[ADMIN_USERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
