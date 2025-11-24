import { auth } from "@/auth";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto py-4 px-4 flex flex-col items-center justify-center flex-1 gap-6 text-center">
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
    </div>
  );
}
