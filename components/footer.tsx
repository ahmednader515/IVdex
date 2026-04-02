"use client";

import { usePathname } from "next/navigation";

export const Footer = () => {
  const pathname = usePathname();

  // Student dashboard has its own support button (no footer bar).
  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  const isTeacherOrAdminDashboard =
    pathname?.startsWith("/dashboard/teacher") ||
    pathname?.startsWith("/dashboard/admin");

  if (isTeacherOrAdminDashboard) {
    return null;
  }

  const hasSidebar =
    pathname?.startsWith("/dashboard") || pathname?.startsWith("/courses");

  return (
    <footer className="border-t py-6">
      <div className="container mx-auto px-4">
        <div
          className={`text-center text-muted-foreground ${
            hasSidebar
              ? "md:rtl:pr-56 md:ltr:pl-56 lg:rtl:pr-80 lg:ltr:pl-80"
              : ""
          }`}
        >
          <div className="mb-4 flex flex-wrap justify-center gap-4">
            <a
              href="https://wa.me/201148492847"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg border-2 border-brand/20 bg-brand/10 px-4 py-2 transition-colors hover:bg-brand/20"
            >
              <p className="font-semibold text-brand">Customer support (WhatsApp): 01148492847</p>
            </a>
          </div>

          <p>© {new Date().getFullYear()} Mordesu Studio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
