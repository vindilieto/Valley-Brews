import Link from "next/link";
import PostCard from "@/app/components/PostCard";
import TopBar from "@/app/components/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { addDays, CATEGORIES, formatDate, todayInStateCollege } from "@/lib/format";

export async function generateMetadata({ searchParams }) {
  const { view } = await searchParams;
  return { title: view === "following" ? "Following | Valley Brews" : "Home | Valley Brews" };
}

const VIEWS = [
  { id: "all", label: "Everything" },
  { id: "following", label: "Following" },
  { id: "saved", label: "Saved" },
];

function feedLink(view, categories) {
  const params = new URLSearchParams();
  if (view !== "all") params.set("view", view);
  for (const category of categories) params.append("category", category);
  const query = params.toString();
  return query ? `/feed?${query}` : "/feed";
}

// Turns one category filter on or off, keeping the others.
function toggled(categories, category) {
  return categories.includes(category)
    ? categories.filter((c) => c !== category)
    : CATEGORIES.filter((c) => c === category || categories.includes(c));
}

export default async function FeedPage({ searchParams }) {
  const user = await getCurrentUser();
  const isCustomer = user?.role === "customer";
  const params = await searchParams;
  const view = isCustomer && VIEWS.some((v) => v.id === params.view) ? params.view : "all";
  // Any number of category filters, e.g. ?category=Events&category=Game+Day+Specials
  const picked = [params.category ?? []].flat();
  const categories = CATEGORIES.filter((c) => picked.includes(c));

  const today = todayInStateCollege();
  const weekEnd = addDays(today, 6);
  // Saved one-time posts can be further out than this week.
  const lastDay = view === "saved" ? addDays(today, 59) : weekEnd;
  const userId = user?.id ?? 0;

  // One row per post per day it happens. Repeating posts show on each matching day this week.
  // Pro businesses come first each day ("priority placement").
  const posts = await sql`
    WITH days AS (
      SELECT d::date AS day FROM generate_series(${today}::date, ${lastDay}::date, interval '1 day') AS d
    )
    SELECT posts.id, posts.business_id, posts.title, posts.description, posts.categories,
           posts.start_time, posts.end_time, posts.is_21_plus, posts.repeat_days, posts.image_url,
           posts.image_crop, to_char(days.day, 'YYYY-MM-DD') AS date,
           users.business_name, users.logo_url, users.logo_crop,
           (SELECT count(*)::int FROM likes WHERE likes.post_id = posts.id) AS likes,
           EXISTS (SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ${userId}) AS liked,
           EXISTS (SELECT 1 FROM saves WHERE saves.post_id = posts.id AND saves.user_id = ${userId}) AS saved,
           EXISTS (SELECT 1 FROM follows WHERE follows.business_id = posts.business_id
                   AND follows.user_id = ${userId}) AS following
    FROM posts
    JOIN users ON users.id = posts.business_id
    JOIN days ON (
      (cardinality(posts.repeat_days) = 0 AND posts.post_date = days.day)
      OR (cardinality(posts.repeat_days) > 0 AND posts.post_date <= days.day AND days.day <= ${weekEnd}::date
          AND extract(dow FROM days.day)::int = ANY(posts.repeat_days))
    )
    WHERE posts.is_public
      AND (cardinality(${categories}::text[]) = 0 OR posts.categories && ${categories}::text[])
      AND (${view} <> 'following' OR EXISTS (
            SELECT 1 FROM follows WHERE follows.business_id = posts.business_id AND follows.user_id = ${userId}))
      AND (${view} <> 'saved' OR EXISTS (
            SELECT 1 FROM saves WHERE saves.post_id = posts.id AND saves.user_id = ${userId}))
    ORDER BY days.day, (users.plan = 'pro') DESC, posts.start_time, posts.id`;

  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const postsByDay = new Map();
  for (const post of posts) {
    if (!postsByDay.has(post.date)) postsByDay.set(post.date, []);
    postsByDay.get(post.date).push(post);
  }

  return (
    <>
      <TopBar user={user} />
      <main className="container feed">
        {view === "following" ? (
          <>
            <h1>Places you follow</h1>
            <p className="muted">This week's specials and events from the businesses you follow.</p>
          </>
        ) : (
          <>
            <h1>This week in State College</h1>
            <p className="muted">Specials and events, posted by the businesses themselves.</p>
          </>
        )}

        {!user && (
          <div className="card joinbox">
            <p>
              <strong>Make this feed yours.</strong> Sign up for a free personal account to like posts, save the
              ones you want to go to, and follow your favorite spots.
            </p>
            <Link href="/signup?type=customer" className="button primary">Sign up free</Link>
          </div>
        )}

        {isCustomer && (
          <nav className="tabs" aria-label="Feed views">
            {VIEWS.map((v) => (
              <Link key={v.id} href={feedLink(v.id, categories)} className={v.id === view ? "active" : ""}>
                {v.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Tap a category to add it to the filter, tap again to remove it. "All" clears them. */}
        <nav className="chips" aria-label="Categories">
          <Link href={feedLink(view, [])} className={categories.length === 0 ? "active" : ""}>All</Link>
          {CATEGORIES.map((c) => {
            const on = categories.includes(c);
            return (
              <Link key={c} href={feedLink(view, toggled(categories, c))} className={on ? "active" : ""}
                aria-pressed={on}>
                {on && "✓ "}{c}
              </Link>
            );
          })}
        </nav>

        {view !== "saved" && (
          <nav className="datestrip" aria-label="Days this week">
            {days.map((day) => {
              const date = new Date(`${day}T12:00:00`);
              const count = postsByDay.get(day)?.length ?? 0;
              return (
                <a key={day} href={`#day-${day}`} className={count ? "" : "empty"}>
                  <span>{day === today ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" })}</span>
                  <strong>{date.getDate()}</strong>
                </a>
              );
            })}
          </nav>
        )}

        {posts.length === 0 && (
          <p className="muted emptyfeed">
            {view === "following" && "Follow a business and its posts will show up here."}
            {view === "saved" && "Save a post and it will show up here."}
            {view === "all" && "Nothing posted for this week yet. Check back soon."}
          </p>
        )}

        {[...postsByDay].map(([day, dayPosts]) => (
          <section key={day} id={`day-${day}`} className="day">
            <h2>{day === today ? `Today, ${formatDate(day)}` : formatDate(day)}</h2>
            {dayPosts.map((post) => (
              <PostCard key={`${post.id}-${day}`} post={post} user={user} />
            ))}
          </section>
        ))}
      </main>
    </>
  );
}
