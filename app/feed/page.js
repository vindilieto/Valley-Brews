import Link from "next/link";
import { toggleFollow, toggleLike, toggleSave } from "@/app/actions/feed";
import TopBar from "@/app/components/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { CATEGORIES, formatDate, formatTimes, todayInStateCollege } from "@/lib/format";

export const metadata = { title: "This week | Valley Brews" };

const VIEWS = [
  { id: "all", label: "Everything" },
  { id: "following", label: "Following" },
  { id: "saved", label: "Saved" },
];

function addDays(date, days) {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

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
  const lastDay = addDays(today, 6);
  const userId = user?.id ?? 0;

  // This week's posts. Saved posts show even if they're further out.
  // Pro businesses come first each day ("priority placement").
  const posts = await sql`
    SELECT posts.id, posts.business_id, posts.title, posts.description, posts.category,
           posts.start_time, posts.end_time, posts.is_21_plus,
           to_char(posts.post_date, 'YYYY-MM-DD') AS date,
           users.business_name,
           (SELECT count(*)::int FROM likes WHERE likes.post_id = posts.id) AS likes,
           EXISTS (SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ${userId}) AS liked,
           EXISTS (SELECT 1 FROM saves WHERE saves.post_id = posts.id AND saves.user_id = ${userId}) AS saved,
           EXISTS (SELECT 1 FROM follows WHERE follows.business_id = posts.business_id
                   AND follows.user_id = ${userId}) AS following
    FROM posts
    JOIN users ON users.id = posts.business_id
    WHERE posts.post_date >= ${today}
      AND (${view} = 'saved' OR posts.post_date <= ${lastDay})
      AND (${category} = '' OR posts.category = ${category})
      AND (${view} <> 'following' OR EXISTS (
            SELECT 1 FROM follows WHERE follows.business_id = posts.business_id AND follows.user_id = ${userId}))
      AND (${view} <> 'saved' OR EXISTS (
            SELECT 1 FROM saves WHERE saves.post_id = posts.id AND saves.user_id = ${userId}))
    ORDER BY posts.post_date, (users.plan = 'pro') DESC, posts.start_time, posts.id`;

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
        <h1>This week in State College</h1>
        <p className="muted">Specials and events, posted by the businesses themselves.</p>

        {!user && (
          <div className="card joinbox">
            <p>
              <strong>Make this feed yours.</strong> Sign up free to like posts, save the ones you want to go to,
              and follow your favorite spots.
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
            {dayPosts.map((post) => {
              const times = formatTimes(post.start_time, post.end_time);
              return (
                <article key={post.id} className="card post">
                  <div className="posthead">
                    <span className="business">{post.business_name}</span>
                    {isCustomer && (
                      <form action={toggleFollow}>
                        <input type="hidden" name="businessId" value={post.business_id} />
                        <button type="submit" className={`pill ${post.following ? "on" : ""}`}>
                          {post.following ? "Following" : "Follow"}
                        </button>
                      </form>
                    )}
                  </div>
                  <h3>{post.title}</h3>
                  <p className="meta">
                    {times && `${times} · `}{post.category}
                    {post.is_21_plus && <span className="badge">21+</span>}
                  </p>
                  <p>{post.description}</p>
                  <div className="actions">
                    {isCustomer ? (
                      <>
                        <form action={toggleLike}>
                          <input type="hidden" name="postId" value={post.id} />
                          <button type="submit" className={`pill ${post.liked ? "on" : ""}`}
                            aria-label={post.liked ? "Unlike" : "Like"}>
                            {post.liked ? "♥" : "♡"} {post.likes}
                          </button>
                        </form>
                        <form action={toggleSave}>
                          <input type="hidden" name="postId" value={post.id} />
                          <button type="submit" className={`pill ${post.saved ? "on" : ""}`}>
                            {post.saved ? "Saved" : "Save"}
                          </button>
                        </form>
                      </>
                    ) : user ? (
                      <span className="muted">♡ {post.likes}</span>
                    ) : (
                      <Link href="/signup?type=customer" className="pill">♡ {post.likes}</Link>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        ))}
      </main>
    </>
  );
}
