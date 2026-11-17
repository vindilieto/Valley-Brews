"use client";

import { useRef, useState } from "react";
import { cropStyle, DEFAULT_CROP, MAX_ZOOM, parseCrop, serializeCrop } from "@/lib/crop";

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

// Picks a photo and lets the business choose how it sits in its frame:
// drag to move it, slide to zoom, or (for posts) show the whole photo.
// The choice is sent with the form as "<name>Crop"; the photo itself is never cut.
export default function PhotoInput({
  name, label, maxSize = 1600, current = "", currentCrop = "", frame = "frame post", allowFit = false,
}) {
  const [preview, setPreview] = useState(current);
  const [crop, setCrop] = useState(() => parseCrop(currentCrop));
  const [error, setError] = useState("");
  const frameRef = useRef(null);
  const imageRef = useRef(null);
  const drag = useRef(null);

  async function handleChange(event) {
    const input = event.target;
    const file = input.files[0];
    setError("");
    if (!file) {
      setPreview(current);
      setCrop(parseCrop(currentCrop));
      return;
    }
    try {
      const small = await shrink(file, maxSize);
      // Swap the original file for the smaller one before the form is sent.
      const files = new DataTransfer();
      files.items.add(small);
      input.files = files.files;
      setPreview(URL.createObjectURL(small));
      setCrop(DEFAULT_CROP);
    } catch {
      input.value = "";
      setPreview(current);
      setError("That file doesn't look like a photo. Please pick a JPG or PNG.");
    }
  }

  function startDrag(event) {
    const image = imageRef.current;
    if (crop.fit || !image?.naturalWidth) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startX: event.clientX, startY: event.clientY, startCrop: crop };
  }

  function moveDrag(event) {
    if (!drag.current) return;
    const { startX, startY, startCrop } = drag.current;
    const { width, height } = frameRef.current.getBoundingClientRect();
    const image = imageRef.current;
    // How big the photo is drawn once it fills the frame, before zooming.
    const ratio = image.naturalWidth / image.naturalHeight;
    const fillWidth = Math.max(width, height * ratio);
    const fillHeight = Math.max(height, width / ratio);
    // How far the photo can slide in each direction. Moving the photo right shows more of its left side.
    const slackX = fillWidth * startCrop.zoom - width;
    const slackY = fillHeight * startCrop.zoom - height;
    const x = slackX > 0 ? startCrop.x - ((event.clientX - startX) / slackX) * 100 : startCrop.x;
    const y = slackY > 0 ? startCrop.y - ((event.clientY - startY) / slackY) * 100 : startCrop.y;
    setCrop(parseCrop({ ...startCrop, x, y }));
  }

  function endDrag() {
    drag.current = null;
  }

  return (
    <div className="photoinput">
      <label>
        {label}
        <input name={name} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} />
      </label>
      {error && <span className="error">{error}</span>}

      {preview && (
        <div className="photoeditor">
          <div
            ref={frameRef}
            className={`${frame} editable ${crop.fit ? "" : "draggable"}`}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <img ref={imageRef} src={preview} alt="" style={cropStyle(crop)} draggable={false} />
          </div>
          <p className="muted hint">
            {crop.fit ? "The whole photo will show." : "Drag the photo to choose what shows. Use the slider to zoom."}
          </p>
          <div className="cropcontrols">
            <label className="zoom">
              Zoom
              <input
                type="range"
                min={1}
                max={MAX_ZOOM}
                step={0.01}
                value={crop.zoom}
                disabled={crop.fit}
                onChange={(event) => setCrop(parseCrop({ ...crop, zoom: event.target.value }))}
              />
            </label>
            {allowFit && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={crop.fit}
                  onChange={(event) => setCrop(parseCrop({ ...crop, fit: event.target.checked }))}
                />
                Show the whole photo
              </label>
            )}
            <button type="button" className="linkbutton" onClick={() => setCrop(DEFAULT_CROP)}>Reset</button>
          </div>
          <input type="hidden" name={`${name}Crop`} value={serializeCrop(crop)} />
        </div>
      )}
    </div>
  );
}
