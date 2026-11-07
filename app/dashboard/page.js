import { redirect } from "next/navigation";
import SpecialsAssistant from "@/app/components/SpecialsAssistant";
import TopBar from "@/app/components/TopBar";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Dashboard | Valley Brews" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isPro = user.plan === "pro";

  return (
    <>
      <TopBar user={user} />
      <main className="container dashboard">
        <h1>{user.business_name}</h1>
        <p className="muted">
          Logged in as {user.email} &middot; {isPro ? "Pro plan" : "Free plan"}
        </p>
        {isPro ? (
          <SpecialsAssistant />
        ) : (
          <div className="card assistant">
            <h2>AI specials assistant</h2>
            <p className="muted">Upgrade to Pro to turn a rough note into a finished post in seconds.</p>
          </div>
        )}
      </main>
    </>
  );
}
