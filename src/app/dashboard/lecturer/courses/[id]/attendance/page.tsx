'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle, Calendar, FileText } from 'lucide-react';
import { AttendanceMarkingDialog } from '@/components/lecturer/AttendanceMarkingDialog';

interface Lecture {
  id: number;
  course_id: number;
  lecture_date: string;
  topic: string | null;
  conducted_by: number | null;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface AttendanceRecord {
  id: number;
  lecture_id: number;
  student_id: number;
  student_name: string;
  student_id_text: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

interface LectureWithAttendance {
  lecture: Lecture & { course_name: string; course_code: string };
  attendance_records: AttendanceRecord[];
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
}

export default function LecturerAttendancePage({ params }: { params: { id: string } }) {
  const [lectures, setLectures] = useState<LectureWithAttendance[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState<number | null>(null);
  const [selectedLectureName, setSelectedLectureName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const courseId = params.id;

  useEffect(() => {
    fetchLectures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchLectures = async () => {
    try {
      const response = await fetch(`/api/lectures?courseId=${courseId}`);
      const data = await response.json();
      setLectures(data.lectures || []);
    } catch (error) {
      console.error('Failed to fetch lectures:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'excused':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4" />;
      case 'late':
        return <Clock className="h-4 w-4" />;
      case 'absent':
        return <XCircle className="h-4 w-4" />;
      case 'excused':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleMarkAttendance = (lecture: LectureWithAttendance) => {
    setSelectedLectureId(lecture.lecture.id);
    setSelectedLectureName(
      `${lecture.lecture.course_code} - ${formatDate(lecture.lecture.lecture_date)}${
        lecture.lecture.topic ? ` (${lecture.lecture.topic})` : ''
      }`
    );
  };

  const handleAttendanceSuccess = () => {
    fetchLectures();
  };


  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading lectures...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Course Attendance</h1>
          <p className="text-gray-600">View and mark attendance for lectures</p>
        </div>

        {/* Lectures List */}
        <div className="grid gap-4">
          {lectures.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No lectures found for this course.</p>
              </CardContent>
            </Card>
          ) : (
            lectures.map((lectureData) => (
              <Card key={lectureData.lecture.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {lectureData.lecture.topic || 'Untitled Lecture'}
                        </h3>
                        <Badge variant={lectureData.lecture.status === 'completed' ? 'default' : 'secondary'}>
                          {lectureData.lecture.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {new Date(lectureData.lecture.lecture_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{lectureData.present_count} Present</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span>{lectureData.late_count} Late</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span>{lectureData.absent_count} Absent</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                          <span>{lectureData.excused_count} Excused</span>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => handleMarkAttendance(lectureData)}>Mark Attendance</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Attendance Marking Dialog */}
        {selectedLectureId && (
          <AttendanceMarkingDialog
            lectureId={selectedLectureId}
            lectureName={selectedLectureName}
            courseId={courseId}
            onSuccess={handleAttendanceSuccess}
            onClose={() => setSelectedLectureId(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
