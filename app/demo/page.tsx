import type { Metadata } from "next";
import Link from "next/link";
import DemoUploadPreview from "../../components/DemoUploadPreview";
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
          <Link className="navLink" href="/buy-check">بررسی خرید</Link>
          <Link className="navLink" href="/wardrobe">کمد من</Link>
          <div className="badge">دستیار هوشمند کمد و خرید</div>
        </div>
      </nav>
      <DemoUploadPreview />
      <div id="sample-result" className="sampleResultAnchor">
        <ResultView
          result="/demo/result.png"
          analysis={DEMO_ANALYSIS}
          isPreparedDemo
          tryAnotherHref="/wardrobe"
        />
      </div>
    </main>
  );
}
