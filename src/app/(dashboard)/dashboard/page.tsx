import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ActivityFeed } from "@/components/engagement/activity-feed";
import { db } from "@/db";
import { enrollments, courses, notifications, users, externalListings, hostelBlocks, roomBookings } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Bell, GraduationCap, Clock, Users, Home, Building, FileCheck, UserCheck, ClipboardList } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user.role;

  // Redirect landlords to their housing page
  if (role === "LANDLORD") {
    redirect("/housing/landlord");
  }

  // Common: Unread notifications
  const unreadNotifications = await db
    .select()
    .from(notifications)
    .where(and(
      eq(notifications.userId, session.user.id),
      eq(notifications.isRead, false)
    ));

  // Role-specific data fetching
  if (role === "ADMIN") {
    return <AdminDashboard session={session} unreadCount={unreadNotifications.length} />;
  }

  if (role === "FACULTY") {
    return <FacultyDashboard session={session} unreadCount={unreadNotifications.length} />;
  }

  // Default: Student dashboard
  return <StudentDashboard session={session} unreadCount={unreadNotifications.length} />;
}

// ================== ADMIN DASHBOARD ==================
async function AdminDashboard({ session, unreadCount }: { session: { user: { id: string; name?: string | null } }; unreadCount: number }) {
  // Fetch admin stats
  const totalUsers = await db.select({ value: sql<number>`count(*)` }).from(users);
  const totalCourses = await db.select({ value: sql<number>`count(*)` }).from(courses);
  const totalHostels = await db.select({ value: sql<number>`count(*)` }).from(hostelBlocks);
  const pendingBookings = await db
    .select({ value: sql<number>`count(*)` })
    .from(roomBookings)
    .where(eq(roomBookings.status, "PENDING"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and management</p>
      </div>

      {/* Admin Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers[0]?.value ?? 0}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourses[0]?.value ?? 0}</div>
            <p className="text-xs text-muted-foreground">Available courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hostel Blocks</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHostels[0]?.value ?? 0}</div>
            <p className="text-xs text-muted-foreground">On-campus housing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings[0]?.value ?? 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <ActivityFeed />
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/academics">
                <GraduationCap className="mr-2 h-4 w-4" />
                Manage Courses
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/housing">
                <Home className="mr-2 h-4 w-4" />
                Manage Housing
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/profile">
                <Users className="mr-2 h-4 w-4" />
                User Management
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ================== FACULTY DASHBOARD ==================
async function FacultyDashboard({ session, unreadCount }: { session: { user: { id: string; name?: string | null } }; unreadCount: number }) {
  // Fetch faculty's courses
  const facultyCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.lecturerId, session.user.id));

  // Count total enrolled students across all courses
  const studentCounts = await Promise.all(
    facultyCourses.map(async (course) => {
      const result = await db
        .select({ value: sql<number>`count(*)` })
        .from(enrollments)
        .where(and(
          eq(enrollments.courseId, course.id),
          eq(enrollments.status, "ACTIVE")
        ));
      return result[0]?.value ?? 0;
    })
  );
  const totalStudents = studentCounts.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Faculty Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session.user.name}!</p>
      </div>

      {/* Faculty Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facultyCourses.length}</div>
            <p className="text-xs text-muted-foreground">Courses teaching</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">Unread messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grades</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">To be graded</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        <ActivityFeed />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {facultyCourses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No courses assigned yet.
              </p>
            ) : (
              <div className="space-y-3">
                {facultyCourses.slice(0, 4).map((course) => (
                  <Link
                    key={course.id}
                    href={`/academics`}
                    className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium">{course.title}</div>
                    <div className="text-sm text-muted-foreground">{course.code}</div>
                  </Link>
                ))}
                {facultyCourses.length > 4 && (
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

// ================== STUDENT DASHBOARD ==================
async function StudentDashboard({ session, unreadCount }: { session: { user: { id: string; name?: string | null; role?: string } }; unreadCount: number }) {
  // Fetch user stats
  const userEnrollments = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.studentId, session.user.id));

  const activeEnrollments = userEnrollments.filter(e => e.status === 'ACTIVE');

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
            <div className="text-2xl font-bold">{unreadCount}</div>
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
                <Button asChild>
                  <Link href="/academics/explore">Browse Courses</Link>
                </Button>
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
