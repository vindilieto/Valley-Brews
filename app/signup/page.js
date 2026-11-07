import { redirect } from "next/navigation";
import AuthForm from "@/app/components/AuthForm";
import TopBar from "@/app/components/TopBar";
import { getCurrentUser, homeFor } from "@/lib/auth";

export const metadata = { title: "Sign up | Valley Brews" };

export default async function SignupPage({ searchParams }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));

  const { type } = await searchParams;

  return (
    <>
      <TopBar />
      <main className="authpage">
        <AuthForm mode="signup" startingRole={type === "customer" ? "customer" : "business"} />
      </main>
    </>
  );
}
