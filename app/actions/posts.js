"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { CATEGORIES, FREE_POST_LIMIT, todayInStateCollege } from "@/lib/format";
import { checkImage, deleteImage, getImage, uploadImage } from "@/lib/images";
import { hasPaidPlan } from "@/lib/plans";

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
  const repeatDays = [...new Set(formData.getAll("repeatDays").map(Number))]
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  const image = getImage(formData, "image");
  const removeImage = Boolean(formData.get("removeImage"));
  const isPublic = Boolean(formData.get("isPublic"));
  const today = todayInStateCollege();

  // Editing an existing post? Make sure it belongs to this business.
  const postId = Number(formData.get("postId")) || 0;
  let existing = null;
  if (postId) {
    [existing] = await sql`
      SELECT to_char(post_date, 'YYYY-MM-DD') AS date, image_url FROM posts
      WHERE id = ${postId} AND business_id = ${user.id}`;
    if (!existing) return { error: "We couldn't find that post." };
  }

  if (!title || title.length > 100) return { error: "Please give your post a title (100 characters max)." };
  if (!description || description.length > 1000) {
    return { error: "Please add a description (1,000 characters max)." };
  }
  if (!CATEGORIES.includes(category)) return { error: "Please pick a category." };
  if (!DATE_PATTERN.test(date)) return { error: "Please pick a date." };
  // An edited post can keep its original date (a weekly special may have started weeks ago).
  if (date < today && date !== existing?.date) return { error: "That date has already passed." };
  if (startTime && !TIME_PATTERN.test(startTime)) return { error: "Please check the start time." };
  if (endTime && endTime !== "close" && !TIME_PATTERN.test(endTime)) {
    return { error: "Please check the end time." };
  }
  if (repeatDays.length > 0 && !hasPaidPlan(user.plan)) {
    return { error: "Repeating posts are part of the Plus and Pro plans." };
  }
  if (image) {
    const imageError = checkImage(image);
    if (imageError) return { error: imageError };
  }

  if (!existing && !hasPaidPlan(user.plan)) {
    const [{ upcoming }] = await sql`
      SELECT count(*)::int AS upcoming FROM posts
      WHERE business_id = ${user.id} AND post_date >= ${today}`;
    if (upcoming >= FREE_POST_LIMIT) {
      return { error: `Free accounts can have ${FREE_POST_LIMIT} upcoming posts. Upgrade to Plus for unlimited posts.` };
    }
  }

  // Keep the old photo unless a new one was picked or "Remove photo" was ticked.
  let imageUrl = removeImage ? "" : (existing?.image_url ?? "");
  if (image) {
    try {
      imageUrl = await uploadImage(image, "posts");
    } catch (error) {
      console.error("Photo upload failed:", error);
      return { error: "Your photo couldn't be uploaded. Please try again." };
    }
  }

  if (existing) {
    await sql`
      UPDATE posts SET title = ${title}, description = ${description}, category = ${category},
             post_date = ${date}, start_time = ${startTime}, end_time = ${endTime}, is_21_plus = ${is21Plus},
             repeat_days = ${repeatDays}, image_url = ${imageUrl}, is_public = ${isPublic}
      WHERE id = ${postId} AND business_id = ${user.id}`;
    if (existing.image_url !== imageUrl) await deleteImage(existing.image_url);
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  await sql`
    INSERT INTO posts (business_id, title, description, category, post_date, start_time, end_time,
                       is_21_plus, repeat_days, image_url, is_public)
    VALUES (${user.id}, ${title}, ${description}, ${category}, ${date}, ${startTime}, ${endTime},
            ${is21Plus}, ${repeatDays}, ${imageUrl}, ${isPublic})`;

  revalidatePath("/", "layout");
  return { saved: true, savedAt: Date.now(), isPublic };
}

// The Show/Hide switch on the Posts page.
export async function togglePostVisibility(formData) {
  const user = await getCurrentUser();
  if (!user) return;

  await sql`
    UPDATE posts SET is_public = NOT is_public
    WHERE id = ${Number(formData.get("postId"))} AND business_id = ${user.id}`;

  revalidatePath("/", "layout");
}

export async function deletePost(formData) {
  const user = await getCurrentUser();
  if (!user) return;

  // Only the business that wrote the post can delete it.
  const deleted = await sql`
    DELETE FROM posts WHERE id = ${Number(formData.get("postId"))} AND business_id = ${user.id}
    RETURNING image_url`;
  if (deleted[0]) await deleteImage(deleted[0].image_url);

  revalidatePath("/", "layout");
}
