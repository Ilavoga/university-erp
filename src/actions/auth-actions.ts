"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { signIn } from "@/auth";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";

export async function registerUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "STUDENT" | "FACULTY" | "ADMIN" | "LANDLORD";

  if (!email || !password || !role) {
    return { error: "Missing fields" };
  }

  // Check if user exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    return { error: "User already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    email,
    passwordHash,
    role,
    name: email.split("@")[0], // Default name
  });

  return { success: true };
}

export async function loginUser(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials" };
        default:
          return { error: "Something went wrong" };
      }
    }
    throw error;
  }
}
