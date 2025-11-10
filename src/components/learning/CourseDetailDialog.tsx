'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Users, Clock, X, CheckCircle, Circle } from 'lucide-react';

interface CourseDetailDialogProps {
  courseId: string | null;
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnrollmentChange: () => void;
}

interface CourseDetail {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  semester: string;
  facultyName?: string;
  enrolledStudents: string[];
  students: Array<{ id: number; name: string; email: string; student_id: string }>;
}

interface CourseModule {
  id: number;
  title: string;
  description: string;
  sequence: number;
  completed: boolean;
}

export function CourseDetailDialog({
  courseId,
  studentId,
  open,
  onOpenChange,
  onEnrollmentChange,
}: CourseDetailDialogProps) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const fetchCourseDetails = useCallback(async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      
      // Fetch course details
      const courseResponse = await fetch(`/api/courses/${courseId}`);
      if (!courseResponse.ok) {
        throw new Error('Failed to fetch course details');
      }
      const courseData = await courseResponse.json();
      setCourse(courseData);
      
      // Check if student is already enrolled
      const enrolled = courseData.enrolledStudents.includes(studentId);
      setIsEnrolled(enrolled);

      // Fetch modules if student is enrolled
      if (enrolled) {
        const progressResponse = await fetch(
          `/api/courses/${courseId}/progress?studentId=${studentId}`
        );
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          setModules(progressData.modules || []);
        }
      } else {
        // Fetch modules without completion status
        const modulesResponse = await fetch(`/api/courses/${courseId}/modules`);
        if (modulesResponse.ok) {
          const modulesData = await modulesResponse.json();
          setModules(modulesData.map((m: CourseModule) => ({ ...m, completed: false })));
        }
      }
    } catch (error) {
      console.error('Failed to fetch course details:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId, studentId]);

  useEffect(() => {
    if (open && courseId) {
      fetchCourseDetails();
    }
  }, [open, courseId, fetchCourseDetails]);

  const handleEnroll = async () => {
    if (!courseId) return;

    try {
      setEnrolling(true);
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to enroll in course');
      }

      setIsEnrolled(true);
      onEnrollmentChange();
      fetchCourseDetails(); // Refresh to get modules with completion status
      
      alert('Successfully enrolled in course!');
    } catch (error) {
      console.error('Failed to enroll:', error);
      alert(error instanceof Error ? error.message : 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const handleDrop = async () => {
    if (!courseId) return;

    const confirmed = window.confirm('Are you sure you want to drop this course?');
    if (!confirmed) return;

    try {
      setEnrolling(true);
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to drop course');
      }

      setIsEnrolled(false);
      setModules([]);
      onEnrollmentChange();
      
      alert('Successfully dropped course');
    } catch (error) {
      console.error('Failed to drop course:', error);
      alert(error instanceof Error ? error.message : 'Failed to drop course');
    } finally {
      setEnrolling(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900" />
          </div>
        ) : course ? (
          <>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-slate-900">{course.code}</Badge>
                    {isEnrolled && (
                      <Badge className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Enrolled
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{course.name}</h2>
                  {course.facultyName && (
                    <p className="text-slate-600 mt-1">Instructor: {course.facultyName}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Course Info Grid */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-sm">Credits</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{course.credits}</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Enrolled</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{course.enrolledStudents.length}</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Semester</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{course.semester}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Course Description</h3>
                <p className="text-slate-600 leading-relaxed">
                  {course.description || 'No description available.'}
                </p>
              </div>

              {/* Course Modules */}
              {modules.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">
                    Course Modules ({modules.length})
                  </h3>
                  <div className="space-y-2">
                    {modules.map((module) => (
                      <Card key={module.id} className="border-slate-200">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {isEnrolled ? (
                              module.completed ? (
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                              )
                            ) : (
                              <BookOpen className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-slate-900">{module.title}</h4>
                                {isEnrolled && module.completed && (
                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                    Completed
                                  </Badge>
                                )}
                              </div>
                              {module.description && (
                                <p className="text-sm text-slate-600 mt-1">{module.description}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Enrolled Students */}
              {course.students && course.students.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">
                    Enrolled Students ({course.students.length})
                  </h3>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
                    <div className="divide-y divide-slate-200">
                      {course.students.slice(0, 10).map((student) => (
                        <div key={student.id} className="p-3 hover:bg-slate-50 transition-colors">
                          <p className="font-medium text-slate-900">{student.name}</p>
                          <p className="text-sm text-slate-600">{student.student_id}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {course.students.length > 10 && (
                    <p className="text-sm text-slate-600 mt-2">
                      and {course.students.length - 10} more...
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                  disabled={enrolling}
                >
                  Close
                </Button>
                {isEnrolled ? (
                  <Button
                    variant="outline"
                    onClick={handleDrop}
                    disabled={enrolling}
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                  >
                    {enrolling ? 'Dropping...' : 'Drop Course'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="flex-1"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll in Course'}
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <p className="text-slate-600">Course not found</p>
          </div>
        )}
      </div>
    </div>
  );
}