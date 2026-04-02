"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { auth } from "@/lib/auth";
import { ArrowLeft, CreditCard, Wallet, AlertCircle, Ticket, Check } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Course {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  price?: number | null;
}

export default function PurchasePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const router = useRouter();
  const { courseId } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [code, setCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [codeRedeemed, setCodeRedeemed] = useState(false);

  useEffect(() => {
    fetchCourse();
    fetchUserBalance();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      } else {
        toast.error("Something went wrong while loading the course");
      }
    } catch (error) {
      console.error("Error fetching course:", error);
      toast.error("Something went wrong while loading the course");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await fetch("/api/user/balance");
      if (response.ok) {
        const data = await response.json();
        setUserBalance(data.balance);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleRedeemCode = async () => {
    if (!code.trim()) {
      toast.error("Please enter a code");
      return;
    }

    setIsRedeeming(true);
    try {
      const response = await fetch("/api/codes/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Code redeemed successfully. Course purchased.");
        setCodeRedeemed(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        const error = await response.text();
        if (error.includes("already been used")) {
          toast.error("This code has already been used");
        } else if (error.includes("already purchased")) {
          toast.error("You have already purchased this course");
        } else if (error.includes("Invalid code")) {
          toast.error("Invalid code");
        } else {
          toast.error(error || "Something went wrong while redeeming the code");
        }
      }
    } catch (error) {
      console.error("Error redeeming code:", error);
      toast.error("Something went wrong while redeeming the code");
    } finally {
      setIsRedeeming(false);
    }
  };

  const handlePurchase = async () => {
    if (!course) return;

    setIsPurchasing(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/purchase`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Course purchased successfully!");
        router.push("/dashboard");
      } else {
        const error = await response.text();
        if (error.includes("Insufficient balance")) {
          toast.error("Insufficient balance. Please add funds to your account.");
        } else if (error.includes("already purchased")) {
          toast.error("You have already purchased this course");
        } else {
          toast.error(error || "Something went wrong while purchasing");
        }
      }
    } catch (error) {
      console.error("Error purchasing course:", error);
      toast.error("Something went wrong while purchasing");
    } finally {
      setIsPurchasing(false);
    }
  };

  const hasSufficientBalance = course && userBalance >= (course.price || 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Course not found</h1>
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Purchase course</h1>
          </div>

          {/* Course Details */}
          <Card>
            <CardHeader>
              <CardTitle>{course.title}</CardTitle>
              <CardDescription>
                {course.description || "No description for this course."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {course.imageUrl && (
                <div className="mb-4">
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="text-2xl font-bold text-brand">
                {course.price?.toFixed(2) || "0.00"} EGP
              </div>
            </CardContent>
          </Card>

          {/* Balance Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Account balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBalance ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand"></div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xl font-bold">
                    {userBalance.toFixed(2)} EGP
                  </div>
                  {!hasSufficientBalance && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Insufficient balance to purchase this course</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Code Redemption */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Have a purchase code?
              </CardTitle>
              <CardDescription>
                Enter your code to unlock this course at no charge.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="code" className="sr-only">
                    Purchase code
                  </Label>
                  <Input
                    id="code"
                    placeholder="Enter code here"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    disabled={isRedeeming || codeRedeemed}
                    className="text-center font-mono"
                  />
                </div>
                <Button
                  onClick={handleRedeemCode}
                  disabled={isRedeeming || !code.trim() || codeRedeemed}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isRedeeming ? (
                    "Redeeming..."
                  ) : codeRedeemed ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Redeemed
                    </>
                  ) : (
                    "Redeem code"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Purchase Actions */}
          <div className="space-y-4">
            {!hasSufficientBalance && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-amber-700 mb-4">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Insufficient balance</span>
                  </div>
                  <p className="text-amber-700 mb-4">
                    You need {(course.price || 0) - userBalance} more EGP to purchase this course.
                  </p>
                  <Button asChild className="bg-brand text-white hover:bg-brand/90">
                    <Link href="/dashboard/balance">Add balance</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handlePurchase}
              disabled={isPurchasing || !hasSufficientBalance || codeRedeemed}
              className="w-full bg-brand hover:bg-brand/90 text-white"
              size="lg"
            >
              {isPurchasing ? (
                "Purchasing..."
              ) : (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Purchase course
                </div>
              )}
            </Button>

            {!codeRedeemed && (
              <div className="text-center text-sm text-muted-foreground">
                <p>{course.price?.toFixed(2) || "0.00"} EGP will be deducted from your balance</p>
                <p>You will get access to the course immediately after purchase</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
