
import { db } from "./src/db";
import { users } from "./src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function checkUser(email: string, password: string) {
  console.log(`Checking user: ${email}`);
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    console.log("❌ User not found");
    return;
  }

  console.log("✅ User found:", user.id, user.role);
  
  if (!user.passwordHash) {
      console.log("❌ No password hash set");
      return;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (match) {
    console.log("✅ Password match");
  } else {
    console.log("❌ Password mismatch");
  }
}

async function main() {
    await checkUser("dr.wilson@university.edu", "faculty");
    await checkUser("john.doe@university.edu", "student");
}

main();
