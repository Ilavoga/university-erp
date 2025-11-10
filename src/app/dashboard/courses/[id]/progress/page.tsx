'use client';
import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  Calendar,
  TrendingUp,
  Award,
  FileText,
  ArrowLeft,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CourseModule {
  id: number;
  course_id: number;
  title: string;
  sequence: number;
  description: string;
  completed: boolean;
  grade: number | null;
}

interface Assignment {
  id: number;
  course_id: number;
  title: string;
  description: string;
  due_date: string;
  total_points: number;
  submission_status: 'submitted' | 'graded' | 'late' | 'pending' | null;
  score: number | null;
}

interface AttendanceStats {
  total_lectures: number;
  attended: number;
  late: number;
  absent: number;
  excused: number;
  attendance_percentage: number;
}

interface CourseProgress {
  course_id: number;
  course_code: string;
  course_name: string;
  total_modules: number;
  completed_modules: number;
  module_completion_percentage: number;
  total_assignments: number;
  submitted_assignments: number;
  graded_assignments: number;
  assignment_completion_percentage: number;
  average_grade: number | null;
  predicted_final_grade: number | null;
  predicted_completion_date: string | null;
  modules: CourseModule[];
  assignments: Assignment[];
  attendance?: AttendanceStats;
}

export default function CourseProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch course progress
      const response = await fetch(
        `/api/courses/${courseId}/progress?studentId=${user.id}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch course progress');
      }

      const data = await response.json();
      
      // Fetch attendance stats
      const attendanceResponse = await fetch(
        `/api/students/${user.id}/attendance?courseId=${courseId}`
      );
      
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json();
        if (attendanceData.courses && attendanceData.courses.length > 0) {
          data.attendance = {
            total_lectures: attendanceData.courses[0].total_lectures,
            attended: attendanceData.courses[0].attended,
            late: attendanceData.courses[0].late,
            absent: attendanceData.courses[0].absent,
            excused: attendanceData.courses[0].excused,
            attendance_percentage: attendanceData.courses[0].attendance_percentage
          };
        }
      }
      
      setProgress(data);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
      setError('Failed to load course progress. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user, courseId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'graded':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Graded</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Submitted</Badge>;
      case 'late':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Late</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Pending</Badge>;
    }
  };

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-gray-600';
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !progress) {
    return (
      <DashboardLayout>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-red-600 text-center">{error || 'Course not found'}</p>
            <Button className="mt-4" onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">
              {progress.course_code}: {progress.course_name}
            </h1>
            <p className="text-slate-600 mt-1">Detailed Academic Progress</p>
          </div>
        </div>

        {/* Progress Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Module Completion</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {progress.completed_modules}/{progress.total_modules}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {Math.round(progress.module_completion_percentage)}% Complete
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Assignments</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {progress.submitted_assignments}/{progress.total_assignments}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {progress.graded_assignments} graded
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Current Grade</p>
                  <p className={`text-2xl font-bold mt-1 ${getGradeColor(progress.average_grade)}`}>
                    {progress.average_grade !== null ? `${Math.round(progress.average_grade)}%` : 'N/A'}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">Average</p>
                </div>
                <Award className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Predicted Grade</p>
                  <p className={`text-2xl font-bold mt-1 ${getGradeColor(progress.predicted_final_grade)}`}>
                    {progress.predicted_final_grade !== null ? `${Math.round(progress.predicted_final_grade)}%` : 'N/A'}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">Final estimate</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Predicted Completion Date */}
        {progress.predicted_completion_date && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-blue-900 font-semibold">Predicted Completion</p>
                <p className="text-blue-700 text-sm">
                  Expected completion by {formatDate(progress.predicted_completion_date)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Statistics */}
        {progress.attendance && (
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-6 w-6 text-slate-700" />
                <h2 className="text-xl font-bold text-slate-900">Attendance Record</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">Total Lectures</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        {progress.attendance.total_lectures}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-slate-400" />
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-700 text-sm">Present</p>
                      <p className="text-2xl font-bold text-green-900 mt-1">
                        {progress.attendance.attended}
                      </p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-700 text-sm">Late</p>
                      <p className="text-2xl font-bold text-yellow-900 mt-1">
                        {progress.attendance.late}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-700 text-sm">Absent</p>
                      <p className="text-2xl font-bold text-red-900 mt-1">
                        {progress.attendance.absent}
                      </p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-700 text-sm">Excused</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">
                        {progress.attendance.excused}
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Attendance Percentage Bar */}
              <div className="bg-slate-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-700 font-semibold">Attendance Rate</p>
                  <p className={`text-2xl font-bold ${
                    progress.attendance.attendance_percentage >= 80 ? 'text-green-600' :
                    progress.attendance.attendance_percentage >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {Math.round(progress.attendance.attendance_percentage)}%
                  </p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      progress.attendance.attendance_percentage >= 80 ? 'bg-green-500' :
                      progress.attendance.attendance_percentage >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${progress.attendance.attendance_percentage}%` }}
                  />
                </div>
                {progress.attendance.attendance_percentage < 75 && (
                  <p className="text-orange-600 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Warning: Attendance below 75% may affect your grade
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Modules */}
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="h-6 w-6 text-slate-700" />
              <h2 className="text-xl font-bold text-slate-900">Course Modules</h2>
            </div>
            <div className="space-y-3">
              {progress.modules.map((module) => (
                <div
                  key={module.id}
                  className={`border rounded-lg p-4 ${
                    module.completed ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {module.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            Module {module.sequence}: {module.title}
                          </h3>
                          <p className="text-slate-600 text-sm mt-1">{module.description}</p>
                        </div>
                        {module.grade !== null && (
                          <Badge className={`${getGradeColor(module.grade)} bg-transparent border-0`}>
                            {Math.round(module.grade)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assignments */}
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="h-6 w-6 text-slate-700" />
              <h2 className="text-xl font-bold text-slate-900">Assignments</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-slate-700 font-semibold">Assignment</th>
                    <th className="text-left py-3 px-4 text-slate-700 font-semibold">Due Date</th>
                    <th className="text-left py-3 px-4 text-slate-700 font-semibold">Status</th>
                    <th className="text-right py-3 px-4 text-slate-700 font-semibold">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.assignments.map((assignment) => (
                    <tr key={assignment.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{assignment.title}</p>
                        <p className="text-slate-600 text-sm line-clamp-1">{assignment.description}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-sm">
                        {formatDate(assignment.due_date)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(assignment.submission_status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {assignment.score !== null ? (
                          <span className={`font-semibold ${getGradeColor((assignment.score / assignment.total_points) * 100)}`}>
                            {assignment.score}/{assignment.total_points}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
