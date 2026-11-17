import { cropStyle } from "@/lib/crop";

// A photo shown in a frame, placed the way the business set it up in the photo editor.
// `frame` is the CSS class that sets the frame's shape, such as "frame post" or "frame logo".
export default function FramedImage({ src, crop, frame, alt = "" }) {
  return (
    <div className={frame}>
      <img src={src} alt={alt} style={cropStyle(crop)} />
    </div>
  );
}
