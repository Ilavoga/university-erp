'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Plus, Clock, Edit, Trash2 } from 'lucide-react';
import { CourseFormDialog } from '@/components/courses/CourseFormDialog';
import { monthsToMonthRange } from '@/lib/semester-utils';
import type { Course } from '@/lib/types';

interface CourseStats {
  total_courses: number;
  total_enrollments: number;
  avg_class_size: number;
}

// Helper function to format semester display
function formatSemesterDisplay(course: Course): string {
  if (course.semesterYear && course.semesterStartMonth && course.semesterEndMonth) {
    const monthRange = monthsToMonthRange(course.semesterStartMonth, course.semesterEndMonth);
    return monthRange ? `${course.semesterYear} ${monthRange}` : course.semester;
  }
  return course.semester;
}

export default function CoursesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<CourseStats>({ total_courses: 0, total_enrollments: 0, avg_class_size: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [coursesRes, statsRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/courses/stats')
      ]);

      if (!coursesRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [coursesData, statsData] = await Promise.all([
        coursesRes.json(),
        statsRes.json()
      ]);

      setCourses(coursesData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      setError('Failed to load courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (course: Course) => {
    // Fetch full course details including modules
    try {
      const response = await fetch(`/api/courses/${course.id}`);
      if (response.ok) {
        const fullCourse = await response.json();
        setEditingCourse(fullCourse);
      }
    } catch (error) {
      console.error('Failed to fetch course details:', error);
      alert('Failed to load course details');
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This will also delete all modules, assignments, and enrollments.')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      fetchData();
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert('Failed to delete course');
    }
  };

  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
    setEditingCourse(null);
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

  if (error) {
    return (
      <DashboardLayout>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-red-600 text-center">{error}</p>
            <Button className="mt-4" onClick={fetchData}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Course Management</h2>
                <p className="text-slate-600 mt-1">Manage courses, assignments, and enrollments</p>
              </div>
              {(user?.role === 'admin' || user?.role === 'faculty') && (
                <Button 
                  className="bg-slate-900 hover:bg-slate-800"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Course
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Courses</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.total_courses}</h3>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Enrollments</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.total_enrollments}</h3>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg. Class Size</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">
                    {Math.round(stats.avg_class_size || 0)}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-center text-slate-500 mb-4">No courses available</p>
              {(user?.role === 'admin' || user?.role === 'faculty') && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Course
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className="mb-2 bg-slate-900">{course.code}</Badge>
                      <CardTitle className="text-xl">{course.name}</CardTitle>
                      <CardDescription className="mt-2">{course.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="w-4 h-4" />
                        <span>{course.enrolledStudents.length} Students</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <BookOpen className="w-4 h-4" />
                        <span>{course.credits} Credits</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>{formatSemesterDisplay(course)}</span>
                    </div>

                    <div className="pt-4 border-t border-slate-200 flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-slate-300"
                        onClick={() => {
                          // Navigate to course progress/details
                          router.push(`/dashboard/courses/${course.id}/progress`)
                        }}
                      >
                        View Details
                      </Button>
                      {(user?.role === 'admin' || user?.role === 'faculty') && (
                        <>
                          <Button
                            variant="outline"
                            className="border-slate-300"
                            onClick={() => handleEdit(course)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user?.role === 'admin' && (
                            <Button
                              variant="outline"
                              className="border-slate-300 text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(course.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {user && (
        <CourseFormDialog
          open={createDialogOpen || editingCourse !== null}
          onOpenChange={handleCloseDialog}
          onSuccess={() => {
            fetchData();
            handleCloseDialog();
          }}
          userId={user.id}
          courseId={editingCourse?.id}
          initialData={editingCourse ? {
            code: editingCourse.code,
            name: editingCourse.name,
            description: editingCourse.description,
            credits: parseInt(editingCourse.credits?.toString() || '3'),
            semester: editingCourse.semester,
            facultyId: editingCourse.facultyId
          } : undefined}
        />
      )}
    </DashboardLayout>
  );
}
