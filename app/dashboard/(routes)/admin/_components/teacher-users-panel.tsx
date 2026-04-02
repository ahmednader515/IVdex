"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface User {
    id: string;
    fullName: string;
    phoneNumber: string;
    parentPhoneNumber: string;
    role: string;
    balance: number;
    createdAt: string;
    updatedAt: string;
    _count: {
        courses: number;
        purchases: number;
        userProgress: number;
    };
}

interface EditUserData {
    fullName: string;
    phoneNumber: string;
    parentPhoneNumber: string;
    role: string;
}

function getRoleLabel(role: string) {
    switch (role) {
        case "ADMIN":
            return "Admin";
        case "ADMIN_ASSISTANT":
            return "Admin assistant";
        case "STUDENT":
            return "Student";
        default:
            return role;
    }
}

export function TeacherUsersPanel({ embedded = false }: { embedded?: boolean }) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editData, setEditData] = useState<EditUserData>({
        fullName: "",
        phoneNumber: "",
        parentPhoneNumber: "",
        role: ""
    });
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/admin/users");
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                console.error("Error fetching users:", response.status, response.statusText);
                if (response.status === 403) {
                    toast.error("You do not have permission to access this page");
                } else {
                    toast.error("Something went wrong while loading users");
                }
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Something went wrong while loading users");
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setEditData({
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            parentPhoneNumber: user.parentPhoneNumber,
            role: user.role
        });
        setIsEditDialogOpen(true);
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;

        try {
            const response = await fetch(`/api/admin/users/${editingUser.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(editData),
            });

            if (response.ok) {
                const userType = getRoleLabel(editingUser.role);
                toast.success(`${userType} updated successfully`);
                setIsEditDialogOpen(false);
                setEditingUser(null);
                fetchUsers(); // Refresh the list
            } else {
                const error = await response.text();
                console.error("Error updating user:", response.status, error);
                if (response.status === 403) {
                    toast.error("You do not have permission to edit this data");
                } else if (response.status === 404) {
                    toast.error("User not found");
                } else if (response.status === 400) {
                    toast.error(error || "Invalid data");
                } else {
                    toast.error("Something went wrong while updating");
                }
            }
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error("Something went wrong while updating the user");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("User deleted successfully");
                fetchUsers(); // Refresh the list
            } else {
                const error = await response.text();
                console.error("Error deleting user:", response.status, error);
                if (response.status === 403) {
                    toast.error("You do not have permission to delete this user");
                } else if (response.status === 404) {
                    toast.error("User not found");
                } else {
                    toast.error(error || "Something went wrong while deleting");
                }
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Something went wrong while deleting the user");
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber.includes(searchTerm)
    );

    // Separate users by role
    const studentUsers = filteredUsers.filter(user => user.role === "STUDENT");
    const staffUsers = filteredUsers.filter(user => user.role === "ADMIN" || user.role === "ADMIN_ASSISTANT");

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
                    User management
                </h1>
            </div>
            )}

            {/* Staff Table (Admins and Teachers) */}
            {staffUsers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-left">Staff</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative w-full max-w-sm">
                                <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
                                <Input
                                    placeholder="Search by name or phone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full min-h-11 ps-10"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-left">Name</TableHead>
                                    <TableHead className="text-left">Phone</TableHead>
                                    <TableHead className="text-left">Parent phone</TableHead>
                                    <TableHead className="text-left">Role</TableHead>
                                    <TableHead className="text-left">Registered</TableHead>
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
                                        <TableCell label="Parent phone">{user.parentPhoneNumber}</TableCell>
                                        <TableCell label="Role">
                                            <Badge 
                                                variant="secondary"
                                                className={
                                                    user.role === "ADMIN" ? "bg-blue-600 text-white hover:bg-blue-700" :
                                                    user.role === "ADMIN_ASSISTANT" ? "bg-orange-600 text-white hover:bg-orange-700" :
                                                    ""
                                                }
                                            >
                                                {getRoleLabel(user.role)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell label="Registered">
                                            {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: enUS })}
                                        </TableCell>
                                        <TableCell label="Actions">
                                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                                                <Dialog open={isEditDialogOpen && editingUser?.id === user.id} onOpenChange={(open) => {
                                                    if (!open) {
                                                        setIsEditDialogOpen(false);
                                                        setEditingUser(null);
                                                    }
                                                }}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            className="min-h-11 w-full justify-center gap-2 bg-brand text-white hover:bg-brand/90 sm:w-auto"
                                                            onClick={() => handleEditUser(user)}
                                                        >
                                                            <Edit className="h-4 w-4 shrink-0" />
                                                            Edit
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Edit {getRoleLabel(user.role)}</DialogTitle>
                                                            <DialogDescription>
                                                                Update {getRoleLabel(user.role)} information
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-4 py-4">
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="fullName" className="text-left">
                                                                    Name
                                                                </Label>
                                                                <Input
                                                                    id="fullName"
                                                                    value={editData.fullName}
                                                                    onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                                                                    className="col-span-3"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="phoneNumber" className="text-left">
                                                                    Phone
                                                                </Label>
                                                                <Input
                                                                    id="phoneNumber"
                                                                    value={editData.phoneNumber}
                                                                    onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                                                                    className="col-span-3"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="parentPhoneNumber" className="text-left">
                                                                    Parent phone
                                                                </Label>
                                                                <Input
                                                                    id="parentPhoneNumber"
                                                                    value={editData.parentPhoneNumber}
                                                                    onChange={(e) => setEditData({...editData, parentPhoneNumber: e.target.value})}
                                                                    className="col-span-3"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="role" className="text-left">
                                                                    Role
                                                                </Label>
                                                                <Select
                                                                    value={editData.role}
                                                                    onValueChange={(value) => setEditData({...editData, role: value})}
                                                                >
                                                                    <SelectTrigger className="col-span-3">
                                                                        <SelectValue placeholder="Select role" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="STUDENT">Student</SelectItem>
                                                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                                                        <SelectItem value="ADMIN_ASSISTANT">Admin assistant</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => {
                                                                setIsEditDialogOpen(false);
                                                                setEditingUser(null);
                                                            }}>
                                                                Cancel
                                                            </Button>
                                                            <Button onClick={handleSaveUser}>
                                                                Save changes
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                                
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="destructive"
                                                            className="min-h-11 w-full justify-center gap-2 sm:w-auto"
                                                            disabled={isDeleting}
                                                        >
                                                            <Trash2 className="h-4 w-4 shrink-0" />
                                                            Delete
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This cannot be undone. This will permanently delete the {getRoleLabel(user.role).toLowerCase()} and related data.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
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
                        <CardTitle className="text-left">Students</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative w-full max-w-sm">
                                <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
                                <Input
                                    placeholder="Search by name or phone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full min-h-11 ps-10"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-left">Name</TableHead>
                                    <TableHead className="text-left">Phone</TableHead>
                                    <TableHead className="text-left">Parent phone</TableHead>
                                    <TableHead className="text-left">Role</TableHead>
                                    <TableHead className="text-left">Balance</TableHead>
                                    <TableHead className="text-left">Purchased courses</TableHead>
                                    <TableHead className="text-left">Registered</TableHead>
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
                                        <TableCell label="Parent phone">{user.parentPhoneNumber}</TableCell>
                                        <TableCell label="Role">
                                            <Badge 
                                                variant="secondary"
                                                className="bg-green-600 text-white hover:bg-green-700"
                                            >
                                                Student
                                            </Badge>
                                        </TableCell>
                                        <TableCell label="Balance">
                                            <Badge variant="secondary">
                                                {user.balance} EGP
                                            </Badge>
                                        </TableCell>
                                        <TableCell label="Purchases">
                                            <Badge variant="outline">
                                                {user._count.purchases}
                                            </Badge>
                                        </TableCell>
                                        <TableCell label="Registered">
                                            {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: enUS })}
                                        </TableCell>
                                        <TableCell label="Actions">
                                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                                                <Dialog open={isEditDialogOpen && editingUser?.id === user.id} onOpenChange={(open) => {
                                                    if (!open) {
                                                        setIsEditDialogOpen(false);
                                                        setEditingUser(null);
                                                    }
                                                }}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            className="min-h-11 w-full justify-center gap-2 bg-brand text-white hover:bg-brand/90 sm:w-auto"
                                                            onClick={() => handleEditUser(user)}
                                                        >
                                                            <Edit className="h-4 w-4 shrink-0" />
                                                            Edit
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Edit student</DialogTitle>
                                                            <DialogDescription>
                                                                Update student information
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-4 py-4">
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="fullName" className="text-left">
                                                                    Name
                                                                </Label>
                                                                <Input
                                                                    id="fullName"
                                                                    value={editData.fullName}
                                                                    onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                                                                    className="col-span-3"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="phoneNumber" className="text-left">
                                                                    Phone
                                                                </Label>
                                                                <Input
                                                                    id="phoneNumber"
                                                                    value={editData.phoneNumber}
                                                                    onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                                                                    className="col-span-3"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="parentPhoneNumber" className="text-left">
                                                                    Parent phone
                                                                </Label>
                                                                <Input
                                                                    id="parentPhoneNumber"
                                                                    value={editData.parentPhoneNumber}
                                                                    onChange={(e) => setEditData({...editData, parentPhoneNumber: e.target.value})}
                                                                    className="col-span-3"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="role" className="text-left">
                                                                    Role
                                                                </Label>
                                                                <Select
                                                                    value={editData.role}
                                                                    onValueChange={(value) => setEditData({...editData, role: value})}
                                                                >
                                                                    <SelectTrigger className="col-span-3">
                                                                        <SelectValue placeholder="Select role" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="STUDENT">Student</SelectItem>
                                                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                                                        <SelectItem value="ADMIN_ASSISTANT">Admin assistant</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => {
                                                                setIsEditDialogOpen(false);
                                                                setEditingUser(null);
                                                            }}>
                                                                Cancel
                                                            </Button>
                                                            <Button onClick={handleSaveUser}>
                                                                Save changes
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                                
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="destructive"
                                                            className="min-h-11 w-full justify-center gap-2 sm:w-auto"
                                                            disabled={isDeleting}
                                                        >
                                                            <Trash2 className="h-4 w-4 shrink-0" />
                                                            Delete
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This cannot be undone. This will permanently delete the student and related data.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {staffUsers.length === 0 && studentUsers.length === 0 && !loading && (
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center text-muted-foreground">
                            No registered users yet
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
