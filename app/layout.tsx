import type { Metadata } from "next";
import "vazirmatn/Vazirmatn-Variable-font-face.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitCheck AI",
  description: "دستیار هوشمند کمد، استایل و تصمیم خرید لباس"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
