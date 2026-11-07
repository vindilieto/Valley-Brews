"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { CATEGORIES, FREE_POST_LIMIT, todayInStateCollege } from "@/lib/format";

const TIME_PATTERN = /^\d{2}:\d{2}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function savePost(previousState, formData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "business") return { error: "Please log in with a business account." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = formData.get("endsAtClose") ? "close" : String(formData.get("endTime") ?? "");
  const is21Plus = Boolean(formData.get("is21Plus"));

  if (!title || title.length > 100) return { error: "Please give your post a title (100 characters max)." };
  if (!description || description.length > 1000) {
    return { error: "Please add a description (1,000 characters max)." };
  }
  if (!CATEGORIES.includes(category)) return { error: "Please pick a category." };
  if (!DATE_PATTERN.test(date)) return { error: "Please pick a date." };
  if (date < todayInStateCollege()) return { error: "That date has already passed." };
  if (startTime && !TIME_PATTERN.test(startTime)) return { error: "Please check the start time." };
  if (endTime && endTime !== "close" && !TIME_PATTERN.test(endTime)) {
    return { error: "Please check the end time." };
  }

  if (user.plan !== "pro") {
    const [{ upcoming }] = await sql`
      SELECT count(*)::int AS upcoming FROM posts
      WHERE business_id = ${user.id} AND post_date >= ${todayInStateCollege()}`;
    if (upcoming >= FREE_POST_LIMIT) {
      return { error: `Free accounts can have ${FREE_POST_LIMIT} upcoming posts. Upgrade to Pro for unlimited posts.` };
    }
  }

  await sql`
    INSERT INTO posts (business_id, title, description, category, post_date, start_time, end_time, is_21_plus)
    VALUES (${user.id}, ${title}, ${description}, ${category}, ${date}, ${startTime}, ${endTime}, ${is21Plus})`;

  revalidatePath("/dashboard");
  revalidatePath("/feed");
  return { saved: true };
}

export async function deletePost(formData) {
  const user = await getCurrentUser();
  if (!user) return;

  // Only the business that wrote the post can delete it.
  await sql`DELETE FROM posts WHERE id = ${Number(formData.get("postId"))} AND business_id = ${user.id}`;

  revalidatePath("/dashboard");
  revalidatePath("/feed");
}
