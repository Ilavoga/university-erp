'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus, GripVertical, Trash2 } from 'lucide-react';
import { isValidSemesterYear, isSemesterInFuture, monthRangeToMonths, type MonthRange } from '@/lib/semester-utils';

interface CourseModule {
  id?: number;
  title: string;
  description: string;
  sequence: number;
  duration_weeks: number;
  learning_objectives: string[];
}

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
  courseId?: string;
  initialData?: {
    code: string;
    name: string;
    description: string;
    credits: number;
    semester: string;
    facultyId: string;
  };
}

export function CourseFormDialog({
  open,
  onOpenChange,
  onSuccess,
  userId,
  courseId,
  initialData,
}: CourseFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    credits: initialData?.credits.toString() || '',
    semesterYear: '',
    semesterMonthRange: '' as MonthRange | '',
    facultyId: initialData?.facultyId || userId,
  });
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [showModuleSection, setShowModuleSection] = useState(false);

  useEffect(() => {
    if (open && courseId) {
      // Load existing modules when editing
      fetchModules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, courseId]);

  const fetchModules = async () => {
    if (!courseId) return;
    
    setLoadingModules(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/modules`);
      if (response.ok) {
        const data = await response.json();
        setModules(data.modules.map((m: { id: number; title: string; description: string; sequence: number; duration_weeks: number; learning_objectives: string }) => ({
          id: m.id,
          title: m.title,
          description: m.description || '',
          sequence: m.sequence,
          duration_weeks: m.duration_weeks || 1,
          learning_objectives: m.learning_objectives ? JSON.parse(m.learning_objectives) : []
        })));
        if (data.modules.length > 0) {
          setShowModuleSection(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    } finally {
      setLoadingModules(false);
    }
  };

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

      const courseData = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        credits: parseInt(formData.credits),
        semesterYear: year,
        semesterMonthRange: monthRange,
        facultyId: formData.facultyId || userId,
      };

      // Create or update course
      const courseResponse = await fetch(
        courseId ? `/api/courses/${courseId}` : '/api/courses',
        {
          method: courseId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(courseData),
        }
      );

      if (!courseResponse.ok) {
        const error = await courseResponse.json();
        throw new Error(error.error || 'Failed to save course');
      }

      const savedCourse = await courseResponse.json();
      const finalCourseId = courseId || savedCourse.id;

      // Save modules if any were added
      if (modules.length > 0) {
        await saveModules(finalCourseId);
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
      setModules([]);
      setShowModuleSection(false);

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save course:', error);
      alert(error instanceof Error ? error.message : 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const saveModules = async (targetCourseId: string) => {
    for (const courseModule of modules) {
      try {
        if (courseModule.id) {
          // Update existing module
          await fetch(`/api/courses/${targetCourseId}/modules/${courseModule.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: courseModule.title,
              description: courseModule.description,
              sequence: courseModule.sequence,
              duration_weeks: courseModule.duration_weeks,
              learning_objectives: courseModule.learning_objectives,
            }),
          });
        } else {
          // Create new module
          await fetch(`/api/courses/${targetCourseId}/modules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: courseModule.title,
              description: courseModule.description,
              sequence: courseModule.sequence,
              duration_weeks: courseModule.duration_weeks,
              learning_objectives: courseModule.learning_objectives,
            }),
          });
        }
      } catch (error) {
        console.error('Failed to save module:', error);
      }
    }
  };

  const addModule = () => {
    setModules([
      ...modules,
      {
        title: '',
        description: '',
        sequence: modules.length + 1,
        duration_weeks: 1,
        learning_objectives: [],
      },
    ]);
    setShowModuleSection(true);
  };

  const removeModule = async (index: number) => {
    const courseModule = modules[index];
    
    // If module has an ID, delete it from the server
    if (courseModule.id && courseId) {
      if (!confirm('Are you sure you want to delete this module?')) return;
      
      try {
        await fetch(`/api/courses/${courseId}/modules/${courseModule.id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to delete module:', error);
        alert('Failed to delete module');
        return;
      }
    }
    
    const newModules = modules.filter((_, i) => i !== index);
    // Re-sequence remaining modules
    newModules.forEach((m, i) => {
      m.sequence = i + 1;
    });
    setModules(newModules);
  };

  const updateModule = (index: number, field: keyof CourseModule, value: string | number | string[]) => {
    const newModules = [...modules];
    newModules[index] = { ...newModules[index], [field]: value };
    setModules(newModules);
  };

  const addLearningObjective = (moduleIndex: number) => {
    const newModules = [...modules];
    newModules[moduleIndex].learning_objectives.push('');
    setModules(newModules);
  };

  const updateLearningObjective = (moduleIndex: number, objIndex: number, value: string) => {
    const newModules = [...modules];
    newModules[moduleIndex].learning_objectives[objIndex] = value;
    setModules(newModules);
  };

  const removeLearningObjective = (moduleIndex: number, objIndex: number) => {
    const newModules = [...modules];
    newModules[moduleIndex].learning_objectives.splice(objIndex, 1);
    setModules(newModules);
  };

  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear, currentYear + 1];
  const monthRanges: MonthRange[] = ['January-April', 'May-August', 'September-December'];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {courseId ? 'Edit Course' : 'Create New Course'}
              </h2>
              <p className="text-slate-600 mt-1">
                {courseId ? 'Update course details and manage modules' : 'Add a new course with optional modules'}
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Course Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">
              Course Information
            </h3>
            
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
                className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
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
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
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
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
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
          </div>

          {/* Modules Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-semibold text-slate-900">
                Course Modules (Optional)
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addModule}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </div>

            {loadingModules && (
              <div className="text-center py-4 text-slate-600">
                Loading modules...
              </div>
            )}

            {showModuleSection && modules.length === 0 && !loadingModules && (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
                <p>No modules yet. Click "Add Module" to create one.</p>
              </div>
            )}

            <div className="space-y-4">
              {modules.map((module, index) => (
                <Card key={index} className="border-slate-200">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-2">
                          <GripVertical className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-1">
                              <Label>Order</Label>
                              <Input
                                type="number"
                                value={module.sequence}
                                onChange={(e) =>
                                  updateModule(index, 'sequence', parseInt(e.target.value))
                                }
                                min="1"
                                className="text-center"
                              />
                            </div>
                            <div className="col-span-7">
                              <Label>Module Title *</Label>
                              <Input
                                placeholder="e.g., Introduction to Variables"
                                value={module.title}
                                onChange={(e) => updateModule(index, 'title', e.target.value)}
                                required
                              />
                            </div>
                            <div className="col-span-4">
                              <Label>Duration (weeks)</Label>
                              <Input
                                type="number"
                                min="1"
                                max="16"
                                value={module.duration_weeks}
                                onChange={(e) =>
                                  updateModule(index, 'duration_weeks', parseInt(e.target.value))
                                }
                              />
                            </div>
                          </div>

                          <div>
                            <Label>Description</Label>
                            <textarea
                              placeholder="Module description..."
                              value={module.description}
                              onChange={(e) => updateModule(index, 'description', e.target.value)}
                              rows={2}
                              className="flex min-h-[60px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                            />
                          </div>

                          {/* Learning Objectives */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label>Learning Objectives</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addLearningObjective(index)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Objective
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {module.learning_objectives.map((obj, objIndex) => (
                                <div key={objIndex} className="flex gap-2">
                                  <Input
                                    placeholder={`Objective ${objIndex + 1}`}
                                    value={obj}
                                    onChange={(e) =>
                                      updateLearningObjective(index, objIndex, e.target.value)
                                    }
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeLearningObjective(index, objIndex)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeModule(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
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
              {loading ? 'Saving...' : courseId ? 'Update Course' : 'Create Course'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
