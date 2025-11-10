'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, MapPin, AlertCircle, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { ScheduleFormDialog } from '@/components/admin/ScheduleFormDialog';

interface Schedule {
  id: number;
  course_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
  lecture_type: 'lecture' | 'lab' | 'tutorial';
}

interface ValidationResult {
  valid: boolean;
  totalHours: number;
  requiredCredits: number;
  message: string;
}

export default function CourseSchedulePage({ params }: { params: { id: string } }) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | undefined>(undefined);

  const courseId = params.id;

  const fetchSchedules = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/schedules`);
      const data = await response.json();
      setSchedules(data.schedules || []);
      setValidation(data.validation || null);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const getDayOrder = (day: string): number => {
    const order: Record<string, number> = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 7,
    };
    return order[day] || 0;
  };

  const groupedSchedules = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.day_of_week]) {
      acc[schedule.day_of_week] = [];
    }
    acc[schedule.day_of_week].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  const sortedDays = Object.keys(groupedSchedules).sort((a, b) => getDayOrder(a) - getDayOrder(b));

  const getLectureTypeColor = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-500';
      case 'lab':
        return 'bg-green-500';
      case 'tutorial':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleDelete = async (scheduleId: number) => {
    if (!confirm('Are you sure you want to delete this schedule entry?')) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete schedule');

      fetchSchedules();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      alert('Failed to delete schedule entry');
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSchedule(undefined);
  };

  const handleFormSuccess = () => {
    fetchSchedules();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading schedule...</div>
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
            <h1 className="text-3xl font-bold">Course Schedule</h1>
            <p className="text-gray-600">Manage weekly class schedule</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Schedule
          </Button>
        </div>

        {/* Validation Alert */}
        {validation && (
          <Card className={validation.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {validation.valid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <div className="flex-1">
                  <p className={validation.valid ? 'text-green-800' : 'text-red-800'}>
                    {validation.message}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Total Hours: {validation.totalHours} | Required Credits: {validation.requiredCredits}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Schedule View */}
        <div className="grid gap-4">
          {sortedDays.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No schedule entries yet. Click "Add Schedule" to create one.</p>
              </CardContent>
            </Card>
          ) : (
            sortedDays.map((day) => (
              <Card key={day}>
                <CardHeader>
                  <CardTitle className="text-xl">{day}</CardTitle>
                  <CardDescription>
                    {groupedSchedules[day].length} session{groupedSchedules[day].length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {groupedSchedules[day]
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((schedule) => (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-1 h-12 ${getLectureTypeColor(schedule.lecture_type)} rounded`} />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="font-semibold">
                                  {schedule.start_time} - {schedule.end_time}
                                </span>
                                <Badge variant="secondary" className="capitalize">
                                  {schedule.lecture_type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="h-3 w-3" />
                                {schedule.room}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(schedule)}
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(schedule.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Schedule Form Modal */}
        {showForm && (
          <ScheduleFormDialog
            courseId={courseId}
            schedule={editingSchedule}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
