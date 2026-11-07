"use client";

import { useActionState } from "react";
import { savePost } from "@/app/actions/posts";
import { CATEGORIES } from "@/lib/format";

// The form businesses use to publish a post. The AI assistant can fill it in first.
export default function PostForm({ initial = {}, today }) {
  const [state, action, pending] = useActionState(savePost, undefined);

  return (
    <form action={action} className="postform">
      <label>
        Title
        <input name="title" type="text" maxLength={100} defaultValue={initial.title} required />
      </label>
      <label>
        Description
        <textarea name="description" rows={3} maxLength={1000} defaultValue={initial.description} required />
      </label>
      <div className="row">
        <label>
          Date
          <input name="date" type="date" min={today} defaultValue={initial.date} required />
        </label>
        <label>
          Category
          <select name="category" defaultValue={initial.category ?? "Specials"}>
            {CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="row">
        <label>
          Starts (optional)
          <input name="startTime" type="time" defaultValue={initial.start_time} />
        </label>
        <label>
          Ends (optional)
          <input
            name="endTime"
            type="time"
            defaultValue={initial.end_time === "close" ? "" : initial.end_time}
          />
        </label>
      </div>
      <label className="check">
        <input name="endsAtClose" type="checkbox" defaultChecked={initial.end_time === "close"} />
        Runs until close
      </label>
      <label className="check">
        <input name="is21Plus" type="checkbox" defaultChecked={initial.is_21_plus} />
        21+ only
      </label>

      {state?.error && <p className="error" role="alert">{state.error}</p>}
      {state?.saved && <p className="success" role="status">Posted! It's on the feed now.</p>}

      <button className="button primary" type="submit" disabled={pending}>
        {pending ? "Posting..." : "Post it"}
      </button>
    </form>
  );
}
