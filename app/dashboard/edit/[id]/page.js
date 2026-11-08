import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PostForm from "@/app/components/PostForm";
import TopBar from "@/app/components/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { todayInStateCollege } from "@/lib/format";
import { hasPaidPlan } from "@/lib/plans";

export const metadata = { title: "Edit post | Valley Brews" };

export default async function EditPostPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "business") redirect("/feed");

  const { id } = await params;
  // Only the business that wrote the post can edit it.
  const [post] = await sql`
    SELECT id, title, description, category, start_time, end_time, is_21_plus, repeat_days, image_url,
           is_public, to_char(post_date, 'YYYY-MM-DD') AS date
    FROM posts WHERE id = ${Number(id) || 0} AND business_id = ${user.id}`;
  if (!post) notFound();

  return (
    <>
      <TopBar user={user} />
      <main className="container dashboard">
        <p><Link href="/dashboard">&larr; Back to my posts</Link></p>
        <div className="card assistant">
          <h2>Edit post</h2>
          <PostForm initial={post} today={todayInStateCollege()} canRepeat={hasPaidPlan(user.plan)} />
        </div>
      </main>
    </>
  );
}
