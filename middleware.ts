import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Helper function to get dashboard URL by role
function getDashboardUrlByRole(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin/courses";
    case "ADMIN_ASSISTANT":
      return "/dashboard/admin-assistant/management";
    case "STUDENT":
    default:
      return "/dashboard";
  }
}

export default withAuth(
  function middleware(req) {
    // Backwards-compatible route redirects (old URLs)
    if (req.nextUrl.pathname.startsWith("/dashboard/teacher")) {
      const nextPath = req.nextUrl.pathname.replace("/dashboard/teacher", "/dashboard/admin");
      const url = req.nextUrl.clone();
      url.pathname = nextPath;
      return NextResponse.redirect(url);
    }

    const isAdminRoute = req.nextUrl.pathname.startsWith("/dashboard/admin");
    const isAdmin = req.nextauth.token?.role === "ADMIN";
    const isAdminAssistantRoute = req.nextUrl.pathname.startsWith("/dashboard/admin-assistant");
    const isAdminAssistant = req.nextauth.token?.role === "ADMIN_ASSISTANT";

    // If an admin assistant hits old admin URLs, send to admin-assistant
    if (isAdminAssistant && isAdminRoute && !isAdminAssistantRoute) {
      const nextPath = req.nextUrl.pathname.replace("/dashboard/admin", "/dashboard/admin-assistant");
      const url = req.nextUrl.clone();
      url.pathname = nextPath;
      return NextResponse.redirect(url);
    }
    const isAuthPage = req.nextUrl.pathname.startsWith("/sign-in") || 
                      req.nextUrl.pathname.startsWith("/sign-up") ||
                      req.nextUrl.pathname.startsWith("/forgot-password") ||
                      req.nextUrl.pathname.startsWith("/reset-password") ||
                      req.nextUrl.pathname.startsWith("/device-conflict"); // ✅ Add this
    
    // Add check for payment status page
    const isPaymentStatusPage = req.nextUrl.pathname.includes("/payment-status");

    // If user is on auth page and is authenticated, redirect to appropriate dashboard
    if (isAuthPage && req.nextauth.token) {
      const userRole = req.nextauth.token?.role || "STUDENT";
      const dashboardUrl = getDashboardUrlByRole(userRole);
      return NextResponse.redirect(new URL(dashboardUrl, req.url));
    }

    // If user is not authenticated and trying to access protected routes
    // But exclude payment status page from this check
    if (!req.nextauth.token && !isAuthPage && !isPaymentStatusPage) {
      return NextResponse.redirect(new URL("/sign-in", req.url), { status: 302 });
    }

    // If user is not admin (or admin assistant) but trying to access admin routes
    if (isAdminRoute && !(isAdmin || isAdminAssistant)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // If user is not an admin assistant but trying to access admin-assistant routes
    if (isAdminAssistantRoute && !isAdminAssistant) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // If user accesses main dashboard, redirect to role-specific dashboard
    if (req.nextUrl.pathname === "/dashboard" && req.nextauth.token) {
      const userRole = req.nextauth.token?.role || "STUDENT";
      const dashboardUrl = getDashboardUrlByRole(userRole);
      
      // Only redirect if the user's role-specific dashboard is different from the main dashboard
      if (userRole !== "STUDENT") {
        return NextResponse.redirect(new URL(dashboardUrl, req.url));
      }
    }

    // Handle POST requests to payment status page
    if (isPaymentStatusPage && req.method === "POST") {
      // Convert POST to GET by redirecting to the same URL
      return NextResponse.redirect(req.url, { status: 303 });
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => true, // We'll handle authorization in the middleware function
    },
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|teacher-image.png|logo.png|male.png|medal.png|graduation-hat.png|notebook.png|eng.png|australia.png|new-zealand.png|europe.png|asia.png|africa.png|south-america.png|north-america.png|oceania.png|antarctica.png|atom.png|sodium.png|music.png|tiktok.png|facebook.png|instagram.png|twitter.png|youtube.png|linkedin.png|).*)",
  ],
};