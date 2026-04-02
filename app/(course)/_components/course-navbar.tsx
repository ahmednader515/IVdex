"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { ChevronRight, LogOut } from "lucide-react";
import { CourseMobileSidebar } from "./course-mobile-sidebar";
import { UserButton } from "@/components/user-button";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export const CourseNavbar = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isBackLoading, setIsBackLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Call logout API to end session
      await fetch("/api/auth/logout", { method: "POST" });
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleBackToDashboard = () => {
    setIsBackLoading(true);
    router.push("/dashboard");
  };

  return (
    <div className="p-4 h-full flex items-center bg-card text-foreground border-b shadow-sm">
      <div className="flex items-center">
        <CourseMobileSidebar />
        <LoadingButton
          onClick={handleBackToDashboard}
          variant="ghost"
          size="sm"
          loading={isBackLoading}
          loadingText="Going back..."
          className="flex items-center gap-x-2 hover:bg-slate-100 ml-2"
        >
          <span className="text-left">Back to courses</span>
          <ChevronRight className="h-4 w-4" />
        </LoadingButton>
      </div>
      <div className="flex items-center gap-x-4 ml-auto">
        {session?.user && (
          <LoadingButton 
            size="sm" 
            variant="ghost" 
            onClick={handleLogout}
            loading={isLoggingOut}
            loadingText="Signing out..."
            className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 ease-in-out"
          >
            <LogOut className="h-4 w-4 mr-2"/>
            Log out
          </LoadingButton>
        )}
        <UserButton />
      </div>
    </div>
  );
}; 