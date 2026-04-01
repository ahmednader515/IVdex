"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
import { Course } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PriceFormProps {
  initialData: Course;
  courseId: string;
}

const formSchema = z.object({
  price: z.coerce.number(),
});

export const PriceForm = ({ initialData, courseId }: PriceFormProps) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: initialData?.price ?? 0,
    },
  });

  useEffect(() => {
    form.reset({
      price: initialData?.price ?? 0,
    });
  }, [initialData?.price, form.reset]);

  const { isSubmitting, isValid } = form.formState;

  const [priceInput, setPriceInput] = useState<string>(String(initialData?.price ?? 0));

  useEffect(() => {
    setPriceInput(String(initialData?.price ?? 0));
  }, [initialData?.price]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, values);
      toast.success("تم حفظ السعر");
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
            name="price"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-base font-semibold">سعر الكورس (جنيه)</FormLabel>
                <FormDescription className="text-sm leading-relaxed">
                  اكتب <span className="font-medium text-foreground">0</span> ليكون الكورس{" "}
                  <span className="font-medium text-foreground">مجانياً</span>.
                </FormDescription>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    disabled={isSubmitting}
                    placeholder="0"
                    className="min-h-12 text-base md:min-h-11 max-w-full sm:max-w-xs"
                    name={field.name}
                    ref={field.ref}
                    onFocus={(e) => {
                      // On mobile, the initial "0" tends to stick; select it so typing replaces it.
                      if (e.currentTarget.value === "0") {
                        e.currentTarget.select();
                      }
                    }}
                    onBlur={(e) => {
                      field.onBlur();
                      // If user clears the input, treat it as 0 (free).
                      if (e.currentTarget.value.trim() === "") {
                        setPriceInput("0");
                        form.setValue("price", 0, { shouldDirty: true, shouldValidate: true });
                      }
                    }}
                    value={priceInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string while typing (don't force 0 back in / avoid NaN errors).
                      setPriceInput(value);
                      if (value.trim() === "") return;
                      const n = parseFloat(value);
                      if (Number.isFinite(n)) {
                        form.setValue("price", n, { shouldDirty: true, shouldValidate: true });
                      }
                    }}
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
            {isSubmitting ? "جاري الحفظ..." : "حفظ السعر"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
