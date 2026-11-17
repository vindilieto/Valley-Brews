"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { serializeCrop } from "@/lib/crop";
import { sql } from "@/lib/db";
import { checkImage, deleteImage, getImage, uploadImage } from "@/lib/images";

function text(formData, field) {
  return String(formData.get(field) ?? "").trim();
}

// Saves the details shown on a business's public page.
export async function saveProfile(previousState, formData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "business") return { error: "Please log in with a business account." };

  const businessName = text(formData, "businessName");
  const bio = text(formData, "bio");
  const address = text(formData, "address");
  const hours = text(formData, "hours");
  let menuUrl = text(formData, "menuUrl");
  const logo = getImage(formData, "logo");
  const logoCrop = serializeCrop(formData.get("logoCrop"));
  const banner = getImage(formData, "banner");
  const bannerCrop = serializeCrop(formData.get("bannerCrop"));
  const removeBanner = Boolean(formData.get("removeBanner"));

  if (!businessName || businessName.length > 80) return { error: "Please enter your business name (80 characters max)." };
  if (bio.length > 300) return { error: "Please keep your bio under 300 characters." };
  if (address.length > 200) return { error: "That address is too long." };
  if (hours.length > 300) return { error: "Please keep your hours under 300 characters." };
  if (menuUrl && !/^https?:\/\//i.test(menuUrl)) menuUrl = `https://${menuUrl}`;
  if (menuUrl) {
    try {
      new URL(menuUrl);
    } catch {
      return { error: "That menu link doesn't look right." };
    }
  }
  for (const image of [logo, banner]) {
    if (!image) continue;
    const imageError = checkImage(image);
    if (imageError) return { error: imageError };
  }

  let logoUrl = null;
  let bannerUrl = null;
  try {
    if (logo) logoUrl = await uploadImage(logo, "logos");
    if (banner) bannerUrl = await uploadImage(banner, "banners");
  } catch (error) {
    console.error("Photo upload failed:", error);
    return { error: "Your photo couldn't be uploaded. Please try again." };
  }
  // A new background replaces the old one; "Remove background" clears it.
  if (removeBanner && !banner) bannerUrl = "";

  const [old] = await sql`SELECT logo_url, banner_url FROM users WHERE id = ${user.id}`;
  await sql`
    UPDATE users
    SET business_name = ${businessName}, bio = ${bio}, address = ${address}, hours = ${hours},
        menu_url = ${menuUrl}, logo_url = COALESCE(${logoUrl}, logo_url), logo_crop = ${logoCrop},
        banner_url = COALESCE(${bannerUrl}, banner_url), banner_crop = ${bannerCrop}
    WHERE id = ${user.id}`;
  if (logoUrl) await deleteImage(old?.logo_url);
  if (bannerUrl !== null) await deleteImage(old?.banner_url);

  revalidatePath("/", "layout");
  return { saved: true, savedAt: Date.now() };
}
