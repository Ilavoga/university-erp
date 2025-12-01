import { auth } from "@/auth";
import { db } from "@/db";
import { enrollments, grades, assignments, courses, attendance } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { ProgressChart } from "@/components/academics/progress-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseProgressPage({ params }: PageProps) {
  const { courseId } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  // Fetch enrollment details
  const enrollment = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.studentId, session.user.id),
      eq(enrollments.courseId, courseId)
    ),
    with: {
      course: true,
      grades: {
        with: {
          assignment: true
        }
      }
    }
  });

  if (!enrollment) {
    notFound();
  }

  // Fetch attendance stats
  const attendanceRecords = await db.query.attendance.findMany({
    where: eq(attendance.enrollmentId, enrollment.id),
  });

  const totalClasses = attendanceRecords.length;
  const presentClasses = attendanceRecords.filter(a => a.status === "PRESENT").length;
  const attendancePercentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

  // Prepare data for chart
  const chartData = enrollment.grades.map(grade => ({
    assignment: grade.assignment.title,
    score: grade.scoreObtained,
    total: grade.assignment.totalMarks
  }));

  // Calculate stats
  const totalPossible = enrollment.grades.reduce((acc, g) => acc + g.assignment.totalMarks, 0);
  const totalObtained = enrollment.grades.reduce((acc, g) => acc + g.scoreObtained, 0);
  const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{enrollment.course.title}</h1>
          <p className="text-muted-foreground">{enrollment.course.code}</p>
        </div>
        <Badge variant={enrollment.status === "ACTIVE" ? "default" : "secondary"} className="text-lg px-4 py-1">
          {enrollment.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{percentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {totalObtained} / {totalPossible} points
            </p>
          </CardContent>
        </Card>
        
        {/* Attendance Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {totalClasses > 0 ? (
              <>
                <div className="text-2xl font-bold">{attendancePercentage.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {presentClasses} / {totalClasses} classes attended
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">N/A</div>
                <p className="text-xs text-muted-foreground">
                  Attendance tracking not yet active
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
           <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollment.grades.length}</div>
            <p className="text-xs text-muted-foreground">
              Graded assignments
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ProgressChart data={chartData} />
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enrollment.grades.map((grade) => (
                <div key={grade.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{grade.assignment.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Graded on {grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString() : 'Date not recorded'}
                    </p>
                  </div>
                  <div className="font-bold">
                    {grade.scoreObtained} / {grade.assignment.totalMarks}
                  </div>
                </div>
              ))}
              {enrollment.grades.length === 0 && (
                <p className="text-muted-foreground text-sm">No grades recorded yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
