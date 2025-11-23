import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export interface CourseProgress {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  percentage: number;
  gpa: number;
  status: "ACTIVE" | "COMPLETED" | "DROPPED";
}

interface CourseCardProps {
  data: CourseProgress;
}

export function CourseCard({ data }: CourseCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-bold">{data.courseCode}</CardTitle>
          <p className="text-sm text-muted-foreground">{data.courseTitle}</p>
        </div>
        <Badge variant={data.status === "ACTIVE" ? "default" : "secondary"}>
          {data.status}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{data.percentage}%</span>
          </div>
          <Progress value={data.percentage} className="h-2" />
          <div className="mt-2 flex justify-between text-sm">
             <span className="text-muted-foreground">GPA</span>
             <span className="font-bold">{data.gpa.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/academics/progress/${data.courseId}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
