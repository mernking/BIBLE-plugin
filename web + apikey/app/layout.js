import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "OBS BIBLE PLUGIN || CHI DAVID",
  description:
    "obs bible plugin made by chi david for the church or christ and for the gosple",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
