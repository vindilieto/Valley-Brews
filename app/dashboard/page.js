import Link from "next/link";
import { redirect } from "next/navigation";
import { startCheckout } from "@/app/actions/billing";
import { deletePost, togglePostVisibility } from "@/app/actions/posts";
import PostForm from "@/app/components/PostForm";
import ProfileForm from "@/app/components/ProfileForm";
import SpecialsAssistant from "@/app/components/SpecialsAssistant";
import TopBar from "@/app/components/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatDate, formatRepeat, formatTimes, FREE_POST_LIMIT, todayInStateCollege } from "@/lib/format";
import { hasAI, hasPaidPlan, isUpgrade, PAID_PLANS, planName } from "@/lib/plans";

export const metadata = { title: "Posts | Valley Brews" };

function UpgradeButton({ plan, label }) {
  return (
    <form action={startCheckout}>
      <input type="hidden" name="plan" value={plan} />
      <button className="button primary" type="submit">
        {label}: ${PAID_PLANS[plan].cents / 100}/month
      </button>
    </form>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "business") redirect("/feed");

  const today = todayInStateCollege();
  const canRepeat = hasPaidPlan(user.plan);

  const [business] = await sql`
    SELECT business_name, bio, address, hours, menu_url, logo_url,
           (SELECT count(*)::int FROM follows WHERE follows.business_id = users.id) AS followers
    FROM users WHERE id = ${user.id}`;
  const posts = await sql`
    SELECT posts.id, posts.title, posts.category, posts.start_time, posts.end_time, posts.is_21_plus,
           posts.repeat_days, posts.image_url, posts.is_public,
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

        {!canRepeat && (
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

        {hasAI(user.plan) ? (
          <SpecialsAssistant today={today} />
        ) : (
          canRepeat && (
            <div className="card assistant">
              <h2>AI specials assistant</h2>
              <p className="muted">Upgrade to Pro to turn a rough note into a finished post in seconds.</p>
              {isUpgrade(user.plan, "pro") && (
                <div className="upgrade"><UpgradeButton plan="pro" label="Upgrade to Pro" /></div>
              )}
            </div>
          )
        )}

        <div className="card assistant">
          <h2>Write a post yourself</h2>
          {!canRepeat && (
            <p className="muted">Free accounts can have up to {FREE_POST_LIMIT} upcoming posts.</p>
          )}
          <PostForm today={today} canRepeat={canRepeat} />
        </div>

        <div className="card assistant">
          <h2>Your posts</h2>
          {posts.length === 0 && <p className="muted">Nothing posted yet. Your posts will show here, and on the feed unless you hide them.</p>}
          <ul className="mylist">
            {posts.map((post) => {
              const times = formatTimes(post.start_time, post.end_time);
              return (
                <li key={post.id}>
                  {post.image_url && <img src={post.image_url} alt="" className="thumb" />}
                  <div className="grow">
                    <strong>{post.title}</strong>
                    {!post.is_public && <span className="badge hidden">Hidden</span>}
                    <p className="muted">
                      {formatRepeat(post.repeat_days) || formatDate(post.date)}
                      {times && ` · ${times}`}
                      {" · "}{post.category}{post.is_21_plus && " · 21+"}
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
                        className="switch"
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

        <div className="card assistant" id="page">
          <h2>Your business page</h2>
          <p className="muted">This is what students see when they tap your name on the feed.</p>
          <ProfileForm business={business} />
        </div>
      </main>
    </>
  );
}
