import "./globals.css";

export const metadata = {
  title: "Valley Brews | What's happening in State College this week",
  description:
    "One weekly feed of specials, events, and promos from State College businesses, posted by the businesses themselves.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
