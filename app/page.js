import Link from "next/link";

export default function Home() {
  return (
    <>
      <header className="topbar">
        <div className="container">
          <Link href="/" className="logo">Valley Brews</Link>
          <nav className="nav">
            <Link href="/login">Log in</Link>
            <Link href="/signup">Sign up</Link>
          </nav>
        </div>
      </header>

      <div className="hero">
        <div className="container">
          <h1>Everything happening in State College this week, in one place.</h1>
          <p>
            Valley Brews is one weekly feed of specials, events, and promos from local bars,
            restaurants, shops, and hotels, posted by the businesses themselves.
          </p>
          <Link href="/signup" className="button">List your business for free</Link>
          <span className="note">Always free for students and visitors.</span>
        </div>
      </div>

      <section>
        <div className="container">
          <h2>How it works</h2>
          <p className="sub">Three simple steps.</p>
          <div className="grid">
            <div className="card">
              <div className="step">1</div>
              <h3>Businesses post</h3>
              <p>Log in and post your own specials, events, and promos in under a minute.</p>
            </div>
            <div className="card">
              <div className="step">2</div>
              <h3>Students and visitors browse</h3>
              <p>Everyone sees one free weekly feed. Filter by specials, events, food, or game day.</p>
            </div>
            <div className="card">
              <div className="step">3</div>
              <h3>Businesses see results</h3>
              <p>See how many people viewed and clicked your posts, so you know what's working.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="alt">
        <div className="container">
          <h2>Write a week of specials in seconds</h2>
          <p className="sub">The AI specials assistant turns a rough note into everything you need.</p>
          <div className="example">
            <div className="card">
              <h3>You type</h3>
              <p className="rough">half off wings tuesday 9 til close, $3 wells</p>
            </div>
            <div className="card">
              <h3>You get</h3>
              <dl>
                <dt>A structured post</dt>
                <dd>Tuesday, 9 PM to close. Category: Specials. 21+</dd>
                <dt>An Instagram caption</dt>
                <dd>Tuesday night plans: sorted. Half-off wings and $3 wells from 9 to close.</dd>
                <dt>A text message</dt>
                <dd>Tues 9-close: half-off wings, $3 wells. 21+</dd>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <h2>Who it's for</h2>
          <p className="sub">Built for State College, PA.</p>
          <div className="grid">
            <div className="card">
              <h3>Local businesses</h3>
              <p>Bars, restaurants, shops, and hotels that want more people through the door and less time spent writing posts.</p>
            </div>
            <div className="card">
              <h3>Penn State students</h3>
              <p>A quick way to find deals and things to do this week, without checking a dozen Instagram accounts.</p>
            </div>
            <div className="card">
              <h3>Game-weekend visitors</h3>
              <p>Alumni, families, and fans in town for a football weekend can see where to eat, shop, and stay.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="alt" id="pricing">
        <div className="container">
          <h2>Why go Pro?</h2>
          <p className="sub">One extra table on a slow Tuesday can pay for the month.</p>
          <div className="grid two">
            <div className="card">
              <h3>Free</h3>
              <p className="price">$0 <span>/ month</span></p>
              <ul>
                <li>Business profile page</li>
                <li>Up to 5 active posts</li>
                <li>Post by hand</li>
              </ul>
              <Link href="/signup" className="button primary">Start free</Link>
            </div>
            <div className="card featured">
              <h3>Pro</h3>
              <p className="price">$35 <span>/ month</span></p>
              <ul>
                <li>Unlimited posts</li>
                <li>Weekly specials that repeat on their own</li>
                <li>AI specials assistant</li>
                <li>Views and clicks stats</li>
                <li>Priority placement in the feed</li>
              </ul>
              <Link href="/signup" className="button primary">Go Pro</Link>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <p>Valley Brews &middot; Created by Vincent DiLieto</p>
          <p>Engineering 310 SaaS project, Penn State. Some listings may be 21+.</p>
        </div>
      </footer>
    </>
  );
}
