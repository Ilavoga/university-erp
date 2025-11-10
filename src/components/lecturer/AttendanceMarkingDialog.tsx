'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, AlertCircle, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';

interface Student {
  id: number;
  name: string;
  email: string;
  student_id?: string;
}

interface AttendanceMarkingDialogProps {
  lectureId: number;
  lectureName: string;
  courseId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

export function AttendanceMarkingDialog({ 
  lectureId,
  lectureName,
  courseId,
  onClose, 
  onSuccess 
}: AttendanceMarkingDialogProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
    fetchExistingAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStudents = async () => {
    try {
      // Fetch enrolled students for this course
      const response = await fetch(`/api/courses/${courseId}?include=enrollments`);
      if (!response.ok) throw new Error('Failed to fetch students');
      
      const data = await response.json();
      setStudents(data.enrollments?.map((e: { user_id: number; user_name: string; user_email: string; student_id?: string }) => ({
        id: e.user_id,
        name: e.user_name,
        email: e.user_email,
        student_id: e.student_id
      })) || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      // For now, use mock data if enrollment API not ready
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const response = await fetch(`/api/lectures/${lectureId}/attendance`);
      if (response.ok) {
        const data = await response.json();
        const existingAttendance: Record<number, AttendanceStatus> = {};
        data.attendance?.forEach((record: { student_id: number; status: AttendanceStatus }) => {
          existingAttendance[record.student_id] = record.status;
        });
        setAttendance(existingAttendance);
      }
    } catch (err) {
      console.error('Failed to fetch existing attendance:', err);
    }
  };

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: parseInt(studentId),
        status
      }));

      const response = await fetch(`/api/lectures/${lectureId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance: records })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save attendance');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'late':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'excused':
        return <FileText className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'late':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'absent':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'excused':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const summary = {
    present: Object.values(attendance).filter(s => s === 'present').length,
    late: Object.values(attendance).filter(s => s === 'late').length,
    absent: Object.values(attendance).filter(s => s === 'absent').length,
    excused: Object.values(attendance).filter(s => s === 'excused').length,
    unmarked: students.length - Object.keys(attendance).length
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Mark Attendance</h2>
              <p className="text-slate-600 text-sm mt-1">{lectureName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-5 gap-3 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{summary.present}</p>
              <p className="text-xs text-green-600">Present</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-700">{summary.late}</p>
              <p className="text-xs text-yellow-600">Late</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-700">{summary.absent}</p>
              <p className="text-xs text-red-600">Absent</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{summary.excused}</p>
              <p className="text-xs text-blue-600">Excused</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-slate-700">{summary.unmarked}</p>
              <p className="text-xs text-slate-600">Unmarked</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mb-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newAttendance: Record<number, AttendanceStatus> = {};
                students.forEach(s => newAttendance[s.id] = 'present');
                setAttendance(newAttendance);
              }}
            >
              Mark All Present
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newAttendance: Record<number, AttendanceStatus> = {};
                students.forEach(s => newAttendance[s.id] = 'absent');
                setAttendance(newAttendance);
              }}
            >
              Mark All Absent
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAttendance({})}
            >
              Clear All
            </Button>
          </div>

          {/* Student List */}
          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg mb-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>No enrolled students found</p>
                <p className="text-sm mt-1">Students need to enroll in this course first</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{student.name}</h3>
                        <p className="text-slate-600 text-sm">{student.email}</p>
                        {student.student_id && (
                          <p className="text-slate-500 text-xs mt-1">ID: {student.student_id}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {(['present', 'late', 'absent', 'excused'] as AttendanceStatus[]).map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(student.id, status)}
                            className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                              attendance[student.id] === status
                                ? getStatusColor(status)
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {getStatusIcon(status)}
                            <span className="capitalize text-sm font-medium">{status}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || students.length === 0 || Object.keys(attendance).length === 0}
              className="flex-1"
            >
              {submitting ? 'Saving...' : `Save Attendance (${Object.keys(attendance).length}/${students.length})`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
