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

// 'business' accounts post; 'customer' accounts browse, like, save, and follow.
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'business'`;
await sql`ALTER TABLE users ALTER COLUMN business_name DROP NOT NULL`;

await sql`
  CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    post_date DATE NOT NULL,
    start_time TEXT NOT NULL DEFAULT '',
    end_time TEXT NOT NULL DEFAULT '',
    is_21_plus BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

await sql`
  CREATE TABLE IF NOT EXISTS likes (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, post_id)
  )`;

await sql`
  CREATE TABLE IF NOT EXISTS saves (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, post_id)
  )`;

await sql`
  CREATE TABLE IF NOT EXISTS follows (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, business_id)
  )`;

// Business page details.
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT ''`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT ''`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS hours TEXT NOT NULL DEFAULT ''`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS menu_url TEXT NOT NULL DEFAULT ''`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT ''`;

// Repeating posts store the weekdays they happen on (0 = Sunday ... 6 = Saturday).
// An empty list means a one-time post on post_date.
await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS repeat_days INTEGER[] NOT NULL DEFAULT '{}'`;
await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT ''`;

// The class demo account: always exists, always Pro, password is reset on every run.
const demoHash = await bcrypt.hash("password123!", 10);
await sql`
  INSERT INTO users (email, password_hash, business_name, plan)
  VALUES ('demo@demo.com', ${demoHash}, 'Demo Bar & Grill', 'pro')
  ON CONFLICT (email)
  DO UPDATE SET password_hash = EXCLUDED.password_hash, plan = 'pro', role = 'business'`;

// Give the demo business a few upcoming posts so the feed is never empty.
const [demo] = await sql`SELECT id FROM users WHERE email = 'demo@demo.com'`;
await sql`
  UPDATE users SET
    bio = 'Wings, burgers, and every Penn State game on 12 TVs. A downtown State College favorite.',
    address = '100 W College Ave, State College, PA 16801',
    hours = ${"Mon-Thu: 11 AM - 12 AM\nFri-Sat: 11 AM - 2 AM\nSun: 11 AM - 10 PM"}
  WHERE id = ${demo.id} AND bio = ''`;
const [{ upcoming }] = await sql`
  SELECT count(*)::int AS upcoming FROM posts
  WHERE business_id = ${demo.id}
    AND post_date >= (now() AT TIME ZONE 'America/New_York')::date`;
if (upcoming === 0) {
  await sql`
    INSERT INTO posts (business_id, title, description, category, post_date, start_time, end_time, is_21_plus)
    VALUES
      (${demo.id}, 'Half-Off Wings Night', 'Half-off wings all night with $3 well drinks. Bring your friends.',
       'Specials', (now() AT TIME ZONE 'America/New_York')::date + 1, '21:00', 'close', true),
      (${demo.id}, 'Trivia Night', 'Teams of up to six. Winners get a $50 gift card.',
       'Events', (now() AT TIME ZONE 'America/New_York')::date + 2, '20:00', '22:00', false),
      (${demo.id}, 'Game Day Tailgate Platter', 'Wings, sliders, and fries for the whole group. Doors open early.',
       'Game Day', (now() AT TIME ZONE 'America/New_York')::date + 4, '11:00', '', false)`;
}

const rows = await sql`SELECT id, email, business_name, plan, role FROM users ORDER BY id`;
console.log(rows);
