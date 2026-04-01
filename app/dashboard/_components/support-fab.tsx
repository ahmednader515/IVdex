"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const WHATSAPP_URL = "https://wa.me/201148492847";

export function SupportFab() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isStudent = session?.user?.role === "STUDENT";
  const isStudentDashboard = pathname === "/dashboard" || pathname?.startsWith("/dashboard/");
  const isStaffDashboard =
    pathname?.startsWith("/dashboard/admin") ||
    pathname?.startsWith("/dashboard/admin-assistant") ||
    pathname?.startsWith("/dashboard/teacher");

  if (!isStudent || !isStudentDashboard || isStaffDashboard) return null;

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fixed z-50",
        "left-4",
        "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]",
        "inline-flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg",
        "hover:bg-brand/90 active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      )}
      aria-label="الدعم عبر واتساب"
    >
      <MessageCircle className="h-5 w-5" aria-hidden />
      الدعم
    </a>
  );
}

