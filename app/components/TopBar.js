import Link from "next/link";
import { logout } from "@/app/actions/auth";

export default function TopBar({ user }) {
  return (
    <header className="topbar">
      <div className="container">
        <Link href="/" className="logo">Valley Brews</Link>
        <nav className="nav">
          <Link href="/feed">Home</Link>
          {user ? (
            <>
              {user.role === "customer" && <Link href="/feed?view=following">Following</Link>}
              {user.role === "business" && (
                <>
                  <Link href="/dashboard">Posts</Link>
                  <Link href={`/business/${user.id}`}>Profile</Link>
                </>
              )}
              <form action={logout}>
                <button type="submit" className="linkbutton">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/signup">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
