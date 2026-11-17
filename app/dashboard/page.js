import Link from "next/link";
import { redirect } from "next/navigation";
import { deletePost, togglePostVisibility } from "@/app/actions/posts";
import FramedImage from "@/app/components/FramedImage";
import TopBar from "@/app/components/TopBar";
import UpgradeButton from "@/app/components/UpgradeButton";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatDate, formatRepeat, formatTimes, todayInStateCollege } from "@/lib/format";
import { hasAI, hasPaidPlan, planName } from "@/lib/plans";

export const metadata = { title: "Posts | Valley Brews" };

// The Posts tab: manage the posts you've made. New Post and AI Assistant open their own pages.
export default async function DashboardPage({ searchParams }) {
  const { checkout } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "business") redirect("/feed");

  const today = todayInStateCollege();

  const [business] = await sql`
    SELECT business_name,
           (SELECT count(*)::int FROM follows WHERE follows.business_id = users.id) AS followers
    FROM users WHERE id = ${user.id}`;
  const posts = await sql`
    SELECT posts.id, posts.title, posts.categories, posts.start_time, posts.end_time, posts.is_21_plus,
           posts.repeat_days, posts.image_url, posts.image_crop, posts.is_public,
           to_char(posts.post_date, 'YYYY-MM-DD') AS date,
           (SELECT count(*)::int FROM likes WHERE likes.post_id = posts.id) AS likes,
           (SELECT count(*)::int FROM saves WHERE saves.post_id = posts.id) AS saves
    FROM posts
    WHERE business_id = ${user.id}
      AND (cardinality(repeat_days) > 0 OR post_date >= ${today})
    ORDER BY cardinality(repeat_days) = 0, post_date, start_time`;
  const { followers } = business;

  return (
    <>
      <TopBar user={user} />
      <main className="container dashboard">
        <h1>{business.business_name}</h1>
        <p className="muted">
          Logged in as {user.email} &middot; {planName(user.plan)} plan &middot; {followers}{" "}
          {followers === 1 ? "follower" : "followers"} &middot;{" "}
          <Link href={`/business/${user.id}`}>View my page</Link>
        </p>

        {checkout === "failed" && (
          <p className="error" role="alert">
            Payment couldn't start, so nothing was charged. Please try again in a minute.
          </p>
        )}

        {/* Your posts on the left; the New Post and AI Assistant buttons stay in view on the right. */}
        <div className="postslayout">
          <div>
            <div className="card assistant">
              <h2>Your posts</h2>
              {posts.length === 0 && (
                <p className="muted">Nothing posted yet. Tap New Post to write your first one.</p>
              )}
              <ul className="mylist">
                {posts.map((post) => {
                  const times = formatTimes(post.start_time, post.end_time);
                  return (
                    <li key={post.id}>
                      {post.image_url && (
                        <FramedImage src={post.image_url} crop={post.image_crop} frame="frame post thumb" />
                      )}
                      <div className="grow">
                        <strong>{post.title}</strong>
                        {!post.is_public && <span className="badge hidden">Hidden</span>}
                        <p className="muted">
                          {formatRepeat(post.repeat_days) || formatDate(post.date)}
                          {times && ` · ${times}`}
                          {" · "}{post.categories.join(", ")}{post.is_21_plus && " · 21+"}
                        </p>
                        <p className="muted">
                          {post.likes} {post.likes === 1 ? "like" : "likes"} &middot; {post.saves}{" "}
                          {post.saves === 1 ? "save" : "saves"}
                        </p>
                      </div>
                      <div className="postcontrols">
                        <form action={togglePostVisibility}>
                          <input type="hidden" name="postId" value={post.id} />
                          <button
                            type="submit"
                            className="toggle"
                            role="switch"
                            aria-checked={post.is_public}
                            aria-label={post.is_public ? "Shown on the feed. Click to hide." : "Hidden. Click to show."}
                          >
                            <span className="slider" aria-hidden="true" />
                            {post.is_public ? "Shown" : "Hidden"}
                          </button>
                        </form>
                        <Link href={`/dashboard/edit/${post.id}`}>Edit</Link>
                        <form action={deletePost}>
                          <input type="hidden" name="postId" value={post.id} />
                          <button type="submit" className="linkbutton danger">Delete</button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {!hasPaidPlan(user.plan) && (
              <div className="card assistant">
                <h2>Upgrade your plan</h2>
                <div className="planpick">
                  <div>
                    <h3>Plus</h3>
                    <p className="muted">Unlimited posts, and weekly specials that repeat on their own.</p>
                    <UpgradeButton plan="plus" label="Get Plus" />
                  </div>
                  <div>
                    <h3>Pro</h3>
                    <p className="muted">Everything in Plus, the AI specials assistant, and top spots in the feed.</p>
                    <UpgradeButton plan="pro" label="Get Pro" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="postactions" aria-label="Create a post">
            <Link href="/dashboard/new" className="button primary">+ New Post</Link>
            <Link href="/dashboard/assistant" className="button aibutton">
              AI Assistant{!hasAI(user.plan) && <span className="protag">Pro</span>}
            </Link>
          </aside>
        </div>
      </main>
    </>
  );
}
