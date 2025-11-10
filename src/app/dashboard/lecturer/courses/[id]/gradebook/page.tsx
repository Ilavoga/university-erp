'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BookOpen, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface Assignment {
  id: number;
  title: string;
  assignment_type: string;
  total_points: number;
  score: number | null;
  submission_percentage: number | null;
  status: string | null;
}

interface StudentGrade {
  student_id: number;
  student_number: string;
  student_name: string;
  email: string;
  overall_progress: number;
  components: {
    module_progress: number;
    assignment_progress: number;
    attendance_progress: number;
    quiz_progress: number;
  };
  average_grade: number;
  quiz_average: number;
  attendance_percentage: number;
  assignments: Assignment[];
}

interface ClassSummary {
  total_students: number;
  average_overall_progress: number;
  average_module_progress: number;
  average_assignment_progress: number;
  average_attendance: number;
  average_quiz_score: number;
  students_at_risk: number;
}

export default function GradebookPage({ params }: { params: { id: string } }) {
  const [gradebook, setGradebook] = useState<StudentGrade[]>([]);
  const [summary, setSummary] = useState<ClassSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentGrade | null>(null);

  const courseId = params.id;

  useEffect(() => {
    fetchGradebook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchGradebook = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/gradebook`);
      const data = await response.json();
      setGradebook(data.gradebook || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Failed to fetch gradebook:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBadge = (progress: number) => {
    if (progress >= 80) return <Badge className="bg-green-500">Excellent</Badge>;
    if (progress >= 60) return <Badge className="bg-yellow-500">Good</Badge>;
    if (progress >= 40) return <Badge className="bg-orange-500">Fair</Badge>;
    return <Badge className="bg-red-500">At Risk</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading gradebook...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (selectedStudent) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{selectedStudent.student_name}</h1>
              <p className="text-gray-600">{selectedStudent.student_number} • {selectedStudent.email}</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedStudent(null)}>
              Back to Gradebook
            </Button>
          </div>

          {/* Progress Components */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 mb-1">Module Progress</p>
                <p className={`text-2xl font-bold ${getProgressColor(selectedStudent.components.module_progress)}`}>
                  {selectedStudent.components.module_progress}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 mb-1">Assignment Progress</p>
                <p className={`text-2xl font-bold ${getProgressColor(selectedStudent.components.assignment_progress)}`}>
                  {selectedStudent.components.assignment_progress}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 mb-1">Attendance</p>
                <p className={`text-2xl font-bold ${getProgressColor(selectedStudent.attendance_percentage)}`}>
                  {selectedStudent.attendance_percentage}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 mb-1">Quiz Average</p>
                <p className={`text-2xl font-bold ${getProgressColor(selectedStudent.quiz_average)}`}>
                  {selectedStudent.quiz_average}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedStudent.assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>{assignment.title}</TableCell>
                      <TableCell className="capitalize">{assignment.assignment_type}</TableCell>
                      <TableCell>
                        {assignment.score !== null ? `${assignment.score}/${assignment.total_points}` : '-'}
                      </TableCell>
                      <TableCell>
                        {assignment.submission_percentage !== null ? (
                          <span className={getProgressColor(assignment.submission_percentage)}>
                            {assignment.submission_percentage}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={assignment.status === 'graded' ? 'default' : 'secondary'}>
                          {assignment.status || 'not submitted'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Course Gradebook</h1>
          <p className="text-gray-600">Student grades and progress overview</p>
        </div>

        {/* Class Summary */}
        {summary && (
          <div className="grid grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <BookOpen className="h-5 w-5 text-blue-600 mb-2" />
                <p className="text-2xl font-bold">{summary.total_students}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <TrendingUp className="h-5 w-5 text-green-600 mb-2" />
                <p className={`text-2xl font-bold ${getProgressColor(summary.average_overall_progress)}`}>
                  {summary.average_overall_progress}%
                </p>
                <p className="text-sm text-gray-600">Avg Progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <TrendingUp className="h-5 w-5 text-purple-600 mb-2" />
                <p className={`text-2xl font-bold ${getProgressColor(summary.average_module_progress)}`}>
                  {summary.average_module_progress}%
                </p>
                <p className="text-sm text-gray-600">Avg Modules</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <TrendingUp className="h-5 w-5 text-yellow-600 mb-2" />
                <p className={`text-2xl font-bold ${getProgressColor(summary.average_assignment_progress)}`}>
                  {summary.average_assignment_progress}%
                </p>
                <p className="text-sm text-gray-600">Avg Assignments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <TrendingUp className="h-5 w-5 text-blue-600 mb-2" />
                <p className={`text-2xl font-bold ${getProgressColor(summary.average_attendance)}`}>
                  {summary.average_attendance}%
                </p>
                <p className="text-sm text-gray-600">Avg Attendance</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <AlertTriangle className="h-5 w-5 text-red-600 mb-2" />
                <p className="text-2xl font-bold text-red-600">{summary.students_at_risk}</p>
                <p className="text-sm text-gray-600">At Risk</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Student List */}
        <Card>
          <CardHeader>
            <CardTitle>Student Grades</CardTitle>
            <CardDescription>Click on a student to view detailed grades</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Overall Progress</TableHead>
                  <TableHead>Avg Grade</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradebook.map((student) => (
                  <TableRow key={student.student_id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{student.student_name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{student.student_number}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${getProgressColor(student.overall_progress)}`}>
                        {student.overall_progress}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={getProgressColor(student.average_grade)}>{student.average_grade}%</span>
                    </TableCell>
                    <TableCell>
                      <span className={getProgressColor(student.attendance_percentage)}>
                        {student.attendance_percentage}%
                      </span>
                    </TableCell>
                    <TableCell>{getProgressBadge(student.overall_progress)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setSelectedStudent(student)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
