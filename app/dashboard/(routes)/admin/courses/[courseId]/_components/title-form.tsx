"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface TitleFormProps {
  initialData: {
    title: string;
  };
  courseId: string;
}

const formSchema = z.object({
  title: z.string().min(1, {
    message: "عنوان الكورس مطلوب",
  }),
});

export const TitleForm = ({ initialData, courseId }: TitleFormProps) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  useEffect(() => {
    form.reset({ title: initialData.title });
  }, [initialData.title, form.reset]);

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, values);
      toast.success("تم حفظ عنوان الكورس");
      router.refresh();
    } catch {
      toast.error("حدث خطأ");
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-4 shadow-sm md:p-5",
        "ring-offset-background focus-within:ring-2 focus-within:ring-brand/20 focus-within:ring-offset-2"
      )}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-base font-semibold">عنوان الكورس</FormLabel>
                <FormDescription className="text-sm leading-relaxed">
                  يظهر للطلاب في القائمة وفي صفحة الكورس. اختر عنواناً واضحاً.
                </FormDescription>
                <FormControl>
                  <Input
                    disabled={isSubmitting}
                    placeholder="مثال: الرياضيات للصف الثالث الثانوي"
                    className="min-h-12 text-base md:min-h-11"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            disabled={!isValid || isSubmitting}
            type="submit"
            className="mt-2 w-full min-h-11 bg-brand hover:bg-brand/90 sm:w-auto sm:min-h-10"
          >
            {isSubmitting ? "جاري الحفظ..." : "حفظ العنوان"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
