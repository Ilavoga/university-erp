import { db } from "../src/db";
import { users } from "../src/db/schema";

async function main() {
  console.log("Starting DB check...");
  try {
    const allUsers = await db.select().from(users);
    console.log("Users found:", allUsers.length);
    console.log("DB check passed.");
  } catch (error) {
    console.error("DB check failed:", error);
  }
}

main();
