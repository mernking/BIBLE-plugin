import "./globals.css";

export const metadata = {
  title: "OBS BIBLE PLUGIN || CHI DAVID",
  description:
    "obs bible plugin made by chi david ffor the church or christ and for the gosple",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
