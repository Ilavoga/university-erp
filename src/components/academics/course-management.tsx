"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Student {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Grade {
  assignmentId: string;
  scoreObtained: number;
}

interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: "ACTIVE" | "COMPLETED" | "DROPPED";
  student: Student;
  grades: Grade[];
}

interface Assignment {
  id: string;
  title: string;
  totalMarks: number;
  dueDate: Date | null;
}

interface Course {
  id: string;
  title: string;
  code: string;
  description: string | null;
  credits: number;
  capacity: number;
}

interface CourseManagementProps {
  course: Course;
  enrollments: Enrollment[];
  assignments: Assignment[];
}

export function CourseManagement({ course, enrollments, assignments: initialAssignments }: CourseManagementProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [assignments, setAssignments] = useState(initialAssignments);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, "PRESENT" | "ABSENT" | "EXCUSED">>({});
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  
  // Assignment Creation State
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [newAssignmentTitle, setNewAssignmentTitle] = useState("");
  const [newAssignmentMarks, setNewAssignmentMarks] = useState(100);
  const [newAssignmentDate, setNewAssignmentDate] = useState("");

  // Grading State
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [grades, setGrades] = useState<Record<string, number>>({});

  useEffect(() => {
    if (selectedAssignmentId) {
      const newGrades: Record<string, number> = {};
      enrollments.forEach(enrollment => {
        const grade = enrollment.grades.find(g => g.assignmentId === selectedAssignmentId);
        if (grade) {
          newGrades[enrollment.id] = grade.scoreObtained;
        }
      });
      setGrades(newGrades);
    }
  }, [selectedAssignmentId, enrollments]);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await fetch(`/api/faculty/courses/${course.id}/attendance?date=${attendanceDate}`);
        if (response.ok) {
          const data = await response.json();
          const statusMap: Record<string, "PRESENT" | "ABSENT" | "EXCUSED"> = {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.forEach((record: any) => {
            statusMap[record.enrollmentId] = record.status;
          });
          setAttendanceStatus(statusMap);
        }
      } catch (error) {
        console.error("Failed to fetch attendance", error);
      }
    };

    if (attendanceDate) {
      fetchAttendance();
    }
  }, [attendanceDate, course.id]);

  const handleCreateAssignment = async () => {
    if (!newAssignmentTitle.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(`/api/faculty/courses/${course.id}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newAssignmentTitle,
          totalMarks: newAssignmentMarks,
          dueDate: newAssignmentDate ? new Date(newAssignmentDate).toISOString() : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to create assignment");

      const newAssignment = await response.json();
      setAssignments([...assignments, newAssignment]);
      setIsCreateAssignmentOpen(false);
      setNewAssignmentTitle("");
      setNewAssignmentMarks(100);
      setNewAssignmentDate("");
      toast({ title: "Success", description: "Assignment created successfully" });
      router.refresh();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create assignment", variant: "destructive" });
    }
  };

  const handleSubmitAttendance = async () => {
    setIsSubmittingAttendance(true);
    try {
      const promises = Object.entries(attendanceStatus).map(([enrollmentId, status]) => 
        fetch("/api/faculty/grades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "attendance",
            enrollmentId,
            date: new Date(attendanceDate).toISOString(),
            status,
          }),
        })
      );

      await Promise.all(promises);
      toast({ title: "Success", description: "Attendance recorded successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to record attendance", variant: "destructive" });
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  const handleSubmitGrades = async () => {
    if (!selectedAssignmentId) return;
    try {
      const promises = Object.entries(grades).map(([enrollmentId, score]) => 
        fetch("/api/faculty/grades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "grade",
            enrollmentId,
            assignmentId: selectedAssignmentId,
            scoreObtained: score,
          }),
        })
      );

      await Promise.all(promises);
      toast({ title: "Success", description: "Grades recorded successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to record grades", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{course.code}: {course.title}</h1>
        <p className="text-muted-foreground">Manage course details, students, and assessments.</p>
      </div>

      <Tabs defaultValue="enrollments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="assignments">Assessments & Grades</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
              <CardDescription>Total Students: {enrollments.length}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">{enrollment.student.name}</TableCell>
                      <TableCell>{enrollment.student.email}</TableCell>
                      <TableCell>
                        <Badge variant={enrollment.status === "ACTIVE" ? "default" : "secondary"}>
                          {enrollment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Attendance Tracking</CardTitle>
                  <CardDescription>Mark attendance for {attendanceDate}</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Input 
                    type="date" 
                    value={attendanceDate} 
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-auto"
                  />
                  <Button onClick={handleSubmitAttendance} disabled={isSubmittingAttendance}>
                    {isSubmittingAttendance ? "Saving..." : "Save Attendance"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">{enrollment.student.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={attendanceStatus[enrollment.id] === "PRESENT" ? "default" : "outline"}
                            onClick={() => setAttendanceStatus(prev => ({ ...prev, [enrollment.id]: "PRESENT" }))}
                          >
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant={attendanceStatus[enrollment.id] === "ABSENT" ? "destructive" : "outline"}
                            onClick={() => setAttendanceStatus(prev => ({ ...prev, [enrollment.id]: "ABSENT" }))}
                          >
                            Absent
                          </Button>
                          <Button
                            size="sm"
                            variant={attendanceStatus[enrollment.id] === "EXCUSED" ? "secondary" : "outline"}
                            onClick={() => setAttendanceStatus(prev => ({ ...prev, [enrollment.id]: "EXCUSED" }))}
                          >
                            Excused
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Assessments</CardTitle>
                  <Dialog open={isCreateAssignmentOpen} onOpenChange={setIsCreateAssignmentOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="h-4 w-4 mr-2" /> New</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Assessment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input value={newAssignmentTitle} onChange={(e) => setNewAssignmentTitle(e.target.value)} placeholder="Midterm Exam" />
                        </div>
                        <div className="space-y-2">
                          <Label>Total Marks</Label>
                          <Input type="number" value={newAssignmentMarks} onChange={(e) => setNewAssignmentMarks(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Due Date</Label>
                          <Input type="date" value={newAssignmentDate} onChange={(e) => setNewAssignmentDate(e.target.value)} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreateAssignment} disabled={!newAssignmentTitle.trim()}>Create</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>{assignment.title}</TableCell>
                        <TableCell>{assignment.totalMarks}</TableCell>
                        <TableCell>
                          <Button 
                            variant={selectedAssignmentId === assignment.id ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setSelectedAssignmentId(assignment.id)}
                          >
                            Grade
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Grading</CardTitle>
                  {selectedAssignmentId && (
                    <Button size="sm" onClick={handleSubmitGrades}>
                      <Save className="h-4 w-4 mr-2" /> Save Grades
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {selectedAssignmentId 
                    ? `Grading: ${assignments.find(a => a.id === selectedAssignmentId)?.title}`
                    : "Select an assignment to start grading"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedAssignmentId ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.map((enrollment) => (
                        <TableRow key={enrollment.id}>
                          <TableCell>{enrollment.student.name}</TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              className="w-24"
                              placeholder="0"
                              value={grades[enrollment.id] || ""}
                              onChange={(e) => setGrades(prev => ({ ...prev, [enrollment.id]: Number(e.target.value) }))}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Select an assignment from the list to enter grades.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
