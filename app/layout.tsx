import type { Metadata } from "next";
import "overlayscrollbars/overlayscrollbars.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Placeholder Title",
  description: "A personal website in progress.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
