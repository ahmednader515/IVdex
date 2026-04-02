"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Plus, Copy, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Course {
  id: string;
  title: string;
  isPublished: boolean;
}

interface PurchaseCode {
  id: string;
  code: string;
  courseId: string;
  isUsed: boolean;
  usedAt: string | null;
  createdAt: string;
  course: {
    id: string;
    title: string;
  };
  creator: {
    id: string;
    fullName: string;
    phoneNumber: string;
  };
  user: {
    id: string;
    fullName: string;
    phoneNumber: string;
  } | null;
}

const AdminCodesPage = () => {
  const [codes, setCodes] = useState<PurchaseCode[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [codeCount, setCodeCount] = useState<string>("1");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDescription, setConfirmDescription] = useState("");
  const [confirmActionLabel, setConfirmActionLabel] = useState("Confirm");
  const [confirmPending, setConfirmPending] = useState(false);
  const [onConfirm, setOnConfirm] = useState<null | (() => Promise<void>)>(null);

  useEffect(() => {
    fetchCodes();
    fetchCourses();
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await fetch("/api/admin/codes");
      if (response.ok) {
        const data = await response.json();
        setCodes(data);
      } else {
        toast.error("Something went wrong while loading codes");
      }
    } catch (error) {
      console.error("Error fetching codes:", error);
      toast.error("Something went wrong while loading codes");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      if (response.ok) {
        const data = await response.json();
        // Filter only published courses
        const publishedCourses = data.filter((course: Course) => course.isPublished);
        setCourses(publishedCourses);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const handleGenerateCodes = async () => {
    if (!selectedCourse || !codeCount || parseInt(codeCount) < 1 || parseInt(codeCount) > 100) {
      toast.error("Please select a course and enter a code count between 1 and 100");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/admin/codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          count: parseInt(codeCount),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Successfully created ${data.count} code(s)`);
        setIsDialogOpen(false);
        setSelectedCourse("");
        setCodeCount("1");
        fetchCodes(); // Refresh the list
      } else {
        const error = await response.text();
        toast.error(error || "Something went wrong while creating codes");
      }
    } catch (error) {
      console.error("Error generating codes:", error);
      toast.error("Something went wrong while creating codes");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success("Code copied");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  const handleCopyCourseCodes = async () => {
    if (courseFilter === "all") {
      toast.error("Select a course first");
      return;
    }
    const courseCodes = filteredCodes.filter((c) => c.courseId === courseFilter).map((c) => c.code);
    if (courseCodes.length === 0) {
      toast.error("No codes for this course");
      return;
    }
    try {
      await navigator.clipboard.writeText(courseCodes.join("\n"));
      toast.success(`Copied ${courseCodes.length} code(s)`);
    } catch {
      toast.error("Failed to copy codes");
    }
  };

  const openConfirm = (opts: {
    title: string;
    description?: string;
    actionLabel?: string;
    action: () => Promise<void>;
  }) => {
    setConfirmTitle(opts.title);
    setConfirmDescription(opts.description ?? "");
    setConfirmActionLabel(opts.actionLabel ?? "Confirm");
    setOnConfirm(() => opts.action);
    setConfirmOpen(true);
  };

  const handleDeleteCode = async (codeId: string) => {
    openConfirm({
      title: "Delete code",
      description: "Are you sure you want to delete this code? This cannot be undone.",
      actionLabel: "Delete",
      action: async () => {
        setDeletingId(codeId);
        try {
          const res = await fetch("/api/admin/codes", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codeId }),
          });
          if (res.ok) {
            toast.success("Code deleted");
            fetchCodes();
          } else {
            const msg = await res.text();
            toast.error(msg || "Something went wrong while deleting");
          }
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handleDeleteCourseCodes = async () => {
    if (courseFilter === "all") {
      toast.error("Select a course first");
      return;
    }
    const countForCourse = filteredCodes.filter((c) => c.courseId === courseFilter).length;
    if (countForCourse === 0) {
      toast.error("No codes for this course");
      return;
    }
    openConfirm({
      title: "Delete course codes",
      description: `This will delete ${countForCourse} code(s) for this course. This cannot be undone.`,
      actionLabel: "Delete all",
      action: async () => {
        setBulkDeleting(true);
        try {
          const res = await fetch("/api/admin/codes", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseId: courseFilter }),
          });
          if (res.ok) {
            const data = await res.json().catch(() => ({} as any));
            toast.success(`Deleted ${data.deleted ?? countForCourse} code(s)`);
            fetchCodes();
          } else {
            const msg = await res.text();
            toast.error(msg || "Something went wrong while deleting");
          }
        } finally {
          setBulkDeleting(false);
        }
      },
    });
  };

  const filteredCodes = codes.filter((code) => {
    const matchesSearch =
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.creator.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = courseFilter === "all" || code.courseId === courseFilter;
    return matchesSearch && matchesCourse;
  });

  const usedCodes = filteredCodes.filter((code) => code.isUsed);
  const unusedCodes = filteredCodes.filter((code) => !code.isUsed);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Code management</h1>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-brand text-white hover:bg-brand/90">
          <Plus className="h-4 w-4 mr-2" />
          Create new codes
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code, course name, or creator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="course-filter" className="whitespace-nowrap">Filter by course:</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger id="course-filter" className="w-[250px]">
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyCourseCodes}
                disabled={courseFilter === "all" || filteredCodes.filter((c) => c.courseId === courseFilter).length === 0}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy course codes
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteCourseCodes}
                disabled={bulkDeleting || courseFilter === "all" || filteredCodes.filter((c) => c.courseId === courseFilter).length === 0}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {bulkDeleting ? "Deleting..." : "Delete course codes"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCodes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Unused codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{unusedCodes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Used codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{usedCodes.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No codes found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Code</TableHead>
                  <TableHead className="text-left">Course</TableHead>
                  <TableHead className="text-left">Creator</TableHead>
                  <TableHead className="text-left">Status</TableHead>
                  <TableHead className="text-left">User</TableHead>
                  <TableHead className="text-left">Used at</TableHead>
                  <TableHead className="text-left">Created</TableHead>
                  <TableHead className="text-left">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell label="Code">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {code.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(code.code)}
                          className="h-6 w-6 p-0"
                        >
                          {copiedCode === code.code ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell label="Course">{code.course.title}</TableCell>
                    <TableCell label="Creator">
                      <div>
                        <div className="font-medium">{code.creator.fullName}</div>
                        <div className="text-sm text-muted-foreground">{code.creator.phoneNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell label="Status">
                      <Badge variant={code.isUsed ? "secondary" : "default"}>
                        {code.isUsed ? "Used" : "Unused"}
                      </Badge>
                    </TableCell>
                    <TableCell label="User">
                      {code.user ? (
                        <div>
                          <div className="font-medium">{code.user.fullName}</div>
                          <div className="text-sm text-muted-foreground">{code.user.phoneNumber}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell label="Used at">
                      {code.usedAt
                        ? format(new Date(code.usedAt), "yyyy-MM-dd HH:mm", { locale: enUS })
                        : "-"}
                    </TableCell>
                    <TableCell label="Created">
                      {format(new Date(code.createdAt), "yyyy-MM-dd HH:mm", { locale: enUS })}
                    </TableCell>
                    <TableCell label="Actions">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCode(code.code)}
                          className="gap-2"
                        >
                          {copiedCode === code.code ? (
                            <>
                              <Check className="h-4 w-4 text-green-600" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCode(code.id)}
                          disabled={deletingId === code.id}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === code.id ? "..." : "Delete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Generate Codes Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new codes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="course" className="mb-2 block">Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="count" className="mb-2 block">Number of codes</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="100"
                value={codeCount}
                onChange={(e) => setCodeCount(e.target.value)}
                placeholder="1-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateCodes}
              disabled={isGenerating || !selectedCourse || !codeCount}
              className="bg-brand text-white hover:bg-brand/90"
            >
              {isGenerating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-left">{confirmTitle}</AlertDialogTitle>
            {confirmDescription ? (
              <AlertDialogDescription className="text-left">
                {confirmDescription}
              </AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 sm:space-x-2">
            <AlertDialogCancel disabled={confirmPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={confirmPending || !onConfirm}
              onClick={async (e) => {
                e.preventDefault();
                if (!onConfirm) return;
                setConfirmPending(true);
                try {
                  await onConfirm();
                  setConfirmOpen(false);
                } finally {
                  setConfirmPending(false);
                }
              }}
            >
              {confirmPending ? "Working..." : confirmActionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCodesPage;
