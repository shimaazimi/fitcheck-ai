"use client";

import Link from "next/link";

export type Analysis = {
  verdict: "BUY" | "MAYBE" | "SKIP";
  styleScore: number;
  visualFit: string;
  why: string;
  consider: string;
  pairWith: string[];
};

export const DEMO_ANALYSIS: Analysis = {
  verdict: "BUY",
  styleScore: 8.6,
  visualFit: "Balanced silhouette",
  why: "The overall silhouette feels balanced, and the forest-green overshirt adds depth to the neutral base.",
  consider: "The shoulder and sleeve area appears slightly relaxed, creating a more oversized look.",
  pairWith: ["Black straight-leg trousers", "Minimal white sneakers", "A small structured bag"]
};

function verdictCaption(analysis: Analysis | null, hasError: boolean) {
  if (!analysis) return hasError ? "Analysis unavailable" : "Reviewing the generated look";
  if (analysis.verdict === "BUY") return "Strong match";
  if (analysis.verdict === "MAYBE") return "Worth a closer look";
  return "A better option may exist";
}

type Props = {
  result: string;
  analysis: Analysis | null;
  analysisError?: string | null;
  isPreparedDemo?: boolean;
  onTryAnother?: () => void;
  tryAnotherHref?: string;
};

export default function ResultView({
  result,
  analysis,
  analysisError = null,
  isPreparedDemo = false,
  onTryAnother,
  tryAnotherHref
}: Props) {
  return (
    <>
      <section className="resultGrid">
        <div className="resultVisual">
          <div className="sectionLabel">Your try-on</div>
          <div className="resultImage">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result} alt="Generated virtual try-on" />
          </div>
        </div>

        <div className="analysis">
          {isPreparedDemo && <div className="demoFlag">Sample result</div>}
          <div className="sectionLabel">FitCheck analysis</div>
          <div className="verdict">
            <small>FitCheck verdict</small>
            <h3>{analysis?.verdict ?? (analysisError ? "READY" : "ANALYZING")}</h3>
            <p>{verdictCaption(analysis, Boolean(analysisError))}</p>
          </div>
          <div className="metricRow">
            <div className="metric">
              <span>Style match</span>
              <strong>
                {analysis ? `${analysis.styleScore.toFixed(1)} / 10` : analysisError ? "Unavailable" : "Analyzing…"}
              </strong>
            </div>
            <div className="metric">
              <span>Visual fit</span>
              <strong>{analysis?.visualFit ?? (analysisError ? "Unavailable" : "Analyzing…")}</strong>
            </div>
          </div>
          <div className="metric">
            <span>Why it works</span>
            <strong>{analysis?.why ?? analysisError ?? "FitCheck is reviewing the simulated look."}</strong>
          </div>
          <div className="metric">
            <span>Consider</span>
            <strong>{analysis?.consider ?? (analysisError ? "Unavailable" : "Analyzing…")}</strong>
          </div>
          <div className="metric">
            <span>Pair it with</span>
            {analysis ? (
              <ul className="pairingList">
                {analysis.pairWith.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : (
              <strong>{analysisError ? "Unavailable" : "Analyzing…"}</strong>
            )}
          </div>
          {tryAnotherHref ? (
            <Link className="secondary buttonLink" href={tryAnotherHref}>Try another item</Link>
          ) : (
            <button className="secondary" onClick={onTryAnother}>Try another item</button>
          )}
        </div>
      </section>
      <p className="notice">
        FitCheck provides visual styling guidance from images and does not guarantee physical garment fit or sizing.
      </p>
    </>
  );
}
