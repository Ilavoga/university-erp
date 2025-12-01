"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  GraduationCap, 
  UserCheck, 
  FileText, 
  Bell,
  Clock
} from "lucide-react";

interface Activity {
  id: string;
  actionType: string;
  referenceId: string | null;
  referenceType: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  relatedData?: Record<string, unknown>;
}

const actionIcons: Record<string, React.ReactNode> = {
  ENROLLED: <BookOpen className="h-4 w-4" />,
  DROPPED: <BookOpen className="h-4 w-4" />,
  GRADE_RECEIVED: <GraduationCap className="h-4 w-4" />,
  ASSIGNMENT_SUBMITTED: <FileText className="h-4 w-4" />,
  ATTENDANCE_MARKED: <UserCheck className="h-4 w-4" />,
  COURSE_CREATED: <BookOpen className="h-4 w-4" />,
  PROFILE_UPDATED: <Bell className="h-4 w-4" />,
};

const actionLabels: Record<string, string> = {
  ENROLLED: "Enrolled in course",
  DROPPED: "Dropped course",
  GRADE_RECEIVED: "Received grade",
  ASSIGNMENT_SUBMITTED: "Submitted assignment",
  ATTENDANCE_MARKED: "Attendance recorded",
  COURSE_CREATED: "Created course",
  PROFILE_UPDATED: "Updated profile",
};

const actionColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ENROLLED: "default",
  DROPPED: "destructive",
  GRADE_RECEIVED: "secondary",
  ASSIGNMENT_SUBMITTED: "default",
  ATTENDANCE_MARKED: "outline",
  COURSE_CREATED: "default",
  PROFILE_UPDATED: "outline",
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getActivityDescription(activity: Activity): string {
  const metadata = activity.metadata || {};
  
  switch (activity.actionType) {
    case 'ENROLLED':
      return `Enrolled in ${metadata.courseName || 'a course'}`;
    case 'DROPPED':
      return `Dropped ${metadata.courseName || 'a course'}`;
    case 'GRADE_RECEIVED':
      return `Received ${metadata.score}/${metadata.totalMarks} on "${metadata.assignmentTitle}" in ${metadata.courseName}`;
    case 'ASSIGNMENT_SUBMITTED':
      return `Submitted "${metadata.assignmentTitle}" for ${metadata.courseName}`;
    case 'ATTENDANCE_MARKED':
      return `Marked ${(metadata.status as string)?.toLowerCase() || 'present'} for ${metadata.courseName}`;
    case 'COURSE_CREATED':
      return `Created course "${metadata.courseName}"`;
    case 'PROFILE_UPDATED':
      return 'Updated profile information';
    default:
      return activity.actionType;
  }
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const response = await fetch("/api/activity?limit=10");
        if (response.ok) {
          const data = await response.json();
          setActivities(data);
        }
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-8 w-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No recent activity to show.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
            >
              <div className="p-2 bg-muted rounded-full">
                {actionIcons[activity.actionType] || <Bell className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={actionColors[activity.actionType] || "default"} className="text-xs">
                    {actionLabels[activity.actionType] || activity.actionType}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {getActivityDescription(activity)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatRelativeTime(activity.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
