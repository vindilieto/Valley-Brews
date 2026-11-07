import Link from "next/link";
import { toggleFollow, toggleLike, toggleSave } from "@/app/actions/feed";
import { formatRepeat, formatTimes } from "@/lib/format";

export function Logo({ business, size = "small" }) {
  if (business.logo_url) {
    return <img src={business.logo_url} alt="" className={`logo-img ${size}`} />;
  }
  return <span className={`logo-img ${size} letter`}>{business.business_name?.[0] ?? "?"}</span>;
}

// One post, as shown on the feed and on business pages.
// `when` is extra text before the time, such as the date on a business page.
export default function PostCard({ post, user, showBusiness = true, when = "" }) {
  const isCustomer = user?.role === "customer";
  const times = formatTimes(post.start_time, post.end_time);
  const repeat = formatRepeat(post.repeat_days);
  const meta = [when, times, post.category].filter(Boolean).join(" · ");

  return (
    <article className="card post">
      {showBusiness && (
        <div className="posthead">
          <Link href={`/business/${post.business_id}`} className="business">
            <Logo business={post} />
            {post.business_name}
          </Link>
          {isCustomer && (
            <form action={toggleFollow}>
              <input type="hidden" name="businessId" value={post.business_id} />
              <button type="submit" className={`pill ${post.following ? "on" : ""}`}>
                {post.following ? "Following" : "Follow"}
              </button>
            </form>
          )}
        </div>
      )}
      {post.image_url && <img src={post.image_url} alt="" className="postphoto" />}
      <h3>{post.title}</h3>
      <p className="meta">
        {meta}
        {repeat && !when && <span className="badge repeat">{repeat}</span>}
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
}
