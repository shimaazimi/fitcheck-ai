import type { Metadata } from "next";
import Link from "next/link";
import ResultView, { DEMO_ANALYSIS } from "../../components/ResultView";

export const metadata: Metadata = {
  title: "Sample Result · FitCheck AI",
  description: "Explore a complete FitCheck virtual try-on and AI purchase decision sample."
};

export default function DemoPage() {
  return (
    <main className="shell">
      <nav className="nav resultNav">
        <Link className="brand brandLink" href="/">FITCHECK</Link>
        <div className="badge">AI fashion decision engine</div>
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
