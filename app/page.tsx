"use client";

import Link from "next/link";
import { useState } from "react";
import ImageUploader from "../components/ImageUploader";
import ResultView, { type Analysis } from "../components/ResultView";

const LIVE_DEMO_ENABLED = process.env.NEXT_PUBLIC_LIVE_DEMO_ENABLED === "true";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function choosePerson(file: File) {
    setPerson(file);
    setPersonPreview(URL.createObjectURL(file));
    setResult(null);
  }

  function chooseGarment(file: File) {
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

  function reset() {
    setResult(null);
    setAnalysis(null);
    setAnalysisError(null);
    setError(null);
  }

  return (
    <main className="shell">
      <nav className="nav">
        <div className="brand">FITCHECK</div>
        <div className="badge">AI fashion decision engine</div>
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
          {LIVE_DEMO_ENABLED ? (
            <section className="workspace">
              <ImageUploader
                title="1. Your photo"
                description="Use a clear front-facing or full-body photo with good lighting."
                preview={personPreview}
                onFile={choosePerson}
                capture="user"
              />
              <ImageUploader
                title="2. Clothing item"
                description="Flat-lay, mannequin, or on-model garment photos can work."
                preview={garmentPreview}
                onFile={chooseGarment}
                capture="environment"
              />
            </section>
          ) : (
            <section className="demoCallout">
              <div>
                <span className="demoLabel">INTERACTIVE PRODUCT WALKTHROUGH</span>
                <h2>See the complete decision experience.</h2>
                <p>
                  Explore a prepared try-on, FitCheck verdict, style match, visual fit, and practical styling
                  suggestions—all in one result.
                </p>
              </div>
              <Link className="primary buttonLink" href="/demo">
                View sample result
              </Link>
            </section>
          )}

          {LIVE_DEMO_ENABLED && (
            <div className="actions">
              <button className="primary" disabled={!person || !garment || loading} onClick={generate}>
                {loading ? "Creating try-on…" : "Try it on"}
              </button>
              <Link className="secondary buttonLink" href="/demo">
                View sample result
              </Link>
              <span className="status">Choose two photos or explore the complete sample result.</span>
              {error && <span className="error">{error}</span>}
            </div>
          )}
        </>
      ) : (
        <ResultView result={result} analysis={analysis} analysisError={analysisError} onTryAnother={reset} />
      )}
    </main>
  );
}
