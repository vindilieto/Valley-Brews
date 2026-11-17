"use client";

import { useActionState } from "react";
import { deleteAccount } from "@/app/actions/account";

export default function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, undefined);

  return (
    <form action={action} className="postform">
      <label>
        Type your password to confirm
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      <button className="button danger" type="submit" disabled={pending}>
        {pending ? "Deleting..." : "Delete my account forever"}
      </button>
    </form>
  );
}
