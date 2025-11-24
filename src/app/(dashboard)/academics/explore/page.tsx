import { auth } from "@/auth";
import { generateRecommendations } from "@/lib/recommendation-engine";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, BookOpen, Calendar, Star } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { courses, enrollments } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { StudentCourseCatalog } from "@/components/academics/student-course-catalog";

export default async function ExplorePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const recommendations = await generateRecommendations(session.user.id);

  // Fetch all courses with enrollment counts
  const allCourses = await db
    .select({
      id: courses.id,
      title: courses.title,
      code: courses.code,
      description: courses.description,
      credits: courses.credits,
      capacity: courses.capacity,
      enrollmentCount: sql<number>`count(${enrollments.id})`.mapWith(Number),
    })
    .from(courses)
    .leftJoin(enrollments, eq(courses.id, enrollments.courseId))
    .groupBy(courses.id);

  // Fetch student's enrolled course IDs
  const studentEnrollments = await db
    .select({ courseId: enrollments.courseId })
    .from(enrollments)
    .where(eq(enrollments.studentId, session.user.id));
    
  const enrolledCourseIds = studentEnrollments.map(e => e.courseId);

  const getIcon = (type: string) => {
    switch (type) {
      case "COURSE": return <BookOpen className="h-5 w-5" />;
      case "EVENT": return <Calendar className="h-5 w-5" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Explore</h1>
        <p className="text-muted-foreground">
          Personalized recommendations based on your academic progress.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((rec) => (
          <Card key={rec.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="p-2 bg-primary/10 rounded-full text-primary mb-4">
                  {getIcon(rec.type)}
                </div>
                <Badge variant="outline">{rec.type}</Badge>
              </div>
              <CardTitle className="line-clamp-1">
                {rec.type === 'COURSE' ? 'Recommended Course' : 'Resource'}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {rec.reason}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-sm text-muted-foreground">
                Relevance Score: {rec.relevanceScore}%
              </div>
            </CardContent>
            <CardFooter>
              {rec.resourceLink ? (
                <Button asChild className="w-full">
                  <Link href={rec.resourceLink} target="_blank">
                    View Resource <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button variant="secondary" className="w-full" disabled>
                  No Link Available
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No recommendations available at the moment. Check back later!
          </p>
        </div>
      )}

      <div className="mt-12">
        <StudentCourseCatalog courses={allCourses} enrolledCourseIds={enrolledCourseIds} />
      </div>
    </div>
  );
}
