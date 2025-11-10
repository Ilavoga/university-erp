'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isValidSemesterYear, isSemesterInFuture, type MonthRange } from '@/lib/semester-utils';

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseCreated: () => void;
  userId: string;
}

export function CreateCourseDialog({
  open,
  onOpenChange,
  onCourseCreated,
  userId,
}: CreateCourseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    credits: '',
    semesterYear: '',
    semesterMonthRange: '' as MonthRange | '',
    facultyId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const year = parseInt(formData.semesterYear);
      const monthRange = formData.semesterMonthRange as MonthRange;

      // Validate year
      if (!isValidSemesterYear(year)) {
        throw new Error('Year must be current year or next year');
      }

      // Validate semester is not in the past
      if (!isSemesterInFuture(year, monthRange)) {
        throw new Error('Cannot create course in a past semester');
      }

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code,
          name: formData.name,
          description: formData.description,
          credits: parseInt(formData.credits),
          semesterYear: year,
          semesterMonthRange: monthRange,
          facultyId: formData.facultyId || userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create course');
      }

      // Reset form
      setFormData({
        code: '',
        name: '',
        description: '',
        credits: '',
        semesterYear: '',
        semesterMonthRange: '',
        facultyId: '',
      });

      onCourseCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create course:', error);
      alert(error instanceof Error ? error.message : 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear, currentYear + 1];
  const monthRanges: MonthRange[] = ['January-April', 'May-August', 'September-December'];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Create New Course</h2>
          <p className="text-slate-600 mt-1">
            Add a new course to the curriculum. Fill in all required fields.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Course Code *</Label>
              <Input
                id="code"
                placeholder="CS101"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credits">Credits *</Label>
              <Input
                id="credits"
                type="number"
                min="1"
                max="6"
                placeholder="3"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Course Name *</Label>
            <Input
              id="name"
              placeholder="Introduction to Programming"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Course description and objectives..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="semesterYear">Academic Year *</Label>
              <select
                id="semesterYear"
                value={formData.semesterYear}
                onChange={(e) => setFormData({ ...formData, semesterYear: e.target.value })}
                required
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select year</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semesterMonthRange">Semester Period *</Label>
              <select
                id="semesterMonthRange"
                value={formData.semesterMonthRange}
                onChange={(e) => setFormData({ ...formData, semesterMonthRange: e.target.value as MonthRange })}
                required
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select period</option>
                {monthRanges.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Course'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}