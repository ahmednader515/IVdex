import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "ADMIN_ASSISTANT") {
      return new NextResponse("Forbidden - Admin access required", { status: 403 });
    }

    const {
      fullName,
      phoneNumber,
      password,
      confirmPassword,
      collegeOrUniversity,
      academicDegree,
      graduationYear,
      studyOrWorkField,
    } = await req.json();

    const trimmedCollege = typeof collegeOrUniversity === "string" ? collegeOrUniversity.trim() : "";
    const trimmedDegree = typeof academicDegree === "string" ? academicDegree.trim() : "";
    const trimmedYear = typeof graduationYear === "string" ? graduationYear.trim() : "";
    const trimmedField = typeof studyOrWorkField === "string" ? studyOrWorkField.trim() : "";

    if (
      !fullName ||
      !phoneNumber ||
      !password ||
      !confirmPassword ||
      !trimmedCollege ||
      !trimmedDegree ||
      !trimmedYear ||
      !trimmedField
    ) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (password !== confirmPassword) {
      return new NextResponse("Passwords do not match", { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        phoneNumber
      },
    });

    if (existingUser) {
      return new NextResponse("Phone number already exists", { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with USER role (student)
    const newUser = await db.user.create({
      data: {
        fullName,
        phoneNumber,
        parentPhoneNumber: phoneNumber,
        collegeOrUniversity: trimmedCollege,
        academicDegree: trimmedDegree,
        graduationYear: trimmedYear,
        studyOrWorkField: trimmedField,
        hashedPassword,
        role: "STUDENT", // Always create as student
      },
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("[ADMIN_CREATE_ACCOUNT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 