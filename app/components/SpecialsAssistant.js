"use client";

import { useActionState } from "react";
import { generatePost } from "@/app/actions/assistant";
import PostForm from "@/app/components/PostForm";

export default function SpecialsAssistant({ today }) {
  const [state, action, pending] = useActionState(generatePost, undefined);
  const post = state?.post;

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
          <h3>Check the details, then post it</h3>
          <p className="muted">The AI can guess dates wrong, so make sure everything looks right.</p>
          <PostForm key={JSON.stringify(post)} initial={post} today={today} />
          <h4>Instagram caption</h4>
          <p>{post.instagram_caption}</p>
          <h4>Text message</h4>
          <p>{post.text_message}</p>
        </div>
      )}
    </div>
  );
}
