import Link from "next/link";
import { redirect } from "next/navigation";
import DeleteAccountForm from "@/app/components/DeleteAccountForm";
import TopBar from "@/app/components/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { hasPaidPlan } from "@/lib/plans";

export const metadata = { title: "Delete account | Valley Brews" };

export default async function DeleteAccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const isBusiness = user.role === "business";

  return (
    <>
      <TopBar user={user} />
      <main className="container dashboard">
        <p>
          <Link href={isBusiness ? "/profile/edit" : "/feed"}>&larr; Back</Link>
        </p>
        <div className="card assistant">
          <h2>Delete my account</h2>
          <p>This can't be undone. Deleting <strong>{user.email}</strong> removes:</p>
          <ul className="deletelist">
            {isBusiness && <li>Your business page and all of your posts and photos</li>}
            <li>Your likes, saves, and the places you follow</li>
            {isBusiness && hasPaidPlan(user.plan) && <li>Your paid plan (it's canceled, so you won't be charged again)</li>}
          </ul>
          <DeleteAccountForm />
        </div>
      </main>
    </>
  );
}
