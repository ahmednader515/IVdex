"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Info } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PublishCourseBarProps {
  courseId: string;
  isPublished: boolean;
  disabled: boolean;
  variant?: "hero" | "compact";
  className?: string;
}

export function PublishCourseBar({
  courseId,
  isPublished,
  disabled,
  variant = "hero",
  className,
}: PublishCourseBarProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);

      if (isPublished) {
        await axios.patch(`/api/courses/${courseId}/unpublish`);
        toast.success("تم إلغاء النشر");
      } else {
        await axios.patch(`/api/courses/${courseId}/publish`);
        toast.success("تم نشر الكورس");
      }

      router.refresh();
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setIsLoading(false);
    }
  };

  const isHero = variant === "hero";

  const publishButton = (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        isHero
          ? "w-full min-h-14 sm:min-h-16 text-base sm:text-lg font-semibold rounded-xl shadow-md bg-brand hover:bg-brand/90 text-white px-6"
          : "bg-brand hover:bg-brand/90 text-white",
        !isHero && "size-sm",
        className
      )}
      size={isHero ? "lg" : "sm"}
    >
      {isPublished ? (
        <>
          <EyeOff className={cn("shrink-0", isHero ? "h-6 w-6 ml-2" : "h-4 w-4 mr-2")} />
          إلغاء النشر
        </>
      ) : (
        <>
          <Eye className={cn("shrink-0", isHero ? "h-6 w-6 ml-2" : "h-4 w-4 mr-2")} />
          نشر الكورس
        </>
      )}
    </Button>
  );

  if (!isHero) {
    return (
      <div className={cn("flex items-center gap-x-2", className)}>
        {disabled && !isPublished ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative w-auto">
                  {publishButton}
                  <Info className="h-4 w-4 absolute -top-1 -right-1 text-orange-500 pointer-events-none" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="text-sm">
                  <p className="font-semibold mb-2">لا يمكن نشر الكورس حتى:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• إضافة عنوان للكورس</li>
                    <li>• إضافة وصف للكورس</li>
                    <li>• إضافة صورة للكورس</li>
                    <li>• تحديد سعر للكورس (يمكن أن يكون مجاني)</li>
                    <li>• إضافة درس واحد على الأقل ونشره</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          publishButton
        )}
      </div>
    );
  }

  if (disabled && !isPublished) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative w-full">
              {publishButton}
              <Info className="h-5 w-5 absolute top-3 left-3 text-orange-500 pointer-events-none" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="text-sm">
              <p className="font-semibold mb-2">لا يمكن نشر الكورس حتى:</p>
              <ul className="space-y-1 text-xs">
                <li>• إضافة عنوان للكورس</li>
                <li>• إضافة وصف للكورس</li>
                <li>• إضافة صورة للكورس</li>
                <li>• تحديد سعر للكورس (يمكن أن يكون مجاني)</li>
                <li>• إضافة درس واحد على الأقل ونشره</li>
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return publishButton;
}

/** Header publish control — used by admin course editor */
export function Actions(props: Pick<PublishCourseBarProps, "courseId" | "isPublished" | "disabled">) {
  return <PublishCourseBar {...props} variant="compact" />;
}
