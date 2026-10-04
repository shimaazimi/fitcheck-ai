"use client";

import { useState } from "react";
import ImageUploader from "../components/ImageUploader";

type Analysis = {
  verdict: "BUY" | "MAYBE" | "SKIP";
  styleScore: number;
  visualFit: string;
  why: string;
  consider: string;
  pairWith: string[];
};

const DEMO_ANALYSIS: Analysis = {
  verdict: "BUY",
  styleScore: 8.7,
  visualFit: "Balanced with a relaxed outer layer",
  why: "The forest-green overshirt adds depth to the neutral base while keeping the outfit versatile.",
  consider: "The sleeves look slightly relaxed in this simulation; check the real garment proportions before buying.",
  pairWith: ["Black straight-leg trousers", "Minimal white sneakers", "A simple silver watch"]
};

function toDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [person, setPerson] = useState<File | null>(null);
  const [garment, setGarment] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function choosePerson(file: File) {
    setDemoMode(false);
    setPerson(file);
    setPersonPreview(URL.createObjectURL(file));
    setResult(null);
  }

  function chooseGarment(file: File) {
    setDemoMode(false);
    setGarment(file);
    setGarmentPreview(URL.createObjectURL(file));
    setResult(null);
  }

  async function generate() {
    if (!person || !garment) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setAnalysisError(null);

    try {
      const [modelImage, garmentImage] = await Promise.all([toDataUri(person), toDataUri(garment)]);
      const tryOnResponse = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelImage, garmentImage })
      });

      const tryOnData = await tryOnResponse.json();
      if (!tryOnResponse.ok) throw new Error(tryOnData.error || "Try-on failed.");

      setResult(tryOnData.output);

      try {
        const analysisResponse = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelImage, garmentImage, tryOnImage: tryOnData.output })
        });
        const analysisData = await analysisResponse.json();
        if (analysisResponse.ok) {
          setAnalysis(analysisData);
        } else {
          setAnalysisError(analysisData.error || "The try-on is ready, but AI analysis failed.");
        }
      } catch {
        setAnalysisError("The try-on is ready, but AI analysis could not be reached.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function loadDemo() {
    setPersonPreview("/demo/person.png");
    setGarmentPreview("/demo/garment.png");
    setResult("/demo/result.png");
    setAnalysis(DEMO_ANALYSIS);
    setAnalysisError(null);
    setError(null);
    setDemoMode(true);
  }

  function reset() {
    setResult(null);
    setAnalysis(null);
    setAnalysisError(null);
    setError(null);
    if (demoMode) {
      setPerson(null);
      setGarment(null);
      setPersonPreview(null);
      setGarmentPreview(null);
      setDemoMode(false);
    }
  }

  return (
    <main className="shell">
      <nav className="nav">
        <div className="brand">FITCHECK</div>
        <div className="badge">AI fashion decision engine · Free demo</div>
      </nav>

      <section className="hero">
        <div className="eyebrow">FitCheck AI · Try on → Analyze → Decide</div>
        <h1>See it before you buy it.</h1>
        <p>
          AI-powered virtual try-on that helps you understand a look and decide what is actually worth buying.
        </p>
      </section>

      {!result ? (
        <>
          <section className="workspace">
            <ImageUploader
              title="1. Your photo"
              description="Use a clear front-facing or full-body photo with good lighting."
              preview={personPreview}
              onFile={choosePerson}
            />
            <ImageUploader
              title="2. Clothing item"
              description="Flat-lay, mannequin, or on-model garment photos can work."
              preview={garmentPreview}
              onFile={chooseGarment}
            />
          </section>

          <div className="actions">
            <button className="primary" disabled={!person || !garment || loading} onClick={generate}>
              {loading ? "Creating try-on…" : "Try it on"}
            </button>
            <button className="secondary" type="button" disabled={loading} onClick={loadDemo}>
              View sample result
            </button>
            <span className="status">Free demo uses a prepared example. Live try-on requires API keys.</span>
            {error && <span className="error">{error}</span>}
          </div>
        </>
      ) : (
        <>
          <section className="resultGrid">
            <div className="resultImage">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result} alt="Generated virtual try-on" />
            </div>

            <div className="analysis">
              {demoMode && <div className="demoFlag">Prepared demo · no live API call</div>}
              <div className="verdict">
                <small>FitCheck verdict</small>
                <h3>{analysis?.verdict ?? (analysisError ? "READY" : "ANALYZING")}</h3>
                <p>
                  {analysis?.why ??
                    analysisError ??
                    "Your virtual try-on is ready. FitCheck is reviewing the simulated look."}
                </p>
              </div>
              <div className="metric">
                <span>Style match</span>
                <strong>{analysis ? `${analysis.styleScore.toFixed(1)} / 10` : analysisError ? "Unavailable" : "Analyzing…"}</strong>
              </div>
              <div className="metric">
                <span>Visual fit</span>
                <strong>{analysis?.visualFit ?? (analysisError ? "Unavailable" : "Analyzing…")}</strong>
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
              <button className="secondary" onClick={reset}>Try another item</button>
            </div>
          </section>
          <p className="notice">
            {demoMode && "This prepared example demonstrates the intended FitCheck experience without paid APIs. "}
            FitCheck provides visual styling guidance based on images. It does not guarantee physical garment fit or sizing.
          </p>
        </>
      )}
    </main>
  );
}
