import Link from "next/link"
import { auth } from "@/auth"
import { signOut } from "@/auth"

export async function Navbar() {
  const session = await auth()
  const user = session?.user

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          UniERP
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user.email} ({user.role})
              </span>
              <form
                action={async () => {
                  "use server"
                  await signOut()
                }}
              >
                <button className="text-sm font-medium hover:underline">
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:underline">
                Login
              </Link>
              <Link href="/register" className="text-sm font-medium hover:underline">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
