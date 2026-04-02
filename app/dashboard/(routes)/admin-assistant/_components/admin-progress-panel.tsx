"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Search, Eye, BookOpen, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

interface User {
    id: string;
    fullName: string;
    phoneNumber: string;
    role: string;
    _count: {
        purchases: number;
        userProgress: number;
    };
}

interface UserProgress {
    id: string;
    isCompleted: boolean;
    updatedAt: string;
    chapter: {
        id: string;
        title: string;
        course: {
            id: string;
            title: string;
        };
    };
}

interface Chapter {
    id: string;
    title: string;
    isPublished: boolean;
    course: {
        id: string;
        title: string;
    };
}

interface Purchase {
    id: string;
    status: string;
    createdAt: string;
    course: {
        id: string;
        title: string;
        price: number;
    };
}

export function AdminProgressPanel({ embedded = false }: { embedded?: boolean }) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
    const [userPurchases, setUserPurchases] = useState<Purchase[]>([]);
    const [allChapters, setAllChapters] = useState<Chapter[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(false);

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

    const fetchUserProgress = async (userId: string) => {
        setLoadingProgress(true);
        try {
            const response = await fetch(`/api/admin-assistant/users/${userId}/progress`);
            if (response.ok) {
                const data = await response.json();
                setUserProgress(data.userProgress);
                setUserPurchases(data.purchases);
                setAllChapters(data.allChapters || []);
            }
        } catch (error) {
            console.error("Error fetching user progress:", error);
        } finally {
            setLoadingProgress(false);
        }
    };

    const handleViewProgress = (user: User) => {
        setSelectedUser(user);
        fetchUserProgress(user.id);
        setIsDialogOpen(true);
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber.includes(searchTerm)
    );

    const studentUsers = filteredUsers.filter(user => user.role === "STUDENT");

    const completedProgress = userProgress.filter(p => p.isCompleted).length;
    const inProgressChapters = userProgress.filter(p => !p.isCompleted).length;
    const totalAvailableChapters = allChapters.length;
    const notStartedChapters = totalAvailableChapters - completedProgress - inProgressChapters;
    const progressPercentage = totalAvailableChapters > 0 ? (completedProgress / totalAvailableChapters) * 100 : 0;

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center text-muted-foreground">Loading…</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 text-left">
            <div className="flex items-center justify-between">
                <h1 className="text-left text-3xl font-bold text-gray-900 dark:text-white">
                    Student progress
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Students</CardTitle>
                    <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or phone…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                                                 <TableHeader>
                             <TableRow>
                                 <TableHead className="text-left">Name</TableHead>
                                 <TableHead className="text-left">Phone</TableHead>
                                 <TableHead className="text-left">Purchased courses</TableHead>
                                 <TableHead className="text-left">Progress</TableHead>
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
                                    <TableCell label="Purchased courses">
                                        <Badge variant="outline">
                                            {user._count.purchases} course{user._count.purchases !== 1 ? "s" : ""}
                                        </Badge>
                                    </TableCell>
                                    <TableCell label="Progress">
                                        <Badge variant="secondary">
                                            {user._count.userProgress} lesson{user._count.userProgress !== 1 ? "s" : ""}
                                        </Badge>
                                    </TableCell>
                                    <TableCell label="Actions">
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => handleViewProgress(user)}
                                        >
                                            <Eye className="h-4 w-4" />
                                            View progress
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Progress — {selectedUser?.fullName}
                        </DialogTitle>
                    </DialogHeader>
                    
                    {loadingProgress ? (
                        <div className="text-center py-8 text-muted-foreground">Loading…</div>
                    ) : (
                        <div className="space-y-6">
                            {/* Progress Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Progress summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span>Completion rate</span>
                                            <span className="font-bold">{progressPercentage.toFixed(1)}%</span>
                                        </div>
                                        <Progress value={progressPercentage} className="w-full" />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                                            <div>
                                                <div className="text-2xl font-bold text-green-600">{completedProgress}</div>
                                                <div className="text-sm text-muted-foreground">Completed</div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-gray-600">{notStartedChapters}</div>
                                                <div className="text-sm text-muted-foreground">Not started</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Purchased Courses */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Purchased courses</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                                                                 <TableHeader>
                                             <TableRow>
                                                 <TableHead className="text-left">Course</TableHead>
                                                 <TableHead className="text-left">Price</TableHead>
                                                 <TableHead className="text-left">Status</TableHead>
                                                 <TableHead className="text-left">Purchase date</TableHead>
                                             </TableRow>
                                         </TableHeader>
                                        <TableBody>
                                            {userPurchases.map((purchase) => (
                                                <TableRow key={purchase.id}>
                                                    <TableCell label="Course" className="font-medium">
                                                        {purchase.course.title}
                                                    </TableCell>
                                                    <TableCell label="Price">
                                                        {purchase.course.price} EGP
                                                    </TableCell>
                                                    <TableCell label="Status">
                                                        <Badge variant={purchase.status === "ACTIVE" ? "default" : "secondary"}>
                                                            {purchase.status === "ACTIVE" ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell label="Purchase date">
                                                        {format(new Date(purchase.createdAt), "MM/dd/yyyy", { locale: enUS })}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Progress Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Lesson progress</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                                                                 <TableHeader>
                                             <TableRow>
                                                 <TableHead className="text-left">Course</TableHead>
                                                 <TableHead className="text-left">Lesson</TableHead>
                                                 <TableHead className="text-left">Status</TableHead>
                                                 <TableHead className="text-left">Last updated</TableHead>
                                             </TableRow>
                                         </TableHeader>
                                        <TableBody>
                                            {allChapters.map((chapter) => {
                                                const progress = userProgress.find(p => p.chapter.id === chapter.id);
                                                return (
                                                    <TableRow key={chapter.id}>
                                                        <TableCell label="Course" className="font-medium">
                                                            {chapter.course.title}
                                                        </TableCell>
                                                        <TableCell label="Lesson">
                                                            {chapter.title}
                                                        </TableCell>
                                                        <TableCell label="Status">
                                                            {progress ? (
                                                                progress.isCompleted ? (
                                                                    <Badge variant="default" className="flex items-center gap-1">
                                                                        <CheckCircle className="h-3 w-3" />
                                                                        Completed
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="secondary" className="flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        In progress
                                                                    </Badge>
                                                                )
                                                            ) : (
                                                                <Badge variant="outline" className="flex items-center gap-1">
                                                                    <BookOpen className="h-3 w-3" />
                                                                    Not started
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell label="Last updated">
                                                            {progress ? (
                                                                format(new Date(progress.updatedAt), "MM/dd/yyyy", { locale: enUS })
                                                            ) : (
                                                                "-"
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}