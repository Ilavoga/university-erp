import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ActivityFeed } from "@/components/engagement/activity-feed";
import { db } from "@/db";
import { enrollments, courses, notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Bell, GraduationCap, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Fetch user stats
  const userEnrollments = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.studentId, session.user.id));

  const activeEnrollments = userEnrollments.filter(e => e.status === 'ACTIVE');

  const unreadNotifications = await db
    .select()
    .from(notifications)
    .where(and(
      eq(notifications.userId, session.user.id),
      eq(notifications.isRead, false)
    ));

  // Fetch enrolled courses for quick access
  const enrolledCourses = await db
    .select({
      id: courses.id,
      title: courses.title,
      code: courses.code,
    })
    .from(courses)
    .innerJoin(enrollments, eq(courses.id, enrollments.courseId))
    .where(and(
      eq(enrollments.studentId, session.user.id),
      eq(enrollments.status, 'ACTIVE')
    ))
    .limit(4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session.user.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEnrollments.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently enrolled courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotifications.length}</div>
            <p className="text-xs text-muted-foreground">
              Pending notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userEnrollments.length}</div>
            <p className="text-xs text-muted-foreground">
              All time enrollments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userEnrollments.filter(e => e.status === 'COMPLETED').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Courses completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Activity Feed */}
        <ActivityFeed />

        {/* Quick Access Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrolledCourses.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  You haven&apos;t enrolled in any courses yet.
                </p>
                {session.user.role === "STUDENT" && (
                  <Button asChild>
                    <Link href="/academics/explore">Browse Courses</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {enrolledCourses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/academics/progress/${course.id}`}
                    className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium">{course.title}</div>
                    <div className="text-sm text-muted-foreground">{course.code}</div>
                  </Link>
                ))}
                {activeEnrollments.length > 4 && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/academics">View All Courses</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
