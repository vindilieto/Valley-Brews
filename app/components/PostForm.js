"use client";

import { useActionState } from "react";
import { savePost } from "@/app/actions/posts";
import PhotoInput from "@/app/components/PhotoInput";
import { CATEGORIES, WEEKDAYS } from "@/lib/format";

// Monday first, so the weekend sits together at the end.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

// The form businesses use to publish or edit a post. The AI assistant can fill it in first.
export default function PostForm({ initial = {}, today, canRepeat }) {
  const [state, action, pending] = useActionState(savePost, undefined);
  const repeatDays = initial.repeat_days ?? [];
  const editing = Boolean(initial.id);
  // An edited post may keep a start date that has already passed.
  const minDate = editing && initial.date < today ? initial.date : today;

  return (
    <form action={action} className="postform">
      {editing && <input type="hidden" name="postId" value={initial.id} />}
      <label>
        Title
        <input name="title" type="text" maxLength={100} defaultValue={initial.title} required />
      </label>
      <label>
        Description
        <textarea name="description" rows={3} maxLength={1000} defaultValue={initial.description} required />
      </label>
      <PhotoInput
        name="image"
        label="Photo (optional)"
        current={initial.image_url}
        currentCrop={initial.image_crop}
        frame="frame post"
        allowFit
      />
      {editing && initial.image_url && (
        <label className="check">
          <input name="removeImage" type="checkbox" />
          Remove photo
        </label>
      )}
      <fieldset className="repeat">
        <legend>Categories <span className="muted">(pick all that fit)</span></legend>
        <div className="days">
          {CATEGORIES.map((category) => (
            <label key={category} className="dayopt">
              <input
                type="checkbox"
                name="categories"
                value={category}
                defaultChecked={initial.categories?.includes(category)}
              />
              {category}
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        {canRepeat ? "Date (or first date, if it repeats)" : "Date"}
        <input name="date" type="date" min={minDate} defaultValue={initial.date} required />
      </label>

      <fieldset className="repeat" disabled={!canRepeat}>
        <legend>
          Repeat every week on {!canRepeat && <span className="muted">(Plus and Pro plans)</span>}
        </legend>
        <div className="days">
          {WEEK_ORDER.map((day) => (
            <label key={day} className="dayopt">
              <input
                type="checkbox"
                name="repeatDays"
                value={day}
                defaultChecked={canRepeat && repeatDays.includes(day)}
              />
              {WEEKDAYS[day].slice(0, 3)}
            </label>
          ))}
        </div>
        <p className="muted hint">Leave these blank for a one-time post.</p>
      </fieldset>

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
      <label className="toggle">
        <input name="isPublic" type="checkbox" defaultChecked={initial.is_public ?? true} />
        <span className="slider" aria-hidden="true" />
        Show on the feed
        <span className="muted">(turn off to keep it hidden on your Posts page for now)</span>
      </label>

      {state?.error && <p className="error" role="alert">{state.error}</p>}

      <button className="button primary" type="submit" disabled={pending}>
        {pending ? "Saving..." : editing ? "Save changes" : "Post it"}
      </button>
    </form>
  );
}
