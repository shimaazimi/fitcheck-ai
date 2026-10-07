"use client";

import Link from "next/link";
import { useState } from "react";
import ImageUploader from "../components/ImageUploader";
import ResultView, { type Analysis } from "../components/ResultView";
import SiteNav from "../components/SiteNav";

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
      if (!tryOnResponse.ok) throw new Error(tryOnData.error || "ساخت پرو مجازی انجام نشد.");

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
          setAnalysisError(analysisData.error || "پرو مجازی آماده است، اما تحلیل هوشمند انجام نشد.");
        }
      } catch {
        setAnalysisError("پرو مجازی آماده است، اما ارتباط با تحلیل هوشمند برقرار نشد.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "مشکلی پیش آمد؛ دوباره تلاش کنید.");
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
      <SiteNav active="home" />

      <section className="hero">
        <div className="heroCopy">
          <div className="eyebrow"><span /> فیت‌چک · امتحان کن ← تحلیل کن ← تصمیم بگیر</div>
          <h1>قبل از خرید،<em> ببین</em> و مطمئن شو.</h1>
          <p>
            لباس‌هایت را به کمد هوشمند اضافه کن، برای هر موقعیت پیشنهاد بگیر و قبل از خرید لباس جدید ببین
            چقدر با استایل و کمد تو هماهنگ است.
          </p>
          <div className="heroChips">
            <span>کمد هوشمند</span><span>پیشنهاد استایل</span><span>خرید آگاهانه</span>
          </div>
          <div className="heroActions">
            <Link className="primary buttonLink" href="/wardrobe">
              شروع از کمد من <span aria-hidden="true">←</span>
            </Link>
            <Link className="secondary buttonLink" href="/demo">دیدن دموی کامل</Link>
          </div>
          <div className="heroTrust"><i /> بدون ثبت‌نام · اطلاعات فعلاً فقط در مرورگر تو</div>
        </div>
        <div className="heroVisual" aria-label="نمونه روند پرو مجازی">
          <div className="visualGlow" />
          <figure className="visualCard personCard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demo/person.png" alt="عکس اولیه کاربر" />
            <figcaption>عکس تو</figcaption>
          </figure>
          <figure className="visualCard garmentCard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demo/garment.png" alt="لباس انتخاب‌شده" />
            <figcaption>انتخاب لباس</figcaption>
          </figure>
          <figure className="visualCard resultCard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demo/result.png" alt="نتیجه پرو مجازی" />
            <figcaption><b>۸٫۶</b> هماهنگی استایل</figcaption>
          </figure>
          <div className="verdictBubble"><small>پیشنهاد فیت‌چک</small><strong>بخر ✓</strong></div>
        </div>
      </section>

      {!result ? (
        <>
          {LIVE_DEMO_ENABLED ? (
            <section className="workspace">
              <ImageUploader
                title="۱. عکس خودت"
                description="یک عکس واضح تمام‌قد یا روبه‌رو با نور مناسب انتخاب کن."
                preview={personPreview}
                onFile={choosePerson}
                capture="user"
              />
              <ImageUploader
                title="۲. لباس موردنظر"
                description="می‌توانی عکس لباس، مانکن یا محصول فروشگاه را انتخاب کنی."
                preview={garmentPreview}
                onFile={chooseGarment}
                capture="environment"
              />
            </section>
          ) : (
            <section className="demoCallout">
              <div>
                <span className="demoLabel">نسخه نمایشی محصول</span>
                <h2>یک تصمیم خرید کامل را ببین.</h2>
                <p>
                  نتیجه‌ی پرو مجازی، میزان هماهنگی با استایل و کمد، ارزش خرید و پیشنهادهای کاربردی را یکجا بررسی کن.
                </p>
              </div>
              <Link className="primary buttonLink" href="/demo">
                آپلود عکس و مشاهده دمو
              </Link>
            </section>
          )}

          {LIVE_DEMO_ENABLED && (
            <div className="actions">
              <button className="primary" disabled={!person || !garment || loading} onClick={generate}>
                {loading ? "در حال ساخت پرو مجازی…" : "پرو مجازی"}
              </button>
              <Link className="secondary buttonLink" href="/demo">
                مشاهده نتیجه نمونه
              </Link>
              <span className="status">دو عکس انتخاب کن یا نتیجه نمونه را ببین.</span>
              {error && <span className="error">{error}</span>}
            </div>
          )}
        </>
      ) : (
        <ResultView result={result} analysis={analysis} analysisError={analysisError} onTryAnother={reset} />
      )}

      {!result && (
        <section className="visionSection">
          <div className="visionHeading">
            <div><div className="sectionLabel">مسیر ساده و مشخص</div><h2>سه قدم تا انتخاب مطمئن‌تر</h2></div>
            <p>از شناخت لباس‌هایی که داری شروع کن؛ بعد برای پوشیدن و خرید تصمیم بگیر.</p>
          </div>
          <div className="visionGrid">
            <Link className="journeyCard" href="/wardrobe"><span>۰۱</span><b>نقطه شروع</b><h3>کمد هوشمند</h3><p>لباس‌های فعلی‌ات را ثبت کن تا پیشنهادها واقعاً شخصی شوند.</p><i>ساخت کمد ←</i></Link>
            <Link className="journeyCard" href="/occasion"><span>۰۲</span><b>انتخاب روزانه</b><h3>پیشنهاد برای موقعیت</h3><p>برای دانشگاه، مهمانی، سفر یا محل کار از کمدت ست بگیر.</p><i>گرفتن پیشنهاد ←</i></Link>
            <Link className="journeyCard" href="/buy-check"><span>۰۳</span><b>قبل از پرداخت</b><h3>بررسی خرید جدید</h3><p>هماهنگی، تکراری‌بودن و ارزش واقعی لباس جدید را بسنج.</p><i>بررسی خرید ←</i></Link>
          </div>
        </section>
      )}
    </main>
  );
}
