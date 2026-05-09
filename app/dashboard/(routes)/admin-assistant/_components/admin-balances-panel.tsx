"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Edit, Search, Wallet } from "lucide-react";
import { toast } from "sonner";

interface User {
    id: string;
    fullName: string;
    phoneNumber: string;
    role: string;
    balance: number;
}

export function AdminBalancesPanel({ embedded = false }: { embedded?: boolean }) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newBalance, setNewBalance] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [page, setPage] = useState(1);
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

    const handleBalanceUpdate = async () => {
        if (!selectedUser || !newBalance) {
            toast.error("Please enter a new balance");
            return;
        }

        const balance = parseFloat(newBalance);
        if (isNaN(balance) || balance < 0) {
            toast.error("Please enter a valid balance");
            return;
        }

        try {
            const response = await fetch(`/api/admin-assistant/users/${selectedUser.id}/balance`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ newBalance: balance }),
            });

            if (response.ok) {
                toast.success("Balance updated successfully");
                setNewBalance("");
                setIsDialogOpen(false);
                setSelectedUser(null);
                fetchUsers(); // Refresh the list
            } else {
                toast.error("Something went wrong while updating balance");
            }
        } catch (error) {
            console.error("Error updating balance:", error);
            toast.error("Something went wrong while updating balance");
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber.includes(searchTerm)
    );

    const studentUsers = filteredUsers.filter(user => user.role === "STUDENT");
    const totalPages = Math.max(1, Math.ceil(studentUsers.length / pageSize));
    const pageSafe = Math.min(Math.max(1, page), totalPages);
    const start = (pageSafe - 1) * pageSize;
    const pageItems = studentUsers.slice(start, start + pageSize);

    const applySearch = () => {
        setSearchTerm(searchInput.trim());
        setPage(1);
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
                    Balance management
                </h1>
            </div>
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
                                    <TableHead className="text-left">Current balance</TableHead>
                                    <TableHead className="text-left">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pageItems.map((user) => (
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
                                        <TableCell label="Balance">
                                            <Badge variant="outline" className="flex w-fit items-center gap-1">
                                                <Wallet className="h-3 w-3" />
                                                {user.balance} EGP
                                            </Badge>
                                        </TableCell>
                                        <TableCell label="Actions">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                className="gap-2"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setNewBalance(user.balance.toString());
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                                Edit balance
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-muted-foreground">
                                Showing {studentUsers.length === 0 ? 0 : start + 1}-{Math.min(start + pageSize, studentUsers.length)} of {studentUsers.length}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe <= 1}>
                                    Previous
                                </Button>
                                <div className="text-sm">
                                    Page {pageSafe} / {totalPages}
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe >= totalPages}>
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {studentUsers.length === 0 && !loading && (
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center text-muted-foreground">
                            No students found
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
                        setNewBalance("");
                        setSelectedUser(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Edit balance — {selectedUser?.fullName}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newBalance">New balance (EGP)</Label>
                            <Input
                                id="newBalance"
                                type="number"
                                value={newBalance}
                                onChange={(e) => setNewBalance(e.target.value)}
                                placeholder="Enter new balance"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsDialogOpen(false);
                                    setNewBalance("");
                                    setSelectedUser(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleBalanceUpdate}>
                                Update balance
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
