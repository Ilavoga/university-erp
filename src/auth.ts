import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import Credentials from "next-auth/providers/credentials"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcrypt"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: DrizzleAdapter(db) as any,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        console.log("Authorize called with:", { email: credentials?.email })
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        })

        if (!user) {
          console.log("User not found in DB")
          return null
        }

        if (!user.passwordHash) {
          console.log("User has no password hash")
          return null
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        console.log("Password match result:", passwordsMatch)

        if (passwordsMatch) {
          return user
        }

        return null
      },
    }),
  ],
})
