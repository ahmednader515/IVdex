"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Eye, Edit, Search, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface User {
    id: string;
    fullName: string;
    phoneNumber: string;
    role: string;
}

export function AdminPasswordsPanel({ embedded = false }: { embedded?: boolean }) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [staffPage, setStaffPage] = useState(1);
    const [studentsPage, setStudentsPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/admin-assistant/users");
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!selectedUser || !newPassword) {
            toast.error("Please enter a new password");
            return;
        }

        try {
            const response = await fetch(`/api/admin-assistant/users/${selectedUser.id}/password`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ newPassword }),
            });

            if (response.ok) {
                toast.success("Password updated successfully");
                setNewPassword("");
                setIsDialogOpen(false);
                setSelectedUser(null);
            } else {
                toast.error("Something went wrong while changing the password");
            }
        } catch (error) {
            console.error("Error changing password:", error);
            toast.error("Something went wrong while changing the password");
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber.includes(searchTerm)
    );

    const staffUsers = filteredUsers.filter(
        user => user.role === "ADMIN" || user.role === "ADMIN_ASSISTANT"
    );
    const studentUsers = filteredUsers.filter(user => user.role === "STUDENT");

    const staffTotalPages = Math.max(1, Math.ceil(staffUsers.length / pageSize));
    const studentsTotalPages = Math.max(1, Math.ceil(studentUsers.length / pageSize));
    const staffPageSafe = Math.min(Math.max(1, staffPage), staffTotalPages);
    const studentsPageSafe = Math.min(Math.max(1, studentsPage), studentsTotalPages);
    const staffStart = (staffPageSafe - 1) * pageSize;
    const studentsStart = (studentsPageSafe - 1) * pageSize;
    const staffPageItems = staffUsers.slice(staffStart, staffStart + pageSize);
    const studentsPageItems = studentUsers.slice(studentsStart, studentsStart + pageSize);

    const applySearch = () => {
        setSearchTerm(searchInput.trim());
        setStaffPage(1);
        setStudentsPage(1);
    };

    if (loading) {
        return (
            <div className={embedded ? "py-4" : "p-6"}>
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    return (
        <div className={embedded ? "space-y-4" : "p-6 space-y-6"}>
            {!embedded && (
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Password management
                </h1>
            </div>
            )}

            {/* Staff Table (Admins and Teachers) */}
            {staffUsers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Staff</CardTitle>
                        <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <form
                                className="flex w-full max-w-sm gap-2"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    applySearch();
                                }}
                            >
                                <Input
                                    placeholder="Search by name or phone..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="text-left"
                                />
                                <Button type="submit" variant="outline" className="shrink-0">
                                    Search
                                </Button>
                            </form>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-left">Name</TableHead>
                                    <TableHead className="text-left">Phone</TableHead>
                                    <TableHead className="text-left">Role</TableHead>
                                    <TableHead className="text-left">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {staffPageItems.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell label="Name" className="font-medium">
                                            {user.fullName}
                                        </TableCell>
                                        <TableCell label="Phone">{user.phoneNumber}</TableCell>
                                        <TableCell label="Role">
                                            <Badge 
                                                variant="secondary"
                                                className={
                                                    user.role === "ADMIN" ? "bg-orange-600 text-white hover:bg-orange-700" : 
                                                    ""
                                                }
                                            >
                                                {user.role === "ADMIN_ASSISTANT"
                                                    ? "Admin assistant"
                                                    : user.role === "ADMIN"
                                                      ? "Admin"
                                                      : user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell label="Actions">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                className="gap-2"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                                Change password
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-muted-foreground">
                                Showing {staffUsers.length === 0 ? 0 : staffStart + 1}-{Math.min(staffStart + pageSize, staffUsers.length)} of {staffUsers.length}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setStaffPage((p) => Math.max(1, p - 1))} disabled={staffPageSafe <= 1}>
                                    Previous
                                </Button>
                                <div className="text-sm">
                                    Page {staffPageSafe} / {staffTotalPages}
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setStaffPage((p) => Math.min(staffTotalPages, p + 1))} disabled={staffPageSafe >= staffTotalPages}>
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Students Table */}
            {studentUsers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Students</CardTitle>
                        <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <form
                                className="flex w-full max-w-sm gap-2"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    applySearch();
                                }}
                            >
                                <Input
                                    placeholder="Search by name or phone..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="text-left"
                                />
                                <Button type="submit" variant="outline" className="shrink-0">
                                    Search
                                </Button>
                            </form>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-left">Name</TableHead>
                                    <TableHead className="text-left">Phone</TableHead>
                                    <TableHead className="text-left">Role</TableHead>
                                    <TableHead className="text-left">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentsPageItems.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell label="Name" className="font-medium">
                                            {user.fullName}
                                        </TableCell>
                                        <TableCell label="Phone">{user.phoneNumber}</TableCell>
                                        <TableCell label="Role">
                                            <Badge variant="secondary">
                                                Student
                                            </Badge>
                                        </TableCell>
                                        <TableCell label="Actions">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                className="gap-2"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                                Change password
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-muted-foreground">
                                Showing {studentUsers.length === 0 ? 0 : studentsStart + 1}-{Math.min(studentsStart + pageSize, studentUsers.length)} of {studentUsers.length}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setStudentsPage((p) => Math.max(1, p - 1))} disabled={studentsPageSafe <= 1}>
                                    Previous
                                </Button>
                                <div className="text-sm">
                                    Page {studentsPageSafe} / {studentsTotalPages}
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setStudentsPage((p) => Math.min(studentsTotalPages, p + 1))} disabled={studentsPageSafe >= studentsTotalPages}>
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {filteredUsers.length === 0 && !loading && (
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center text-muted-foreground">
                            No users found
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Single lightweight dialog rendered once */}
            <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsDialogOpen(false);
                        setNewPassword("");
                        setSelectedUser(null);
                        setShowPassword(false);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Change password — {selectedUser?.fullName}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New password</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="pr-10 text-left"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsDialogOpen(false);
                                    setNewPassword("");
                                    setSelectedUser(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handlePasswordChange}>
                                Update password
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
