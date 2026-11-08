"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, signup } from "@/app/actions/auth";

export default function AuthForm({ mode, startingRole = "business" }) {
  const isSignup = mode === "signup";
  const [state, action, pending] = useActionState(isSignup ? signup : login, undefined);
  const [role, setRole] = useState(startingRole);

  return (
    <form action={action} className="card authcard">
      <h1>{isSignup ? "Create your account" : "Log in"}</h1>

      {isSignup && (
        <fieldset className="rolepick">
          <legend>Account type</legend>
          <label>
            <input
              type="radio"
              name="role"
              value="customer"
              checked={role === "customer"}
              onChange={() => setRole("customer")}
            />
            Personal (browse, like, save, and follow)
          </label>
          <label>
            <input
              type="radio"
              name="role"
              value="business"
              checked={role === "business"}
              onChange={() => setRole("business")}
            />
            Business (post your specials and events)
          </label>
        </fieldset>
      )}
      {isSignup && role === "business" && (
        <label>
          Business name
          <input name="businessName" type="text" autoComplete="organization" required />
        </label>
      )}
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          minLength={isSignup ? 8 : undefined}
          required
        />
      </label>

      {state?.error && <p className="error" role="alert">{state.error}</p>}

      <button className="button primary" type="submit" disabled={pending}>
        {pending ? "One moment..." : isSignup ? "Sign up" : "Log in"}
      </button>

      <p className="switch">
        {isSignup ? (
          <>Already have an account? <Link href="/login">Log in</Link></>
        ) : (
          <>New here? <Link href="/signup">Create an account</Link></>
        )}
      </p>
    </form>
  );
}
