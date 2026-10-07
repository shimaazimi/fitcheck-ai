"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FlowStepper from "../../components/FlowStepper";
import SiteNav from "../../components/SiteNav";

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

type Outfit = {
  title: string;
  items: WardrobeItem[];
  reason: string;
  missing: string[];
  score: number;
};

const STORAGE_KEY = "fitcheck-wardrobe-v1";
const occasions = ["روزمره", "محل کار", "دانشگاه", "مهمانی", "ورزش", "سفر", "رسمی"];
const seasons = ["همه فصل‌ها", "بهار", "تابستان", "پاییز", "زمستان"];
const moods = [
  { value: "راحت", label: "راحت و بی‌دردسر", hint: "اولویت با راحتی و کاربرد" },
  { value: "مینیمال", label: "مینیمال", hint: "ساده، تمیز و هماهنگ" },
  { value: "مرتب", label: "مرتب و شیک", hint: "کمی رسمی‌تر و ساختارمند" },
  { value: "جسور", label: "جسور و متفاوت", hint: "ترکیب چشمگیرتر" }
];

const sampleItems: WardrobeItem[] = [
  { id: "sample-1", name: "کت سبز تیره", image: "/demo/garment.png", category: "مانتو و کت", color: "سبز تیره", season: "همه فصل‌ها", occasion: "روزمره", notes: "", createdAt: 1 },
  { id: "sample-2", name: "شلوار راسته مشکی", image: "", category: "شلوار", color: "مشکی", season: "همه فصل‌ها", occasion: "روزمره", notes: "", createdAt: 2 },
  { id: "sample-3", name: "کتانی سفید", image: "", category: "کفش", color: "سفید", season: "همه فصل‌ها", occasion: "روزمره", notes: "", createdAt: 3 },
  { id: "sample-4", name: "کیف ساختارمند", image: "", category: "کیف", color: "مشکی", season: "همه فصل‌ها", occasion: "محل کار", notes: "", createdAt: 4 },
  { id: "sample-5", name: "شومیز کرم", image: "", category: "بالاپوش", color: "کرم", season: "بهار", occasion: "محل کار", notes: "", createdAt: 5 }
];

const groups = {
  top: ["بالاپوش", "مانتو و کت"],
  onePiece: ["پیراهن"],
  bottom: ["شلوار", "دامن"],
  shoes: ["کفش"],
  finishing: ["کیف", "اکسسوری"]
};

function pick(items: WardrobeItem[], categories: string[], index: number) {
  const pool = items.filter((item) => categories.includes(item.category));
  return pool.length ? pool[index % pool.length] : null;
}

function unique(items: Array<WardrobeItem | null>) {
  return items.filter((item, index, all): item is WardrobeItem => Boolean(item) && all.findIndex((entry) => entry?.id === item?.id) === index);
}

function buildOutfits(items: WardrobeItem[], occasion: string, season: string, mood: string): Outfit[] {
  const ranked = [...items].sort((a, b) => {
    const score = (item: WardrobeItem) =>
      (item.occasion === occasion ? 5 : item.occasion === "روزمره" ? 2 : 0) +
      (season === "همه فصل‌ها" || item.season === season || item.season === "همه فصل‌ها" ? 3 : 0);
    return score(b) - score(a) || b.createdAt - a.createdAt;
  });

  return [0, 1, 2].map((index) => {
    const dress = pick(ranked, groups.onePiece, index);
    const top = pick(ranked, groups.top, index);
    const bottom = pick(ranked, groups.bottom, index + (mood === "جسور" ? 1 : 0));
    const shoes = pick(ranked, groups.shoes, index);
    const finishing = pick(ranked, groups.finishing, index);
    const outfitItems = unique(dress ? [dress, shoes, finishing] : [top, bottom, shoes, finishing]);
    const missing: string[] = [];
    if (!dress && !top) missing.push("بالاپوش یا پیراهن");
    if (!dress && !bottom) missing.push("شلوار یا دامن");
    if (!shoes) missing.push("کفش");
    const occasionMatches = outfitItems.filter((item) => item.occasion === occasion).length;
    const seasonMatches = outfitItems.filter((item) => season === "همه فصل‌ها" || item.season === season || item.season === "همه فصل‌ها").length;
    const score = Math.min(96, 42 + outfitItems.length * 9 + occasionMatches * 4 + seasonMatches * 2 - missing.length * 6);
    const labels = ["پیشنهاد اصلی", "ترکیب جایگزین", "انتخاب متفاوت"];
    const reason = occasion === "مهمانی" || occasion === "رسمی"
      ? `ترکیبی ${mood} با تمرکز روی ظاهر مرتب و مناسب ${occasion}.`
      : `ترکیبی ${mood} برای ${occasion} که از آیتم‌های قابل‌استفاده کمدت ساخته شده است.`;
    return { title: labels[index], items: outfitItems, reason, missing, score };
  }).filter((outfit, index, all) => outfit.items.length > 0 && all.findIndex((entry) => entry.items.map((item) => item.id).sort().join("-") === outfit.items.map((item) => item.id).sort().join("-")) === index);
}

function ItemVisual({ item }: { item: WardrobeItem }) {
  return (
    <figure className={`occasionItem ${item.image ? "hasPhoto" : "placeholderItem"}`}>
      {item.image ? <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={item.image} alt={item.name} /></> : <div data-category={item.category}><span>{item.category}</span></div>}
      <figcaption><strong>{item.name}</strong><small>{item.color}</small></figcaption>
    </figure>
  );
}

