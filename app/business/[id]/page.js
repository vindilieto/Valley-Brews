import Link from "next/link";
import { notFound } from "next/navigation";
import { toggleFollow } from "@/app/actions/feed";
import PostCard, { Logo } from "@/app/components/PostCard";
import TopBar from "@/app/components/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatDate, formatRepeat, todayInStateCollege } from "@/lib/format";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const [business] = await sql`
    SELECT business_name FROM users WHERE id = ${Number(id) || 0} AND role = 'business'`;
  return { title: business ? `${business.business_name} | Valley Brews` : "Valley Brews" };
}

export default async function BusinessPage({ params }) {
  const { id } = await params;
  const businessId = Number(id) || 0;
  const user = await getCurrentUser();
  const userId = user?.id ?? 0;

  const [business] = await sql`
    SELECT id, business_name, bio, address, hours, menu_url, logo_url,
           (SELECT count(*)::int FROM follows WHERE follows.business_id = users.id) AS followers,
           EXISTS (SELECT 1 FROM follows WHERE follows.business_id = users.id
                   AND follows.user_id = ${userId}) AS following
    FROM users
    WHERE id = ${businessId} AND role = 'business'`;
  if (!business) notFound();

  // Repeating posts first, then upcoming one-time posts by date.
  const posts = await sql`
    SELECT posts.id, posts.business_id, posts.title, posts.description, posts.category,
           posts.start_time, posts.end_time, posts.is_21_plus, posts.repeat_days, posts.image_url,
           to_char(posts.post_date, 'YYYY-MM-DD') AS date,
           (SELECT count(*)::int FROM likes WHERE likes.post_id = posts.id) AS likes,
           EXISTS (SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ${userId}) AS liked,
           EXISTS (SELECT 1 FROM saves WHERE saves.post_id = posts.id AND saves.user_id = ${userId}) AS saved
    FROM posts
    WHERE business_id = ${business.id}
      AND (cardinality(repeat_days) > 0 OR post_date >= ${todayInStateCollege()})
    ORDER BY cardinality(repeat_days) = 0, post_date, start_time`;

  const isCustomer = user?.role === "customer";
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`;

  return (
    <>
      <TopBar user={user} />
      <main className="container feed">
        <header className="profile">
          <Logo business={business} size="large" />
          <div>
            <h1>{business.business_name}</h1>
            <p className="muted">
              {business.followers} {business.followers === 1 ? "follower" : "followers"} &middot; {posts.length}{" "}
              {posts.length === 1 ? "post" : "posts"}
            </p>
            {user?.id === business.id && (
              <Link href="/dashboard#page" className="pill">Edit my page</Link>
            )}
            {isCustomer && (
              <form action={toggleFollow}>
                <input type="hidden" name="businessId" value={business.id} />
                <button type="submit" className={`pill ${business.following ? "on" : ""}`}>
                  {business.following ? "Following" : "Follow"}
                </button>
              </form>
            )}
          </div>
        </header>

        {business.bio && <p className="bio">{business.bio}</p>}

        <div className="card details">
          {business.address && (
            <p>
              <strong>Address</strong>
              <a href={mapLink} target="_blank" rel="noopener noreferrer">{business.address}</a>
            </p>
          )}
          {business.hours && (
            <p>
              <strong>Hours</strong>
              <span className="hours">{business.hours}</span>
            </p>
          )}
          {business.menu_url && (
            <p>
              <strong>Menu</strong>
              <a href={business.menu_url} target="_blank" rel="noopener noreferrer">See the menu</a>
            </p>
          )}
          {!business.address && !business.hours && !business.menu_url && (
            <p className="muted">This business hasn't added its details yet.</p>
          )}
        </div>

        <h2 className="sectiontitle">Posts</h2>
        {posts.length === 0 && <p className="muted">No upcoming posts right now.</p>}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            user={user}
            showBusiness={false}
            when={formatRepeat(post.repeat_days) || formatDate(post.date)}
          />
        ))}
      </main>
    </>
  );
}
