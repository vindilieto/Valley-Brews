"use client";

import { useActionState } from "react";
import { generatePost } from "@/app/actions/assistant";

function formatTime(time) {
  if (!time) return "";
  if (time === "close") return "close";
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  return minutes ? `${hour}:${String(minutes).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
}

function formatTimes(start, end) {
  if (start && end) return `${formatTime(start)} to ${formatTime(end)}`;
  if (end) return `until ${formatTime(end)}`;
  return formatTime(start);
}

function formatDate(date) {
  // Noon keeps the date from slipping a day in other time zones.
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function SpecialsAssistant() {
  const [state, action, pending] = useActionState(generatePost, undefined);
  const post = state?.post;
  const times = post ? formatTimes(post.start_time, post.end_time) : "";

  return (
    <div className="card assistant">
      <h2>AI specials assistant</h2>
      <form action={action}>
        <label htmlFor="note">Type your special the way you'd say it</label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={500}
          placeholder="half off wings tuesday 9 til close, $3 wells"
          required
        />
        {state?.error && <p className="error" role="alert">{state.error}</p>}
        <button className="button primary" type="submit" disabled={pending}>
          {pending ? "Writing..." : "Write my post"}
        </button>
      </form>

      {post && (
        <div className="result">
          <h3>{post.title}</h3>
          <p className="muted">
            {formatDate(post.date)}{times && ` · ${times}`} · {post.category}
            {post.is_21_plus && " · 21+"}
          </p>
          <p>{post.description}</p>
          <h4>Instagram caption</h4>
          <p>{post.instagram_caption}</p>
          <h4>Text message</h4>
          <p>{post.text_message}</p>
        </div>
      )}
    </div>
  );
}
