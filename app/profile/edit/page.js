import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileForm from "@/app/components/ProfileForm";
import TopBar from "@/app/components/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export const metadata = { title: "Edit my page | Valley Brews" };

// Where a business edits its public page (opened from the Profile tab), kept apart from posting.
export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "business") redirect("/feed");

  const [business] = await sql`
    SELECT business_name, bio, address, hours, menu_url, logo_url, logo_crop, banner_url, banner_crop
    FROM users WHERE id = ${user.id}`;

  return (
    <>
      <TopBar user={user} />
      <main className="container dashboard">
        <p><Link href={`/business/${user.id}`}>&larr; Back to my page</Link></p>
        <div className="card assistant">
          <h2>Edit my page</h2>
          <p className="muted">This is what people see when they tap your name on the feed.</p>
          <ProfileForm business={business} />
        </div>
      </main>
    </>
  );
}
