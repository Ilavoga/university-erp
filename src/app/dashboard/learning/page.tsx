'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CourseDetailDialog } from '@/components/learning/CourseDetailDialog';
import {
  BookOpen,
  Sparkles,
  Trophy,
  Clock,
  FileText,
  Video,
  Users,
  CheckCircle,
  Circle
} from 'lucide-react';

interface StudentCourse {
  id: number;
  code: string;
  name: string;
  description: string;
  credits: number;
  semester: string;
  progress: number;
  nextClass: string;
  assignmentsDue: number;
}

interface Assignment {
  id: number;
  course_id: number;
  course_name: string;
  title: string;
  description: string;
  due_date: string;
  total_points: number;
  submission_status?: 'submitted' | 'graded' | 'late' | 'pending';
  score?: number;
}

interface LearningResource {
  id: number;
  course_id: number;
  course_name: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'link' | 'quiz';
  url: string;
  progress: number;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  type: string;
  earned_at: string;
}

interface Recommendation {
  type: 'course' | 'resource' | 'tutor';
  title: string;
  description: string;
  relevance: number;
  course_id?: number;
}

export default function LearningPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courseDetailOpen, setCourseDetailOpen] = useState(false);
  const searchParams = useSearchParams();

  const fetchLearningData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const [coursesRes, assignmentsRes, resourcesRes, achievementsRes, recommendationsRes] = 
        await Promise.all([
          fetch(`/api/learning/courses?studentId=${user.id}`),
          fetch(`/api/learning/assignments?studentId=${user.id}&limit=5`),
          fetch(`/api/learning/resources?studentId=${user.id}&limit=5`),
          fetch(`/api/learning/achievements?studentId=${user.id}&limit=5`),
          fetch(`/api/learning/recommendations?studentId=${user.id}`)
        ]);

      if (!coursesRes.ok || !assignmentsRes.ok || !resourcesRes.ok || 
          !achievementsRes.ok || !recommendationsRes.ok) {
        throw new Error('Failed to fetch learning data');
      }

      const [coursesData, assignmentsData, resourcesData, achievementsData, recommendationsData] = 
        await Promise.all([
          coursesRes.json(),
          assignmentsRes.json(),
          resourcesRes.json(),
          achievementsRes.json(),
          recommendationsRes.json()
        ]);

      setCourses(coursesData);
      setAssignments(assignmentsData);
      setResources(resourcesData);
      setAchievements(achievementsData);
      setRecommendations(recommendationsData);
    } catch (error) {
      console.error('Failed to fetch learning data:', error);
      setError('Failed to load learning data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'student') {
      setLoading(false);
      return;
    }

    fetchLearningData();
  }, [user, fetchLearningData]);

  useEffect(() => {
    // Open course detail dialog if a courseId is present in the query string
    try {
      const cid = searchParams?.get('courseId');
      if (cid) {
        const num = Number(cid);
        if (!Number.isNaN(num)) {
          setSelectedCourseId(num);
          setCourseDetailOpen(true);
        }
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()]);

  const handleExploreRecommendation = (rec: Recommendation) => {
    if (rec.course_id) {
      setSelectedCourseId(rec.course_id);
      setCourseDetailOpen(true);
    }
  };

  const handleSubmitAssignment = async (assignmentId: number) => {
    if (!user) return;

    try {
      const response = await fetch('/api/learning/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user.id, assignmentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit assignment');
      }

      const assignmentsRes = await fetch(`/api/learning/assignments?studentId=${user.id}&limit=5`);
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData);
      }
    } catch (error) {
      console.error('Failed to submit assignment:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit assignment');
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'course': return BookOpen;
      case 'resource': return Trophy;
      case 'tutor': return Users;
      default: return BookOpen;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'course': return 'from-blue-500 to-blue-600';
      case 'resource': return 'from-emerald-500 to-emerald-600';
      case 'tutor': return 'from-purple-500 to-purple-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'document': return FileText;
      default: return BookOpen;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
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
            <Button className="mt-4" onClick={fetchLearningData}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!user || user.role !== 'student') {
    return (
      <DashboardLayout>
        <Card className="border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">Learning features are only available to students.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <CardTitle>AI-Powered Recommendations</CardTitle>
              </div>
              <CardDescription>Personalized suggestions to enhance your learning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.map((rec, index) => {
                  const Icon = getRecommendationIcon(rec.type);
                  return (
                    <Card key={index} className="border-slate-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${getRecommendationColor(rec.type)} w-fit mb-4`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="border-slate-300">
                            {rec.relevance}% Match
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-slate-900 mb-2">{rec.title}</h4>
                        <p className="text-sm text-slate-600 mb-4">{rec.description}</p>
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleExploreRecommendation(rec)}
                          disabled={rec.type !== 'course'}
                        >
                          Explore
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Courses */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Active Courses</CardTitle>
            <CardDescription>Your current semester courses</CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length > 0 ? (
              <div className="space-y-4">
                {courses.map((course) => (
                  <div 
                    key={course.id} 
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-300 transition-all cursor-pointer"
                    onClick={() => router.push(`/dashboard/courses/${course.id}/progress`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900">{course.code} - {course.name}</h4>
                        <p className="text-sm text-slate-600 mt-1">{course.description}</p>
                      </div>
                      <Badge variant="outline">{course.credits} Credits</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-medium">{Math.round(course.progress)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all" 
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-4 h-4" />
                          Next class: {course.nextClass}
                        </div>
                        {course.assignmentsDue > 0 && (
                          <Badge variant="outline" className="border-orange-300 text-orange-700">
                            {course.assignmentsDue} assignments due
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">No enrolled courses</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assignments */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Upcoming Assignments</CardTitle>
              <CardDescription>Stay on top of your deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length > 0 ? (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900">{assignment.title}</h4>
                            {assignment.submission_status === 'graded' && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                            {assignment.submission_status === 'submitted' && (
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                            )}
                            {assignment.submission_status === 'pending' && (
                              <Circle className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{assignment.course_name}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {assignment.total_points} pts
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-slate-600">
                          {formatDate(assignment.due_date)}
                        </span>
                        {assignment.submission_status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleSubmitAssignment(assignment.id)}
                          >
                            Submit
                          </Button>
                        )}
                        {assignment.submission_status === 'graded' && assignment.score && (
                          <Badge className="bg-green-100 text-green-800">
                            Score: {assignment.score}/{assignment.total_points}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">No assignments</p>
              )}
            </CardContent>
          </Card>

          {/* Learning Resources */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Learning Resources</CardTitle>
              <CardDescription>Continue your studies</CardDescription>
            </CardHeader>
            <CardContent>
              {resources.length > 0 ? (
                <div className="space-y-3">
                  {resources.map((resource) => {
                    const Icon = getResourceIcon(resource.type);
                    return (
                      <div 
                        key={resource.id} 
                        className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => window.open(resource.url, '_blank')}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Icon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 mb-1">{resource.title}</h4>
                            <p className="text-sm text-slate-600 mb-2">{resource.course_name}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full" 
                                  style={{ width: `${resource.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-600">{resource.progress}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">No resources available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
              <CardDescription>Your learning milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="p-4 border border-slate-200 rounded-lg text-center">
                    <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <h4 className="font-semibold text-slate-900 mb-1">{achievement.title}</h4>
                    <p className="text-sm text-slate-600">{achievement.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Course Detail Dialog */}
      {user && (
        <CourseDetailDialog
          courseId={selectedCourseId !== null ? String(selectedCourseId) : null}
          studentId={user.id}
          open={courseDetailOpen}
          onOpenChange={setCourseDetailOpen}
          onEnrollmentChange={fetchLearningData}
        />
      )}
    </DashboardLayout>
  );
}
