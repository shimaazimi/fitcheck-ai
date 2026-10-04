import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitCheck AI",
  description: "See it. Understand it. Decide before you buy."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
