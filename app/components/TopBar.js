import Link from "next/link";
import { logout } from "@/app/actions/auth";

export default function TopBar({ user }) {
  return (
    <header className="topbar">
      <div className="container">
        <Link href="/" className="logo">Valley Brews</Link>
        <nav className="nav">
          <Link href="/feed">Feed</Link>
          {user ? (
            <>
              {user.role === "business" && <Link href="/dashboard">Dashboard</Link>}
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
