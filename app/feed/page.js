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

function feedLink(view, category) {
  const params = new URLSearchParams();
  if (view !== "all") params.set("view", view);
  if (category) params.set("category", category);
  const query = params.toString();
  return query ? `/feed?${query}` : "/feed";
}

export default async function FeedPage({ searchParams }) {
  const user = await getCurrentUser();
  const isCustomer = user?.role === "customer";
  const params = await searchParams;
  const view = isCustomer && VIEWS.some((v) => v.id === params.view) ? params.view : "all";
  const category = CATEGORIES.includes(params.category) ? params.category : "";

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
    SELECT posts.id, posts.business_id, posts.title, posts.description, posts.category,
           posts.start_time, posts.end_time, posts.is_21_plus, posts.repeat_days, posts.image_url,
           to_char(days.day, 'YYYY-MM-DD') AS date,
           users.business_name, users.logo_url,
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
      AND (${category} = '' OR posts.category = ${category})
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
              <Link key={v.id} href={feedLink(v.id, category)} className={v.id === view ? "active" : ""}>
                {v.label}
              </Link>
            ))}
          </nav>
        )}

        <nav className="chips" aria-label="Categories">
          <Link href={feedLink(view, "")} className={!category ? "active" : ""}>All</Link>
          {CATEGORIES.map((c) => (
            <Link key={c} href={feedLink(view, c)} className={c === category ? "active" : ""}>{c}</Link>
          ))}
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
