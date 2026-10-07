import type { Metadata } from "next";
import DemoUploadPreview from "../../components/DemoUploadPreview";
import ResultView, { DEMO_ANALYSIS } from "../../components/ResultView";
import SiteNav from "../../components/SiteNav";

export const metadata: Metadata = {
  title: "نتیجه نمونه · فیت‌چک",
  description: "نمونه کامل پرو مجازی و تصمیم خرید هوشمند فیت‌چک"
};

export default function DemoPage() {
  return (
    <main className="shell">
      <SiteNav active="demo" compact />
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
