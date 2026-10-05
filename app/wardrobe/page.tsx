"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

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

const STORAGE_KEY = "fitcheck-wardrobe-v1";
const categories = ["بالاپوش", "پیراهن", "شلوار", "دامن", "مانتو و کت", "کفش", "کیف", "اکسسوری", "سایر"];
const seasons = ["همه فصل‌ها", "بهار", "تابستان", "پاییز", "زمستان"];
const occasions = ["روزمره", "محل کار", "دانشگاه", "مهمانی", "ورزش", "سفر", "رسمی"];

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("خواندن عکس انجام نشد."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("فرمت عکس قابل‌استفاده نیست."));
      image.onload = () => {
        const maxSide = 1000;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("پردازش عکس انجام نشد."));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.76));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [ready, setReady] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [color, setColor] = useState("");
  const [season, setSeason] = useState(seasons[0]);
  const [occasion, setOccasion] = useState(occasions[0]);
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("همه");
  const [occasionFilter, setOccasionFilter] = useState("همه");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {
      setError("اطلاعات قبلی کمد خوانده نشد.");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      setError("حافظه مرورگر پر شده است؛ چند عکس را حذف یا با حجم کمتر اضافه کن.");
    }
  }, [items, ready]);

  const visibleItems = useMemo(
    () => items.filter((item) =>
      (categoryFilter === "همه" || item.category === categoryFilter) &&
      (occasionFilter === "همه" || item.occasion === occasionFilter)
    ),
    [items, categoryFilter, occasionFilter]
  );

  async function chooseImage(file?: File) {
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      setError("حجم عکس باید کمتر از ۱۲ مگابایت باشد.");
      return;
    }
    setError("");
    try {
      setImage(await resizeImage(file));
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "پردازش عکس انجام نشد.");
    }
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setCategory(categories[0]);
    setColor("");
    setSeason(seasons[0]);
    setOccasion(occasions[0]);
    setNotes("");
    setImage("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function saveItem(event: FormEvent) {
    event.preventDefault();
    if (!image) {
      setError("ابتدا یک عکس از لباس انتخاب کن.");
      return;
    }
    const item: WardrobeItem = {
      id: editingId ?? crypto.randomUUID(),
      name: name.trim() || category,
      image,
      category,
      color: color.trim() || "نامشخص",
      season,
      occasion,
      notes: notes.trim(),
      createdAt: editingId ? items.find((entry) => entry.id === editingId)?.createdAt ?? Date.now() : Date.now()
    };
    setItems((current) => editingId ? current.map((entry) => entry.id === editingId ? item : entry) : [item, ...current]);
    resetForm();
  }

  function editItem(item: WardrobeItem) {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    setColor(item.color === "نامشخص" ? "" : item.color);
    setSeason(item.season);
    setOccasion(item.occasion);
    setNotes(item.notes);
    setImage(item.image);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function removeItem(item: WardrobeItem) {
    if (!window.confirm(`«${item.name}» از کمد حذف شود؟`)) return;
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    if (editingId === item.id) resetForm();
  }

  return (
    <main className="shell wardrobeShell">
      <nav className="nav">
        <Link className="brand brandLink" href="/">فیت‌چک</Link>
        <div className="navActions">
          <span className="badge">نسخه آزمایشی کمد</span>
          <Link className="navLink active" href="/wardrobe">کمد من</Link>
        </div>
      </nav>

      <section className="wardrobeHero">
        <div>
          <div className="eyebrow"><span /> قدم اول برای استایل شخصی</div>
          <h1>کمد من</h1>
          <p>لباس‌هایت را ثبت کن تا فیت‌چک کم‌کم سلیقه، رنگ‌ها و انتخاب‌های تو را بشناسد.</p>
        </div>
        <div className="wardrobeCount"><strong>{items.length}</strong><span>آیتم ثبت‌شده</span></div>
      </section>

      <section className="wardrobeLayout">
        <form className="wardrobeForm" onSubmit={saveItem}>
          <div className="formHeading">
            <div><span>آیتم جدید</span><h2>{editingId ? "ویرایش لباس" : "یک لباس اضافه کن"}</h2></div>
            {editingId && <button type="button" className="textButton" onClick={resetForm}>انصراف</button>}
          </div>

          <label className={`photoPicker ${image ? "hasImage" : ""}`}>
            {image ? <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={image} alt="پیش‌نمایش لباس" /><span>تغییر عکس</span></> : <div><b>＋</b><strong>عکس لباس را اضافه کن</strong><small>عکس روشن با پس‌زمینه ساده بهتر است</small></div>}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => chooseImage(event.target.files?.[0])} />
          </label>

          <div className="formGrid">
            <label><span>نام لباس</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="مثلاً کت سبز" /></label>
            <label><span>دسته‌بندی</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span>رنگ</span><input value={color} onChange={(event) => setColor(event.target.value)} placeholder="مثلاً سبز تیره" /></label>
            <label><span>فصل</span><select value={season} onChange={(event) => setSeason(event.target.value)}>{seasons.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span>موقعیت اصلی</span><select value={occasion} onChange={(event) => setOccasion(event.target.value)}>{occasions.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span>یادداشت اختیاری</span><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="مثلاً کمی آزاد است" /></label>
          </div>
          {error && <p className="formError">{error}</p>}
          <button className="primary saveWardrobe" type="submit">{editingId ? "ذخیره تغییرات" : "اضافه‌کردن به کمد"}</button>
          <p className="localNote">اطلاعات فعلاً فقط در همین مرورگر ذخیره می‌شود و جایی ارسال نمی‌شود.</p>
        </form>

        <section className="wardrobeCollection">
          <div className="collectionTop">
            <div><span className="sectionLabel">مجموعه شخصی</span><h2>لباس‌های من</h2></div>
            <div className="filters">
              <select aria-label="فیلتر دسته‌بندی" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option>همه</option>{categories.map((value) => <option key={value}>{value}</option>)}</select>
              <select aria-label="فیلتر موقعیت" value={occasionFilter} onChange={(event) => setOccasionFilter(event.target.value)}><option>همه</option>{occasions.map((value) => <option key={value}>{value}</option>)}</select>
            </div>
          </div>

          {!ready ? <div className="emptyWardrobe">در حال آماده‌سازی کمد…</div> : visibleItems.length === 0 ? (
            <div className="emptyWardrobe"><b>✦</b><h3>{items.length ? "لباسی با این فیلتر پیدا نشد" : "کمدت هنوز خالی است"}</h3><p>{items.length ? "فیلترها را تغییر بده." : "اولین لباس را از فرم کناری اضافه کن."}</p></div>
          ) : (
            <div className="wardrobeGrid">
              {visibleItems.map((item) => (
                <article className="wardrobeItem" key={item.id}>
                  <div className="itemPhoto">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={item.image} alt={item.name} /><span>{item.occasion}</span></div>
                  <div className="itemBody"><h3>{item.name}</h3><p>{item.category} · {item.color} · {item.season}</p>{item.notes && <small>{item.notes}</small>}</div>
                  <div className="itemActions"><button type="button" onClick={() => editItem(item)}>ویرایش</button><button type="button" className="dangerButton" onClick={() => removeItem(item)}>حذف</button></div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
