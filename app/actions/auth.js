"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { endSession, startSession } from "@/lib/auth";

function cleanEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

export async function signup(previousState, formData) {
  const businessName = String(formData.get("businessName") ?? "").trim();
  const email = cleanEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");

  if (!businessName) return { error: "Please enter your business name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email." };
  if (password.length < 8) return { error: "Your password must be at least 8 characters." };

  const passwordHash = await bcrypt.hash(password, 10);
  const rows = await sql`
    INSERT INTO users (email, password_hash, business_name)
    VALUES (${email}, ${passwordHash}, ${businessName})
    ON CONFLICT (email) DO NOTHING
    RETURNING id`;

  if (rows.length === 0) return { error: "An account with that email already exists. Try logging in." };

  await startSession(rows[0].id);
  redirect("/dashboard");
}

export async function login(previousState, formData) {
  const email = cleanEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");

  const rows = await sql`SELECT id, password_hash FROM users WHERE email = ${email}`;
  const user = rows[0];
  const passwordIsCorrect = user && (await bcrypt.compare(password, user.password_hash));

  // Same message either way, so nobody can test which emails have accounts.
  if (!passwordIsCorrect) return { error: "That email or password isn't right." };

  await startSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await endSession();
  redirect("/");
}
