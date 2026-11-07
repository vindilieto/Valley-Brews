import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { sql } from "./db";

const COOKIE_NAME = "session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

// The browser keeps the token; the database only keeps a scrambled copy, so a
// leaked database can't be used to log in as anyone.
function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function startSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + THIRTY_DAYS * 1000);

  await sql`
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (${hashToken(token)}, ${userId}, ${expires})`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function endSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
  }
  cookieStore.delete(COOKIE_NAME);
}

// Returns the logged-in user, or null if nobody is logged in.
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const rows = await sql`
    SELECT users.id, users.email, users.business_name, users.plan
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ${hashToken(token)}
      AND sessions.expires_at > now()`;

  return rows[0] ?? null;
}
