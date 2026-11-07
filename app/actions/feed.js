"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

// Likes, saves, and follows are for student and visitor accounts only.
async function getCustomer() {
  const user = await getCurrentUser();
  return user?.role === "customer" ? user : null;
}

export async function toggleLike(formData) {
  const user = await getCustomer();
  if (!user) return;
  const postId = Number(formData.get("postId"));

  const removed = await sql`DELETE FROM likes WHERE user_id = ${user.id} AND post_id = ${postId} RETURNING post_id`;
  if (removed.length === 0) {
    await sql`INSERT INTO likes (user_id, post_id) VALUES (${user.id}, ${postId}) ON CONFLICT DO NOTHING`;
  }
  revalidatePath("/feed");
}

export async function toggleSave(formData) {
  const user = await getCustomer();
  if (!user) return;
  const postId = Number(formData.get("postId"));

  const removed = await sql`DELETE FROM saves WHERE user_id = ${user.id} AND post_id = ${postId} RETURNING post_id`;
  if (removed.length === 0) {
    await sql`INSERT INTO saves (user_id, post_id) VALUES (${user.id}, ${postId}) ON CONFLICT DO NOTHING`;
  }
  revalidatePath("/feed");
}

export async function toggleFollow(formData) {
  const user = await getCustomer();
  if (!user) return;
  const businessId = Number(formData.get("businessId"));

  const removed = await sql`
    DELETE FROM follows WHERE user_id = ${user.id} AND business_id = ${businessId} RETURNING business_id`;
  if (removed.length === 0) {
    await sql`
      INSERT INTO follows (user_id, business_id)
      SELECT ${user.id}, id FROM users WHERE id = ${businessId} AND role = 'business'
      ON CONFLICT DO NOTHING`;
  }
  revalidatePath("/feed");
}
