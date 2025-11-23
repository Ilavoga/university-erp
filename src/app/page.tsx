import { auth } from "@/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Welcome to University ERP
      </h1>
      <p className="text-lg text-muted-foreground max-w-[600px]">
        Your all-in-one platform for academic progress, housing, transport, and more.
      </p>
      
      <div className="flex gap-4">
        {session ? (
          <Link 
            href="/dashboard" 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go to Dashboard
          </Link>
        ) : (
          <Link 
            href="/login" 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Get Started
          </Link>
        )}
      </div>
    </div>
  );
}
