import type { Metadata } from "next";
import Link from "next/link";
import ResultView, { DEMO_ANALYSIS } from "../../components/ResultView";

export const metadata: Metadata = {
  title: "نتیجه نمونه · فیت‌چک",
  description: "نمونه کامل پرو مجازی و تصمیم خرید هوشمند فیت‌چک"
};

export default function DemoPage() {
  return (
    <main className="shell">
      <nav className="nav resultNav">
        <Link className="brand brandLink" href="/">فیت‌چک</Link>
        <div className="navActions">
          <Link className="navLink" href="/wardrobe">کمد من</Link>
          <div className="badge">دستیار هوشمند کمد و خرید</div>
        </div>
      </nav>
      <ResultView
        result="/demo/result.png"
        analysis={DEMO_ANALYSIS}
        isPreparedDemo
        tryAnotherHref="/"
      />
    </main>
  );
}
