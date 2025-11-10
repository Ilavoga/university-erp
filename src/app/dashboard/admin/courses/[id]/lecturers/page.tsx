'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Users, BookOpen, Award, Trash2 } from 'lucide-react';
import { LecturerAssignDialog } from '@/components/admin/LecturerAssignDialog';

interface Lecturer {
  id: number;
  lecturer_id: number;
  lecturer_name: string;
  lecturer_email: string;
  assigned_by_name: string;
  assigned_at: string;
}

interface LecturerWorkload {
  lecturer_id: number;
  lecturer_name: string;
  total_credits: number;
  course_count: number;
}

export default function CourseLecturersPage({ params }: { params: { id: string } }) {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [allLecturers, setAllLecturers] = useState<LecturerWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignForm, setShowAssignForm] = useState(false);

  const courseId = params.id;

  const fetchLecturers = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/lecturers`);
      const data = await response.json();
      setLecturers(data.lecturers || []);
    } catch (error) {
      console.error('Failed to fetch lecturers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllLecturers = async () => {
    try {
      const response = await fetch('/api/admin/assignments?view=workload');
      const data = await response.json();
      setAllLecturers(data.workloads || []);
    } catch (error) {
      console.error('Failed to fetch lecturer workloads:', error);
    }
  };

  useEffect(() => {
    fetchLecturers();
    fetchAllLecturers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getWorkloadColor = (credits: number) => {
    if (credits >= 12) return 'text-red-600';
    if (credits >= 9) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleRemove = async (lecturerId: number) => {
    if (!confirm('Are you sure you want to remove this lecturer from the course?')) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/lecturers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lecturer_id: lecturerId })
      });

      if (!response.ok) throw new Error('Failed to remove lecturer');

      fetchLecturers();
      fetchAllLecturers();
    } catch (error) {
      console.error('Failed to remove lecturer:', error);
      alert('Failed to remove lecturer');
    }
  };

  const handleAssignSuccess = () => {
    fetchLecturers();
    fetchAllLecturers();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading lecturers...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Course Lecturers</h1>
            <p className="text-gray-600">Manage lecturer assignments</p>
          </div>
          <Button onClick={() => setShowAssignForm(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Assign Lecturer
          </Button>
        </div>

        {/* Current Lecturers */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Lecturers</CardTitle>
            <CardDescription>
              {lecturers.length} lecturer{lecturers.length !== 1 ? 's' : ''} assigned to this course
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lecturers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No lecturers assigned yet.</p>
                <p className="text-sm mt-1">Click "Assign Lecturer" to add one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lecturers.map((lecturer) => (
                  <div
                    key={lecturer.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{lecturer.lecturer_name}</h3>
                        <p className="text-sm text-gray-600">{lecturer.lecturer_email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Assigned by {lecturer.assigned_by_name} on {formatDate(lecturer.assigned_at)}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleRemove(lecturer.lecturer_id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Faculty Workload Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Faculty Workload Overview</CardTitle>
            <CardDescription>Current teaching loads across all faculty</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allLecturers
                .sort((a, b) => b.total_credits - a.total_credits)
                .map((lecturer) => (
                  <div
                    key={lecturer.lecturer_id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Award className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{lecturer.lecturer_name}</h4>
                        <p className="text-sm text-gray-600">
                          {lecturer.course_count} course{lecturer.course_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${getWorkloadColor(lecturer.total_credits)}`}>
                          {lecturer.total_credits} credits
                        </p>
                        <p className="text-xs text-gray-500">
                          {lecturer.total_credits < 9 && 'Light load'}
                          {lecturer.total_credits >= 9 && lecturer.total_credits < 12 && 'Normal load'}
                          {lecturer.total_credits >= 12 && 'Heavy load'}
                        </p>
                      </div>
                      <BookOpen className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Assign Lecturer Modal */}
        {showAssignForm && (
          <LecturerAssignDialog
            courseId={courseId}
            onClose={() => setShowAssignForm(false)}
            onSuccess={handleAssignSuccess}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
