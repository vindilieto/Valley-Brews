"use client";

import { useActionState } from "react";
import { saveProfile } from "@/app/actions/profile";
import PhotoInput from "@/app/components/PhotoInput";

// The form for a business's public page: logo, bio, address, hours, and menu link.
export default function ProfileForm({ business }) {
  const [state, action, pending] = useActionState(saveProfile, undefined);

  return (
    <form action={action} className="postform">
      <PhotoInput
        key={state?.savedAt ?? 0}
        name="logo"
        label="Logo"
        maxSize={400}
        current={business.logo_url}
        round
      />
      <label>
        Business name
        <input name="businessName" type="text" maxLength={80} defaultValue={business.business_name} required />
      </label>
      <label>
        Bio
        <textarea
          name="bio"
          rows={3}
          maxLength={300}
          defaultValue={business.bio}
          placeholder="What you're known for, in a sentence or two."
        />
      </label>
      <label>
        Address
        <input name="address" type="text" maxLength={200} defaultValue={business.address}
          placeholder="123 E College Ave, State College, PA 16801" />
      </label>
      <label>
        Hours
        <textarea
          name="hours"
          rows={3}
          maxLength={300}
          defaultValue={business.hours}
          placeholder={"Mon-Thu: 11 AM - 12 AM\nFri-Sat: 11 AM - 2 AM"}
        />
      </label>
      <label>
        Menu link (optional)
        <input name="menuUrl" type="text" maxLength={300} defaultValue={business.menu_url}
          placeholder="https://yourbar.com/menu" />
      </label>

      {state?.error && <p className="error" role="alert">{state.error}</p>}
      {state?.saved && <p className="success" role="status">Saved! Your page is updated.</p>}

      <button className="button primary" type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save my page"}
      </button>
    </form>
  );
}
