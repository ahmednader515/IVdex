"use client";

import axios from "axios";
import { useRouter } from "next/navigation";

import { ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { Course } from "@prisma/client";
import Image from "next/image";
import { FileUpload } from "@/components/file-upload";
import { cn } from "@/lib/utils";

interface ImageFormProps {
  initialData: Course;
  courseId: string;
}

export const ImageForm = ({ initialData, courseId }: ImageFormProps) => {
  const router = useRouter();

  const onSubmit = async (values: { imageUrl: string }) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, values);
      toast.success("تم تحديث صورة الكورس");
      router.refresh();
    } catch {
      toast.error("حدث خطأ");
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-4 shadow-sm md:p-5",
        "space-y-4"
      )}
    >
      <div>
        <h3 className="text-base font-semibold">صورة غلاف الكورس</h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          تُعرض في الصفحة الرئيسية وبطاقة الكورس. يُفضّل نسبة قريبة من 16:9 وصورة واضحة.
        </p>
      </div>

      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/40",
          "aspect-video max-h-[220px] sm:max-h-[280px]"
        )}
      >
        {initialData.imageUrl ? (
          <Image
            alt="صورة الكورس"
            fill
            className="object-cover"
            src={initialData.imageUrl}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 p-6 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/70" aria-hidden />
            <p className="text-sm font-medium text-muted-foreground">لا توجد صورة بعد</p>
            <p className="text-xs text-muted-foreground">استخدم الرفع أدناه لإضافة غلاف</p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 sm:p-4">
        <p className="mb-3 text-sm font-medium text-foreground">
          {initialData.imageUrl ? "تغيير الصورة" : "رفع صورة"}
        </p>
        <FileUpload
          endpoint="courseImage"
          onChange={(res) => {
            if (res) {
              onSubmit({ imageUrl: res.url });
            }
          }}
        />
      </div>
    </div>
  );
};