export default function OccasionPage() {
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [ready, setReady] = useState(false);
  const [occasion, setOccasion] = useState("دانشگاه");
  const [season, setSeason] = useState("همه فصل‌ها");
  const [mood, setMood] = useState("راحت");
  const [note, setNote] = useState("");
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [sampleMode, setSampleMode] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setWardrobe(JSON.parse(saved));
    } finally {
      setReady(true);
    }
  }, []);

  const relevantCount = useMemo(() => wardrobe.filter((item) => item.occasion === occasion || item.occasion === "روزمره").length, [wardrobe, occasion]);

  function generate(useSample = false) {
    const source = useSample ? sampleItems : wardrobe;
    setSampleMode(useSample);
    setOutfits(buildOutfits(source, occasion, season, mood));
    requestAnimationFrame(() => document.getElementById("occasion-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <main className="shell occasionShell">
      <SiteNav active="occasion" />
      <FlowStepper active="occasion" />

      <section className="occasionHero">
        <div className="eyebrow"><span /> مرحله ۲ · انتخاب از کمد خودت</div>
        <h1>کجا می‌روی؟<br /><em>با همین‌ها ست کن.</em></h1>
        <p>موقعیت و حال‌وهوایت را بگو؛ فیت‌چک از لباس‌هایی که داری چند ترکیب کاربردی پیشنهاد می‌دهد.</p>
        <div className="occasionStats"><span><b>{wardrobe.length.toLocaleString("fa-IR")}</b> آیتم در کمد</span><span><b>{relevantCount.toLocaleString("fa-IR")}</b> انتخاب مرتبط</span><span>بدون اتصال AI</span></div>
      </section>

      <section className="occasionPlanner">
        <div className="plannerStep">
          <div className="plannerHeading"><span>۰۱</span><div><small>موقعیت</small><h2>برای کجا آماده می‌شوی؟</h2></div></div>
          <div className="choiceGrid occasionChoices">{occasions.map((value) => <button className={occasion === value ? "selected" : ""} type="button" key={value} onClick={() => { setOccasion(value); setOutfits([]); }}>{value}</button>)}</div>
        </div>

        <div className="plannerStep">
          <div className="plannerHeading"><span>۰۲</span><div><small>شرایط</small><h2>فصل و حس امروزت</h2></div></div>
          <div className="plannerControls">
            <label><span>فصل</span><select value={season} onChange={(event) => { setSeason(event.target.value); setOutfits([]); }}>{seasons.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span>نکته اختیاری</span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="مثلاً زیاد پیاده‌روی دارم" /></label>
          </div>
          <div className="moodGrid">{moods.map((option) => <button className={mood === option.value ? "selected" : ""} type="button" key={option.value} onClick={() => { setMood(option.value); setOutfits([]); }}><b>{option.label}</b><small>{option.hint}</small></button>)}</div>
        </div>

        <div className="plannerAction">
          <div><strong>{ready ? (wardrobe.length ? "کمدت برای پیشنهاد آماده است" : "کمدت هنوز خالی است") : "در حال خواندن کمد…"}</strong><span>{wardrobe.length ? `${relevantCount.toLocaleString("fa-IR")} آیتم متناسب با انتخاب فعلی پیدا شد.` : "چند لباس اضافه کن یا اول نمونه را ببین."}</span></div>
          <div>
            {wardrobe.length > 0 && <button className="primary" type="button" onClick={() => generate(false)}>ساخت پیشنهاد از کمد من</button>}
            <button className="secondary" type="button" onClick={() => generate(true)}>مشاهده پیشنهاد نمونه</button>
          </div>
        </div>
      </section>

      {!wardrobe.length && ready && <section className="occasionEmpty"><div><b>کمد دیجیتال، قلب پیشنهادهاست.</b><span>با اضافه‌کردن چند بالاپوش، شلوار و کفش، پیشنهادها شخصی‌تر می‌شوند.</span></div><Link className="secondary buttonLink" href="/wardrobe">رفتن به کمد من</Link></section>}

      {outfits.length > 0 && (
        <section className="occasionResults" id="occasion-results">
          <div className="resultsHeading"><div><span className="sectionLabel">{sampleMode ? "نتیجه نمونه" : "از کمد تو"}</span><h2>پیشنهاد برای {occasion}</h2><p>{mood} · {season}{note.trim() ? ` · ${note.trim()}` : ""}</p></div><div className="prototypeBadge"><i /> پیشنهاد قانون‌محور بدون AI</div></div>
          <div className="outfitGrid">{outfits.map((outfit) => <article className="outfitCard" key={outfit.title}>
            <div className="outfitTop"><div><span>{outfit.title}</span><h3>{mood} برای {occasion}</h3></div><b>{outfit.score.toLocaleString("fa-IR")}٪</b></div>
            <div className="outfitItems">{outfit.items.map((item) => <ItemVisual item={item} key={item.id} />)}</div>
            <p>{outfit.reason}</p>
            {outfit.missing.length > 0 && <div className="missingPieces"><b>برای کامل‌ترشدن:</b> {outfit.missing.join("، ")}</div>}
          </article>)}</div>
          <div className="occasionDisclaimer">این پیشنهادها بر اساس دسته‌بندی، فصل و موقعیت ثبت‌شده لباس‌ها ساخته می‌شوند. در نسخه بعدی، AI رنگ، فرم و جزئیات تصویر را هم تحلیل می‌کند.</div>
        </section>
      )}
    </main>
  );
}
