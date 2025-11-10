'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

interface ScheduleFormDialogProps {
  courseId: string;
  schedule?: {
    id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room: string;
    lecture_type: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const LECTURE_TYPES = ['lecture', 'lab', 'tutorial'];

export function ScheduleFormDialog({ 
  courseId, 
  schedule, 
  onClose, 
  onSuccess 
}: ScheduleFormDialogProps) {
  const [formData, setFormData] = useState({
    day_of_week: schedule?.day_of_week || 'Monday',
    start_time: schedule?.start_time || '09:00',
    end_time: schedule?.end_time || '10:00',
    room: schedule?.room || '',
    lecture_type: schedule?.lecture_type || 'lecture'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConflicts([]);

    try {
      const url = schedule 
        ? `/api/courses/${courseId}/schedules/${schedule.id}`
        : `/api/courses/${courseId}/schedules`;
      
      const method = schedule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.conflicts) {
          setConflicts(data.conflicts);
          setError('Schedule conflicts detected. Please review and confirm.');
        } else {
          throw new Error(data.error || 'Failed to save schedule');
        }
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmWithConflicts = async () => {
    setLoading(true);
    try {
      const url = schedule 
        ? `/api/courses/${courseId}/schedules/${schedule.id}`
        : `/api/courses/${courseId}/schedules`;
      
      const method = schedule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, force: true })
      });

      if (!response.ok) {
        throw new Error('Failed to save schedule');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              {schedule ? 'Edit Schedule' : 'Add Schedule'}
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

          {conflicts.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-900 font-semibold mb-2">⚠️ Conflicts Detected:</p>
              <ul className="space-y-1">
                {conflicts.map((conflict, index) => (
                  <li key={index} className="text-yellow-700 text-sm">• {conflict}</li>
                ))}
              </ul>
              <Button
                onClick={handleConfirmWithConflicts}
                disabled={loading}
                className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700"
              >
                {loading ? 'Saving...' : 'Save Anyway'}
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="day_of_week">Day of Week</Label>
              <select
                id="day_of_week"
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="room">Room</Label>
              <Input
                id="room"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="e.g., Room 101, Lab A"
                required
              />
            </div>

            <div>
              <Label htmlFor="lecture_type">Lecture Type</Label>
              <select
                id="lecture_type"
                value={formData.lecture_type}
                onChange={(e) => setFormData({ ...formData, lecture_type: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {LECTURE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || conflicts.length > 0}
                className="flex-1"
              >
                {loading ? 'Saving...' : schedule ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
