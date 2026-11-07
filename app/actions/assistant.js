"use server";

import { getCurrentUser } from "@/lib/auth";
import { writePost } from "@/lib/assistant";

const MAX_NOTE_LENGTH = 500;

export async function generatePost(previousState, formData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in again." };
  if (user.plan !== "pro") return { error: "The AI assistant is part of the Pro plan." };

  const note = String(formData.get("note") ?? "").trim();
  if (!note) return { error: "Type a quick note about your special first." };
  if (note.length > MAX_NOTE_LENGTH) {
    return { error: `Please keep your note under ${MAX_NOTE_LENGTH} characters.` };
  }

  try {
    return { post: await writePost(note) };
  } catch (error) {
    console.error("AI assistant failed:", error);
    return { error: "The assistant couldn't write that one. Please try again." };
  }
}
