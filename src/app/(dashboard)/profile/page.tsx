import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, enrollments, activityLogs } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  GraduationCap,
  Clock,
  Shield
} from "lucide-react";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Fetch full user data
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id));

  if (!user) redirect("/login");

  // Fetch enrollment stats
  const userEnrollments = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.studentId, session.user.id));

  const activeCount = userEnrollments.filter(e => e.status === 'ACTIVE').length;
  const completedCount = userEnrollments.filter(e => e.status === 'COMPLETED').length;

  // Fetch recent activity count
  const [activityCount] = await db
    .select({ count: count() })
    .from(activityLogs)
    .where(eq(activityLogs.userId, session.user.id));

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const roleColors: Record<string, string> = {
    STUDENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    FACULTY: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    LANDLORD: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and profile information.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                <AvatarFallback className="text-2xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold">{user.name || "Unnamed User"}</h2>
                  <Badge className={roleColors[user.role] || ""}>
                    {user.role}
                  </Badge>
                </div>
                <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
                <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2 mt-1">
                  <Calendar className="h-4 w-4" />
                  Member since {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Role</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.role}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activities</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activityCount?.count || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Edit Profile
            </CardTitle>
            <CardDescription>
              Update your personal information and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm 
              initialData={{
                name: user.name || "",
                bio: (user.profileData?.bio as string) || "",
                phone: (user.profileData?.phone as string) || "",
                department: (user.profileData?.department as string) || "",
                studentId: (user.profileData?.studentId as string) || "",
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
