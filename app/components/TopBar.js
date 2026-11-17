import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/actions/auth";

export default function TopBar({ user }) {
  // Signed-in people go straight to the feed; everyone else sees the homepage.
  const homeLink = user ? "/feed" : "/";

  return (
    <header className="topbar">
      <div className="container">
        <Link href={homeLink} className="logo">Valley Brews</Link>
        <Link href={homeLink} className="brandmark">
          <Image src="/valley-brews-logo.webp" alt="Valley Brews" width={1254} height={1254} sizes="140px" priority />
        </Link>
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
