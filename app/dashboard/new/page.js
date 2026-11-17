import Link from "next/link";
import { redirect } from "next/navigation";
import PostForm from "@/app/components/PostForm";
import TopBar from "@/app/components/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { FREE_POST_LIMIT, todayInStateCollege } from "@/lib/format";
import { hasPaidPlan } from "@/lib/plans";

export const metadata = { title: "New post | Valley Brews" };

export default async function NewPostPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "business") redirect("/feed");

  const canRepeat = hasPaidPlan(user.plan);

  return (
    <>
      <TopBar user={user} />
      <main className="container dashboard">
        <p><Link href="/dashboard">&larr; Back to my posts</Link></p>
        <div className="card assistant">
          <h2>New post</h2>
          {!canRepeat && (
            <p className="muted">Free accounts can have up to {FREE_POST_LIMIT} upcoming posts.</p>
          )}
          <PostForm today={todayInStateCollege()} canRepeat={canRepeat} />
        </div>
      </main>
    </>
  );
}
