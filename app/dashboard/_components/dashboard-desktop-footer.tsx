"use client";

import { usePathname } from "next/navigation";

export function DashboardDesktopFooter() {
  const pathname = usePathname();

  const isNonStudentDashboard =
    pathname?.startsWith("/dashboard/admin") ||
    pathname?.startsWith("/dashboard/admin-assistant") ||
    pathname?.startsWith("/dashboard/teacher");

  if (isNonStudentDashboard) return null;

  return (
    <footer className="hidden md:block border-t py-6">
      <div className="container mx-auto px-4 md:rtl:pr-56 md:ltr:pl-56">
        <div className="text-center text-muted-foreground">
          <div className="mb-4 flex flex-wrap justify-center gap-4">
            <a
              href="https://wa.me/201148492847"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg border-2 border-brand/20 bg-brand/10 px-4 py-2 transition-colors hover:bg-brand/20"
            >
              <p className="font-semibold text-brand">خدمة العملاء (واتساب) : 01148492847</p>
            </a>
          </div>

          <p>© {new Date().getFullYear()} Mordesu Studio. جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  );
}

