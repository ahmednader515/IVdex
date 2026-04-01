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
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import { Course } from "@prisma/client";
import { cn } from "@/lib/utils";

interface DescriptionFormProps {
  initialData: Course;
  courseId: string;
}

const formSchema = z.object({
  description: z.string().min(1, {
    message: "الوصف مطلوب",
  }),
});

export const DescriptionForm = ({ initialData, courseId }: DescriptionFormProps) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData?.description || "",
    },
  });

  useEffect(() => {
    form.reset({
      description: initialData?.description || "",
    });
  }, [initialData?.description, form.reset]);

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, values);
      toast.success("تم حفظ وصف الكورس");
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
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-base font-semibold">وصف الكورس</FormLabel>
                <FormDescription className="text-sm leading-relaxed">
                  اشرح للطالب ماذا سيتعلم ولماذا يناسبه هذا الكورس.
                </FormDescription>
                <FormControl>
                  <Textarea
                    disabled={isSubmitting}
                    placeholder="اكتب وصفاً كاملاً للكورس..."
                    className="min-h-[140px] resize-y text-base leading-relaxed md:min-h-[120px]"
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
            {isSubmitting ? "جاري الحفظ..." : "حفظ الوصف"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
