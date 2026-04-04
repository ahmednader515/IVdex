"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import axios, { AxiosError } from "axios";

interface CreatedUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  role: string;
}

export type CreateStudentAccountVariant = "admin";

const API_BY_VARIANT: Record<CreateStudentAccountVariant, string> = {
  admin: "/api/admin/create-account",
};

interface CreateStudentAccountPanelProps {
  variant: CreateStudentAccountVariant;
  /** Override API endpoint (e.g. admin-assistant). */
  apiPath?: string;
  /** Omit full-page header, back button, and outer padding */
  embedded?: boolean;
}

export function CreateStudentAccountPanel({ variant, apiPath, embedded = false }: CreateStudentAccountPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const managementUsersHref = "/dashboard/admin/management?tab=users";
  const backHref = managementUsersHref;
  const successSecondaryHref = managementUsersHref;
  const successSecondaryLabel = embedded ? "View users" : "View all users";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePasswords = () => {
    return {
      match: formData.password === formData.confirmPassword,
      isValid: formData.password === formData.confirmPassword && formData.password.length > 0,
    };
  };

  const passwordChecks = validatePasswords();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!passwordChecks.isValid) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(apiPath ?? API_BY_VARIANT[variant], formData);

      if (response.data.success) {
        setCreatedUser(response.data.user);
        toast.success("Student account created successfully");
        setFormData({
          fullName: "",
          phoneNumber: "",
          password: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 400) {
        const errorMessage = axiosError.response.data as string;
        if (errorMessage.includes("Phone number already exists")) {
          toast.error("This phone number is already registered");
        } else if (errorMessage.includes("Passwords do not match")) {
          toast.error("Passwords do not match");
        } else {
          toast.error("Something went wrong while creating the account");
        }
      } else {
        toast.error("Something went wrong while creating the account");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    });
    setCreatedUser(null);
  };

  const suffix = embedded ? "-embedded" : "";

  const inner = (
    <>
      {createdUser ? (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              Account created successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-green-700 dark:text-green-300">Full name</Label>
                <p className="font-semibold text-green-800 dark:text-green-200">{createdUser.fullName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-green-700 dark:text-green-300">Phone</Label>
                <p className="font-semibold text-green-800 dark:text-green-200">{createdUser.phoneNumber}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button onClick={resetForm} className="bg-green-600 text-white hover:bg-green-700">
                Create another account
              </Button>
              <Button variant="outline" asChild>
                <Link href={successSecondaryHref}>{successSecondaryLabel}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Student details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`fullName${suffix}`}>Full name *</Label>
                  <Input
                    id={`fullName${suffix}`}
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    required
                    className="text-left"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`phoneNumber${suffix}`}>Phone *</Label>
                  <Input
                    id={`phoneNumber${suffix}`}
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    required
                    className="text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`password${suffix}`}>Password *</Label>
                  <div className="relative">
                    <Input
                      id={`password${suffix}`}
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password"
                      required
                      className="pr-10 text-left"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`confirmPassword${suffix}`}>Confirm password *</Label>
                  <div className="relative">
                    <Input
                      id={`confirmPassword${suffix}`}
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm password"
                      required
                      className="pr-10 text-left"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {formData.password && formData.confirmPassword && (
                <div className={`text-sm ${passwordChecks.match ? "text-green-600" : "text-red-600"}`}>
                  {passwordChecks.match ? (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-600" />
                      Passwords match
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-600" />
                      Passwords do not match
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                <Button
                  type="submit"
                  disabled={isLoading || !passwordChecks.isValid}
                  className="flex-1 bg-brand text-white hover:bg-brand/90 sm:flex-none"
                >
                  {isLoading ? "Creating..." : "Create account"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );

  if (embedded) {
    return <div className="mx-auto w-full max-w-2xl">{inner}</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={backHref}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create student account</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">{inner}</div>
    </div>
  );
}
