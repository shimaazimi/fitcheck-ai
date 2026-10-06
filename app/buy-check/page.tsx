"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type WardrobeItem = {
  id: string;
  name: string;
  image: string;
  category: string;
  color: string;
  season: string;
  occasion: string;
  notes: string;
  createdAt: number;
};

type PurchaseResult = {
  score: number;
  verdict: string;
  tone: "good" | "medium" | "low";
  matchCount: number;
  duplicateCount: number;
  costPerWear: number | null;
  reasons: string[];
  considerations: string[];
  matches: WardrobeItem[];
};

const STORAGE_KEY = "fitcheck-wardrobe-v1";
const categories = ["بالاپوش", "پیراهن", "شلوار", "دامن", "مانتو و کت", "کفش", "کیف", "اکسسوری", "سایر"];
const occasions = ["روزمره", "محل کار", "دانشگاه", "مهمانی", "ورزش", "سفر", "رسمی"];
const neutralColors = ["مشکی", "سفید", "طوسی", "خاکستری", "کرم", "بژ", "قهوه‌ای", "سرمه‌ای"];

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("خواندن عکس انجام نشد."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function parsePrice(value: string) {
  const normalized = value.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[^0-9]/g, "");
  return normalized ? Number(normalized) : 0;
}

export default function BuyCheckPage() {
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [ready, setReady] = useState(false);
  const [image, setImage] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [color, setColor] = useState("");
  const [occasion, setOccasion] = useState(occasions[0]);
  const [price, setPrice] = useState("");
  const [expectedUses, setExpectedUses] = useState("20");
  const [needLevel, setNeedLevel] = useState("3");
  const [error, setError] = useState("");
  const [result, setResult] = useState<PurchaseResult | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setWardrobe(JSON.parse(saved));
    } catch {
      setError("اطلاعات کمد خوانده نشد؛ می‌توانی بررسی را بدون کمد ادامه بدهی.");
    } finally {
      setReady(true);
    }
  }, []);

  const wardrobeSummary = useMemo(() => {
    const sameOccasion = wardrobe.filter((item) => item.occasion === occasion).length;
    const sameCategory = wardrobe.filter((item) => item.category === category).length;
    return { sameOccasion, sameCategory };
  }, [wardrobe, occasion, category]);

  async function chooseImage(file?: File) {
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      setError("حجم عکس باید کمتر از ۱۲ مگابایت باشد.");
      return;
    }
    setError("");
    try {
      setImage(await readImage(file));
      setResult(null);
    } catch {
      setError("فرمت عکس قابل‌استفاده نیست؛ JPG، PNG یا WEBP انتخاب کن.");
    }
  }

  function evaluate(event: FormEvent) {
    event.preventDefault();
    if (!image) {
      setError("اول عکس لباسی را که می‌خواهی بخری اضافه کن.");
      return;
    }
    if (!color.trim()) {
      setError("برای مقایسه با کمد، رنگ لباس را وارد کن.");
      return;
    }

    const enteredColor = color.trim().toLowerCase();
    const isNeutral = neutralColors.some((value) => enteredColor.includes(value));
    const sameCategory = wardrobe.filter((item) => item.category === category);
    const duplicates = sameCategory.filter((item) => item.color.toLowerCase().includes(enteredColor) || enteredColor.includes(item.color.toLowerCase()));
    const candidates = wardrobe.filter((item) => {
      const complementaryCategory = item.category !== category;
      const occasionMatch = item.occasion === occasion || item.occasion === "روزمره";
      const colorMatch = isNeutral || neutralColors.some((value) => item.color.includes(value));
      return complementaryCategory && (occasionMatch || colorMatch);
    }).slice(0, 4);

    const uses = Number(expectedUses);
    const numericPrice = parsePrice(price);
    const need = Number(needLevel);
    const costPerWear = numericPrice && uses ? Math.round(numericPrice / uses) : null;
    let score = 42;
    score += Math.min(candidates.length * 7, 28);
    score += need * 5;
    score += uses >= 30 ? 12 : uses >= 15 ? 7 : uses >= 6 ? 2 : -8;
    score -= Math.min(duplicates.length * 10, 20);
    if (!wardrobe.length) score -= 8;
    score = Math.max(15, Math.min(96, score));

    const verdict = score >= 75 ? "انتخاب منطقی" : score >= 55 ? "ارزش بررسی دارد" : "فعلاً صبر کن";
    const tone = score >= 75 ? "good" : score >= 55 ? "medium" : "low";
    const reasons = [
      candidates.length ? `${candidates.length} آیتم از کمدت می‌تواند نقطه شروع ست‌کردن باشد.` : "برای این لباس هنوز ست واضحی در کمد ثبت‌شده پیدا نشد.",
      uses >= 15 ? `گفتی احتمالاً حداقل ${uses.toLocaleString("fa-IR")} بار از آن استفاده می‌کنی.` : "تعداد استفاده پیش‌بینی‌شده پایین است.",
      need >= 4 ? "این خرید یک نیاز واقعی را در کمدت پوشش می‌دهد." : need === 3 ? "نیاز به این آیتم متوسط است." : "این خرید بیشتر بر اساس علاقه است تا نیاز فعلی."
    ];
    const considerations = [
      duplicates.length ? `${duplicates.length} آیتم مشابه از همین دسته و رنگ در کمدت داری.` : "آیتم بسیار مشابهی در اطلاعات فعلی کمد دیده نشد.",
      wardrobe.length < 3 ? "برای نتیجه دقیق‌تر، حداقل ۳ لباس به کمدت اضافه کن." : "نتیجه با اطلاعات فعلی کمد محاسبه شده است.",
      "جنس، کیفیت دوخت و تن‌خور واقعی باید قبل از خرید جداگانه بررسی شود."
    ];

    setError("");
    setResult({ score, verdict, tone, matchCount: candidates.length, duplicateCount: duplicates.length, costPerWear, reasons, considerations, matches: candidates });
    requestAnimationFrame(() => document.getElementById("purchase-result")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <main className="shell buyCheckShell">
      <nav className="nav">
        <Link className="brand brandLink" href="/">فیت‌چک</Link>
        <div className="navActions">
          <Link className="navLink" href="/wardrobe">کمد من</Link>
          <Link className="navLink" href="/occasion">پیشنهاد استایل</Link>
          <Link className="navLink active" href="/buy-check">بررسی خرید</Link>
        </div>
      </nav>

      <section className="buyCheckHero">
        <div>
          <div className="eyebrow"><span /> مرحله ۳ · خرید آگاهانه</div>
          <h1>این لباس واقعاً<br /><em>ارزش خرید دارد؟</em></h1>
          <p>لباس جدید را با نیاز واقعی و آیتم‌های کمدت مقایسه کن؛ قبل از اینکه یک خرید تکراری یا کم‌استفاده انجام بدهی.</p>
        </div>
        <div className="buyCheckStatus">
          <i />
          <strong>ارزیابی اولیه بدون AI</strong>
          <span>بر اساس اطلاعاتی که خودت وارد می‌کنی</span>
        </div>
      </section>

      <section className="buyCheckLayout">
        <form className="purchaseForm" onSubmit={evaluate}>
          <div className="formHeading">
            <div><span>لباس جدید</span><h2>چه چیزی می‌خواهی بخری؟</h2></div>
            <b className="stepNumber">۰۱</b>
          </div>

          <label className={`purchasePhoto ${image ? "hasImage" : ""}`}>
            {image ? <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={image} alt="پیش‌نمایش لباس جدید" /><span>تغییر عکس لباس</span></> : <div><b>＋</b><strong>عکس لباس جدید</strong><small>عکس محصول یا لباس روی مانکن</small></div>}
            <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => chooseImage(event.target.files?.[0])} />
          </label>

          <div className="formGrid purchaseFields">
            <label><span>نام لباس</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="مثلاً کت سبز" /></label>
            <label><span>دسته‌بندی</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span>رنگ اصلی</span><input value={color} onChange={(event) => setColor(event.target.value)} placeholder="مثلاً سبز تیره" /></label>
            <label><span>برای چه موقعیتی؟</span><select value={occasion} onChange={(event) => setOccasion(event.target.value)}>{occasions.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span>قیمت به تومان</span><input inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="مثلاً ۲۵۰۰۰۰۰" /></label>
            <label><span>چند بار می‌پوشی؟</span><select value={expectedUses} onChange={(event) => setExpectedUses(event.target.value)}><option value="3">۱ تا ۵ بار</option><option value="10">۶ تا ۱۴ بار</option><option value="20">۱۵ تا ۲۹ بار</option><option value="40">۳۰ بار یا بیشتر</option></select></label>
          </div>

          <fieldset className="needPicker">
            <legend>چقدر واقعاً به آن نیاز داری؟</legend>
            <div>{[1, 2, 3, 4, 5].map((value) => <label key={value}><input type="radio" name="need" value={value} checked={needLevel === String(value)} onChange={(event) => setNeedLevel(event.target.value)} /><span>{value.toLocaleString("fa-IR")}</span></label>)}</div>
            <small><b>۱</b> فقط دوستش دارم <b>۵</b> جای خالی مهمی را پر می‌کند</small>
          </fieldset>

          <div className="wardrobeSignal">
            <div><span>کمد متصل</span><strong>{ready ? `${wardrobe.length.toLocaleString("fa-IR")} آیتم` : "در حال خواندن…"}</strong></div>
            <div><span>برای {occasion}</span><strong>{wardrobeSummary.sameOccasion.toLocaleString("fa-IR")} آیتم</strong></div>
            <div><span>از دسته {category}</span><strong>{wardrobeSummary.sameCategory.toLocaleString("fa-IR")} آیتم</strong></div>
          </div>
          {!wardrobe.length && ready && <p className="emptyWardrobeHint">کمدت خالی است. می‌توانی ادامه بدهی، اما <Link href="/wardrobe">اضافه‌کردن چند لباس</Link> نتیجه را کاربردی‌تر می‌کند.</p>}
          {error && <p className="formError">{error}</p>}
          <button className="primary evaluateButton" type="submit">بررسی ارزش خرید</button>
          <p className="localNote">عکس و اطلاعات در همین مرورگر می‌مانند و به OpenAI یا سرور ارسال نمی‌شوند.</p>
        </form>

        <aside className="purchaseGuide">
          <span className="sectionLabel">فیت‌چک چه چیزهایی را می‌سنجد؟</span>
          <h2>از «دوستش دارم» تا<br />«واقعاً لازم دارم»</h2>
          <ol>
            <li><b>هماهنگی با کمد</b><span>آیا با لباس‌هایی که داری ست می‌شود؟</span></li>
            <li><b>تکراری نبودن</b><span>چند آیتم مشابه از قبل داری؟</span></li>
            <li><b>کاربرد واقعی</b><span>چند بار و برای چه موقعیتی می‌پوشی؟</span></li>
            <li><b>هزینه هر بار استفاده</b><span>قیمت در برابر تعداد استفاده احتمالی.</span></li>
          </ol>
          <div className="guideQuote">«هدف این نیست که کمتر دوست داشته باشی؛ هدف این است که مطمئن‌تر بخری.»</div>
        </aside>
      </section>

      {result && (
        <section className="purchaseResult" id="purchase-result">
          <div className={`purchaseVerdict ${result.tone}`}>
            <span>نتیجه بررسی {name.trim() || "لباس جدید"}</span>
            <div className="scoreRing"><strong>{result.score.toLocaleString("fa-IR")}</strong><small>از ۱۰۰</small></div>
            <h2>{result.verdict}</h2>
            <p>این نتیجه قطعی یا تحلیل هوش مصنوعی نیست؛ یک ارزیابی اولیه بر اساس کمد و پاسخ‌های توست.</p>
          </div>
          <div className="purchaseAnalysis">
            <div className="resultStats">
              <div><span>ست‌های اولیه</span><strong>{result.matchCount.toLocaleString("fa-IR")}</strong></div>
              <div><span>آیتم مشابه</span><strong>{result.duplicateCount.toLocaleString("fa-IR")}</strong></div>
              <div><span>هزینه هر بار پوشیدن</span><strong>{result.costPerWear ? `${result.costPerWear.toLocaleString("fa-IR")} تومان` : "قیمت وارد نشده"}</strong></div>
            </div>
            <div className="reasonColumns">
              <article><span>چرا؟</span><ul>{result.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></article>
              <article><span>به این نکته توجه کن</span><ul>{result.considerations.map((item) => <li key={item}>{item}</li>)}</ul></article>
            </div>
            {result.matches.length > 0 && <div className="matchStrip"><div><span className="sectionLabel">از کمد تو</span><h3>با این‌ها امتحانش کن</h3></div><div>{result.matches.map((item) => <figure key={item.id}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={item.image} alt={item.name} /><figcaption>{item.name}</figcaption></figure>)}</div></div>}
            <button className="secondary" type="button" onClick={() => { setResult(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}>بررسی یک لباس دیگر</button>
          </div>
        </section>
      )}
    </main>
  );
}
