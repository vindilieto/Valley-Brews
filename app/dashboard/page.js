import { redirect } from "next/navigation";
import { startCheckout } from "@/app/actions/billing";
import { deletePost } from "@/app/actions/posts";
import PostForm from "@/app/components/PostForm";
import SpecialsAssistant from "@/app/components/SpecialsAssistant";
import TopBar from "@/app/components/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatDate, formatTimes, FREE_POST_LIMIT, todayInStateCollege } from "@/lib/format";

export const metadata = { title: "Dashboard | Valley Brews" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "business") redirect("/feed");

  const isPro = user.plan === "pro";
  const today = todayInStateCollege();

  const posts = await sql`
    SELECT posts.id, posts.title, posts.category, posts.start_time, posts.end_time, posts.is_21_plus,
           to_char(posts.post_date, 'YYYY-MM-DD') AS date,
           (SELECT count(*)::int FROM likes WHERE likes.post_id = posts.id) AS likes,
           (SELECT count(*)::int FROM saves WHERE saves.post_id = posts.id) AS saves
    FROM posts
    WHERE business_id = ${user.id} AND post_date >= ${today}
    ORDER BY post_date, start_time`;
  const [{ followers }] = await sql`
    SELECT count(*)::int AS followers FROM follows WHERE business_id = ${user.id}`;

  return (
    <>
      <TopBar user={user} />
      <main className="container dashboard">
        <h1>{user.business_name}</h1>
        <p className="muted">
          Logged in as {user.email} &middot; {isPro ? "Pro plan" : "Free plan"} &middot;{" "}
          {followers} {followers === 1 ? "follower" : "followers"}
        </p>

        {isPro ? (
          <SpecialsAssistant today={today} />
        ) : (
          <div className="card assistant">
            <h2>AI specials assistant</h2>
            <p className="muted">Upgrade to Pro to turn a rough note into a finished post in seconds.</p>
            <form action={startCheckout} className="upgrade">
              <button className="button primary" type="submit">Upgrade to Pro: $35/month</button>
            </form>
          </div>
        )}

        <div className="card assistant">
          <h2>Write a post yourself</h2>
          {!isPro && (
            <p className="muted">Free accounts can have up to {FREE_POST_LIMIT} upcoming posts.</p>
          )}
          <PostForm today={today} />
        </div>

        <div className="card assistant">
          <h2>Your upcoming posts</h2>
          {posts.length === 0 && <p className="muted">Nothing posted yet. Your posts will show here and on the feed.</p>}
          <ul className="mylist">
            {posts.map((post) => (
              <li key={post.id}>
                <div>
                  <strong>{post.title}</strong>
                  <p className="muted">
                    {formatDate(post.date)}
                    {formatTimes(post.start_time, post.end_time) && ` · ${formatTimes(post.start_time, post.end_time)}`}
                    {" · "}{post.category}{post.is_21_plus && " · 21+"}
                  </p>
                  <p className="muted">
                    {post.likes} {post.likes === 1 ? "like" : "likes"} &middot; {post.saves}{" "}
                    {post.saves === 1 ? "save" : "saves"}
                  </p>
                </div>
                <form action={deletePost}>
                  <input type="hidden" name="postId" value={post.id} />
                  <button type="submit" className="linkbutton danger">Delete</button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
