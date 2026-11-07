"use client";

import { useState } from "react";

// Phone photos can be 10 MB+. Shrink them in the browser so uploads are quick.
async function shrink(file, maxSize) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

export default function PhotoInput({ name, label, maxSize = 1600, current = "", round = false }) {
  const [preview, setPreview] = useState(current);
  const [error, setError] = useState("");

  async function handleChange(event) {
    const input = event.target;
    const file = input.files[0];
    setError("");
    if (!file) {
      setPreview(current);
      return;
    }
    try {
      const small = await shrink(file, maxSize);
      // Swap the original file for the smaller one before the form is sent.
      const files = new DataTransfer();
      files.items.add(small);
      input.files = files.files;
      setPreview(URL.createObjectURL(small));
    } catch {
      input.value = "";
      setPreview(current);
      setError("That file doesn't look like a photo. Please pick a JPG or PNG.");
    }
  }

  return (
    <label className="photoinput">
      {label}
      {preview && <img src={preview} alt="" className={round ? "preview round" : "preview"} />}
      <input name={name} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} />
      {error && <span className="error">{error}</span>}
    </label>
  );
}
