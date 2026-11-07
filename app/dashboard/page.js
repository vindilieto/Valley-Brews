import { redirect } from "next/navigation";
import TopBar from "@/app/components/TopBar";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Dashboard | Valley Brews" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <TopBar user={user} />
      <main className="container dashboard">
        <h1>{user.business_name}</h1>
        <p className="muted">
          Logged in as {user.email} &middot; {user.plan === "pro" ? "Pro plan" : "Free plan"}
        </p>
      </main>
    </>
  );
}
