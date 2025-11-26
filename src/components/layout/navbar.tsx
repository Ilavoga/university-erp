import Link from "next/link"
import { auth } from "@/auth"
import { UserNav } from "./user-nav"
import { Button } from "@/components/ui/button"
import { SidebarSheet } from "@/components/layout/sidebar"
import { NotificationCenter } from "@/components/engagement/notification-center"

export async function Navbar() {
  const session = await auth()
  const user = session?.user

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {user && <SidebarSheet role={user.role} />}
          <Link href="/" className="text-xl font-bold">
            UniERP
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <NotificationCenter />
              <UserNav user={user} />
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
