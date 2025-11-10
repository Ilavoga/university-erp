'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { X, AlertCircle, Search } from 'lucide-react';

interface LecturerAssignDialogProps {
  courseId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Lecturer {
  id: number;
  name: string;
  email: string;
  department?: string;
  total_credits?: number;
  course_count?: number;
}

export function LecturerAssignDialog({ 
  courseId, 
  onClose, 
  onSuccess 
}: LecturerAssignDialogProps) {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLecturer, setSelectedLecturer] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLecturers();
  }, []);

  const fetchLecturers = async () => {
    try {
      const response = await fetch('/api/students?role=lecturer');
      if (!response.ok) throw new Error('Failed to fetch lecturers');
      
      const data = await response.json();
      setLecturers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lecturers');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedLecturer) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/courses/${courseId}/lecturers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lecturer_id: selectedLecturer })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign lecturer');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLecturers = lecturers.filter(lecturer =>
    lecturer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lecturer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lecturer.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Assign Lecturer
            </h2>
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

          <div className="mb-4">
            <Label htmlFor="search">Search Lecturers</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or department..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg mb-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
              </div>
            ) : filteredLecturers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                {searchTerm ? 'No lecturers found matching your search' : 'No lecturers available'}
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredLecturers.map((lecturer) => (
                  <div
                    key={lecturer.id}
                    onClick={() => setSelectedLecturer(lecturer.id)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                      selectedLecturer === lecturer.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{lecturer.name}</h3>
                        <p className="text-slate-600 text-sm mt-1">{lecturer.email}</p>
                        {lecturer.department && (
                          <p className="text-slate-500 text-sm mt-1">
                            Department: {lecturer.department}
                          </p>
                        )}
                      </div>
                      {lecturer.total_credits !== undefined && (
                        <div className="text-right ml-4">
                          <p className="text-sm text-slate-600">Current Workload</p>
                          <p className={`font-semibold ${
                            lecturer.total_credits < 9 ? 'text-green-600' :
                            lecturer.total_credits <= 12 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {lecturer.total_credits} credits
                          </p>
                          <p className="text-xs text-slate-500">
                            {lecturer.course_count || 0} courses
                          </p>
                        </div>
                      )}
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
              onClick={handleAssign}
              disabled={!selectedLecturer || submitting}
              className="flex-1"
            >
              {submitting ? 'Assigning...' : 'Assign Lecturer'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
