// Creates the database tables and the demo account. Safe to run more than once.
// Run with: node --env-file=.env.local scripts/setup-db.mjs
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    business_name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

await sql`
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
  )`;

await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`;

// The class demo account: always exists, always Pro, password is reset on every run.
const demoHash = await bcrypt.hash("password123!", 10);
await sql`
  INSERT INTO users (email, password_hash, business_name, plan)
  VALUES ('demo@demo.com', ${demoHash}, 'Demo Bar & Grill', 'pro')
  ON CONFLICT (email)
  DO UPDATE SET password_hash = EXCLUDED.password_hash, plan = 'pro'`;

const rows = await sql`SELECT id, email, business_name, plan FROM users ORDER BY id`;
console.log(rows);
