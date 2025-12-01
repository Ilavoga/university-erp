
"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface EnrollButtonProps {
  courseId: string;
  isEnrolled: boolean;
}

export function EnrollButton({ courseId, isEnrolled }: EnrollButtonProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onEnroll() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/student/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to enroll");
      }

      toast({
        title: "Success",
        description: "Enrolled in course successfully",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enroll",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button 
      onClick={onEnroll} 
      disabled={isEnrolled || isLoading}
      variant={isEnrolled ? "secondary" : "default"}
      className="w-full"
    >
      {isEnrolled ? "Enrolled" : isLoading ? "Enrolling..." : "Enroll"}
    </Button>
  );
}
