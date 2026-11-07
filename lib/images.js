import { del, put } from "@vercel/blob";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 3 * 1024 * 1024;

// Returns the uploaded file from a form, or null if none was picked.
export function getImage(formData, field) {
  const file = formData.get(field);
  return file && typeof file === "object" && file.size > 0 ? file : null;
}

export function checkImage(file) {
  if (!IMAGE_TYPES.includes(file.type)) return "Photos must be JPG, PNG, or WebP.";
  if (file.size > MAX_BYTES) return "That photo is too big. Please pick one under 3 MB.";
  if (!process.env.BLOB_READ_WRITE_TOKEN) return "Photo uploads aren't set up yet.";
  return null;
}

// Stores the photo in Vercel Blob and returns its public web address.
export async function uploadImage(file, folder) {
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const blob = await put(`${folder}/photo.${extension}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
  });
  return blob.url;
}

export async function deleteImage(url) {
  if (!url) return;
  try {
    await del(url);
  } catch (error) {
    console.error("Couldn't delete photo:", error.message);
  }
}
