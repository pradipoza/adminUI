import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Phone, User, Edit, Trash2 } from "lucide-react";

interface Student {
  whatsappId: string;
  name: string | null;
}

export default function Students() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ whatsappId: "", name: "" });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: students, isLoading: studentsLoading, refetch } = useQuery({
    queryKey: ["/api/students"],
    enabled: isAuthenticated,
    retry: false,
  });

  const handleAddStudent = async () => {
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStudent),
      });

      if (!response.ok) {
        throw new Error('Failed to add student');
      }

      toast({
        title: "Success",
        description: "Student added successfully",
      });

      setNewStudent({ whatsappId: "", name: "" });
      setIsAddDialogOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add student",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStudent = async (whatsappId: string) => {
    if (!confirm("Are you sure you want to delete this student?")) {
      return;
    }

    try {
      const response = await fetch(`/api/students/${whatsappId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete student');
      }

      toast({
        title: "Success",
        description: "Student deleted successfully",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64 min-h-screen">
        <Header 
          title="Students" 
          subtitle="Manage student WhatsApp contacts"
        />
        
        <main className="p-6">
          <div className="grid grid-cols-1 gap-6">
            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-900">Student Directory</CardTitle>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-student">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="whatsappId">WhatsApp Number</Label>
                          <Input
                            id="whatsappId"
                            placeholder="e.g., 9779767952043"
                            value={newStudent.whatsappId}
                            onChange={(e) => setNewStudent({ ...newStudent, whatsappId: e.target.value })}
                            data-testid="input-whatsapp-id"
                          />
                        </div>
                        <div>
                          <Label htmlFor="name">Student Name</Label>
                          <Input
                            id="name"
                            placeholder="Enter student name"
                            value={newStudent.name}
                            onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                            data-testid="input-student-name"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(false)}
                            data-testid="button-cancel-add"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleAddStudent}
                            disabled={!newStudent.whatsappId}
                            data-testid="button-save-student"
                          >
                            Add Student
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {studentsLoading ? (
                  <div className="text-center py-8 text-slate-500">Loading students...</div>
                ) : Array.isArray(students) && students.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>WhatsApp Number</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student: Student) => (
                        <TableRow key={student.whatsappId} data-testid={`row-student-${student.whatsappId}`}>
                          <TableCell>
                            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-slate-600" />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium" data-testid={`text-name-${student.whatsappId}`}>
                            {student.name || "No name provided"}
                          </TableCell>
                          <TableCell data-testid={`text-whatsapp-${student.whatsappId}`}>
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-slate-500" />
                              <span>{student.whatsappId}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteStudent(student.whatsappId)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                data-testid={`button-delete-${student.whatsappId}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <User className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Students Found</h3>
                    <p className="text-slate-500 mb-4">Start by adding your first student to the directory</p>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-add-first-student">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Your First Student
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}