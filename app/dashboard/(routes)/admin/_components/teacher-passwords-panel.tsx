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

export function TeacherPasswordsPanel({ embedded = false }: { embedded?: boolean }) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/admin/users");
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
            const response = await fetch(`/api/admin/users/${selectedUser.id}/password`, {
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
                            <Input
                                placeholder="Search by name or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm text-left"
                            />
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
                                {staffUsers.map((user) => (
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
                            <Input
                                placeholder="Search by name or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm text-left"
                            />
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
                                {studentUsers.map((user) => (
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
