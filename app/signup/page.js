import { redirect } from "next/navigation";
import AuthForm from "@/app/components/AuthForm";
import TopBar from "@/app/components/TopBar";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Sign up | Valley Brews" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <>
      <TopBar />
      <main className="authpage">
        <AuthForm mode="signup" />
      </main>
    </>
  );
}
