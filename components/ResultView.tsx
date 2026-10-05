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
  visualFit: "فرم متعادل و کمی آزاد",
  why: "فرم کلی لباس متعادل است و سبز تیره‌ی رویه، به ترکیب رنگ‌های خنثی عمق می‌دهد.",
  consider: "قسمت شانه و آستین کمی آزاد دیده می‌شود؛ اگر استایل جذب می‌خواهی، مدل دیگری را هم مقایسه کن.",
  pairWith: ["شلوار راسته مشکی", "کتانی سفید ساده", "کیف کوچک ساختارمند"]
};

function verdictCaption(analysis: Analysis | null, hasError: boolean) {
  if (!analysis) return hasError ? "تحلیل در دسترس نیست" : "در حال بررسی استایل";
  if (analysis.verdict === "BUY") return "انتخاب مناسبی است";
  if (analysis.verdict === "MAYBE") return "بهتر است بیشتر بررسی کنی";
  return "احتمالاً انتخاب بهتری وجود دارد";
}

function verdictLabel(verdict?: Analysis["verdict"]) {
  if (verdict === "BUY") return "بخر";
  if (verdict === "MAYBE") return "بررسی کن";
  if (verdict === "SKIP") return "ردش کن";
  return "در حال تحلیل";
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
          <div className="sectionLabel">پرو مجازی تو</div>
          <div className="resultImage">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result} alt="نتیجه پرو مجازی" />
          </div>
        </div>

        <div className="analysis">
          {isPreparedDemo && <div className="demoFlag">نتیجه نمونه</div>}
          <div className="sectionLabel">تحلیل فیت‌چک</div>
          <div className="verdict">
            <small>پیشنهاد فیت‌چک</small>
            <h3>{analysisError ? "آماده" : verdictLabel(analysis?.verdict)}</h3>
            <p>{verdictCaption(analysis, Boolean(analysisError))}</p>
          </div>
          <div className="metricRow">
            <div className="metric">
              <span>هماهنگی استایل</span>
              <strong>
                {analysis ? `${analysis.styleScore.toFixed(1)} از ۱۰` : analysisError ? "در دسترس نیست" : "در حال تحلیل…"}
              </strong>
            </div>
            <div className="metric">
              <span>فرم ظاهری</span>
              <strong>{analysis?.visualFit ?? (analysisError ? "در دسترس نیست" : "در حال تحلیل…")}</strong>
            </div>
          </div>
          <div className="metric">
            <span>چرا مناسب است؟</span>
            <strong>{analysis?.why ?? analysisError ?? "فیت‌چک در حال بررسی استایل شبیه‌سازی‌شده است."}</strong>
          </div>
          <div className="metric">
            <span>به این نکته توجه کن</span>
            <strong>{analysis?.consider ?? (analysisError ? "در دسترس نیست" : "در حال تحلیل…")}</strong>
          </div>
          <div className="metric">
            <span>با این‌ها ست کن</span>
            {analysis ? (
              <ul className="pairingList">
                {analysis.pairWith.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : (
              <strong>{analysisError ? "در دسترس نیست" : "در حال تحلیل…"}</strong>
            )}
          </div>
          {isPreparedDemo && (
            <div className="metricRow">
              <div className="metric highlightMetric"><span>هماهنگی با کمد</span><strong>۸۲٪ · بالا</strong></div>
              <div className="metric highlightMetric"><span>ارزش خرید</span><strong>۸ از ۱۰</strong></div>
            </div>
          )}
          {tryAnotherHref ? (
            <Link className="secondary buttonLink" href={tryAnotherHref}>بررسی یک لباس دیگر</Link>
          ) : (
            <button className="secondary" onClick={onTryAnother}>بررسی یک لباس دیگر</button>
          )}
        </div>
      </section>
      <p className="notice">
        فیت‌چک بر اساس تصاویر، راهنمایی استایل ارائه می‌دهد و اندازه یا تن‌خور واقعی لباس را تضمین نمی‌کند.
      </p>
    </>
  );
}
