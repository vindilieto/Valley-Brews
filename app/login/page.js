import { redirect } from "next/navigation";
import AuthForm from "@/app/components/AuthForm";
import TopBar from "@/app/components/TopBar";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Log in | Valley Brews" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <>
      <TopBar />
      <main className="authpage">
        <AuthForm mode="login" />
      </main>
    </>
  );
}
