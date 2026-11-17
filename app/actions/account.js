"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { endSession, getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { deleteImage } from "@/lib/images";
import { getStripe } from "@/lib/stripe";

// The class demo account must always work, so it can't be deleted.
const DEMO_EMAIL = "demo@demo.com";

// Deletes the logged-in account for good: its posts, likes, saves, follows, photos, and paid plan.
export async function deleteAccount(previousState, formData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.email === DEMO_EMAIL) return { error: "The demo account can't be deleted." };

  // Ask for the password again, so nobody can delete an account on a computer left logged in.
  const password = String(formData.get("password") ?? "");
  const [account] = await sql`
    SELECT password_hash, stripe_subscription_id, logo_url, banner_url FROM users WHERE id = ${user.id}`;
  if (!(await bcrypt.compare(password, account.password_hash))) {
    return { error: "That password isn't right." };
  }

  // Stop the monthly charge first. If Stripe can't be reached, keep the account so they aren't billed for nothing.
  if (account.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.cancel(account.stripe_subscription_id);
    } catch (error) {
      if (error.code !== "resource_missing") {
        console.error("Couldn't cancel subscription:", error.message);
        return { error: "We couldn't cancel your paid plan, so nothing was deleted. Please try again in a minute." };
      }
    }
  }

  const posts = await sql`SELECT image_url FROM posts WHERE business_id = ${user.id}`;

  // Deleting the user also deletes their posts, likes, saves, follows, and logins (the tables are linked).
  await endSession();
  await sql`DELETE FROM users WHERE id = ${user.id}`;

  for (const url of [account.logo_url, account.banner_url, ...posts.map((post) => post.image_url)]) {
    await deleteImage(url);
  }

  redirect("/?deleted=1");
}
