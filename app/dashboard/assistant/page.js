import Link from "next/link";
import { redirect } from "next/navigation";
import SpecialsAssistant from "@/app/components/SpecialsAssistant";
import TopBar from "@/app/components/TopBar";
import UpgradeButton from "@/app/components/UpgradeButton";
import { getCurrentUser } from "@/lib/auth";
import { todayInStateCollege } from "@/lib/format";
import { hasAI } from "@/lib/plans";

export const metadata = { title: "AI Assistant | Valley Brews" };

export default async function AssistantPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "business") redirect("/feed");

  return (
    <>
      <TopBar user={user} />
      <main className="container dashboard">
        <p><Link href="/dashboard">&larr; Back to my posts</Link></p>
        {hasAI(user.plan) ? (
          <SpecialsAssistant today={todayInStateCollege()} />
        ) : (
          <div className="card assistant">
            <h2>AI specials assistant</h2>
            <p className="muted">
              Type a special the way you'd say it, like &ldquo;half off wings tuesday 9 til close, $3 wells&rdquo;,
              and get a finished post, an Instagram caption, and a text message in seconds.
            </p>
            <p className="muted">The AI assistant is part of the Pro plan.</p>
            <div className="upgrade"><UpgradeButton plan="pro" label="Upgrade to Pro" /></div>
          </div>
        )}
      </main>
    </>
  );
}
