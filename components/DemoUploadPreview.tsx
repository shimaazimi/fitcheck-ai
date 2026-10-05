"use client";

import { ChangeEvent, useState } from "react";

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("خواندن عکس انجام نشد."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

type UploadCardProps = {
  number: string;
  title: string;
  description: string;
  preview: string;
  capture: "user" | "environment";
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function UploadCard({ number, title, description, preview, capture, onChange }: UploadCardProps) {
  return (
    <label className={`demoUploadCard ${preview ? "hasPreview" : ""}`}>
      {preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={`پیش‌نمایش ${title}`} />
          <span className="replaceDemoImage">تغییر عکس</span>
        </>
      ) : (
        <div className="demoUploadEmpty">
          <b>{number}</b>
          <strong>{title}</strong>
          <span>{description}</span>
          <em>انتخاب یا گرفتن عکس</em>
        </div>
      )}
      <input type="file" accept="image/jpeg,image/png,image/webp" capture={capture} onChange={onChange} />
    </label>
  );
}

export default function DemoUploadPreview() {
  const [person, setPerson] = useState("");
  const [garment, setGarment] = useState("");
  const [error, setError] = useState("");

  async function chooseImage(event: ChangeEvent<HTMLInputElement>, type: "person" | "garment") {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      setError("حجم هر عکس باید کمتر از ۱۲ مگابایت باشد.");
      return;
    }
    setError("");
    try {
      const image = await readImage(file);
      if (type === "person") setPerson(image);
      else setGarment(image);
    } catch {
      setError("نمایش عکس انجام نشد؛ یک فایل JPG، PNG یا WEBP انتخاب کن.");
    }
  }

  function showSample() {
    document.getElementById("sample-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const ready = Boolean(person && garment);

  return (
    <section className="demoUploadSection">
      <div className="demoUploadHeading">
        <div>
          <div className="eyebrow"><span /> ورودی تجربه فیت‌چک</div>
          <h1>تو و لباسی که می‌خواهی بخری</h1>
          <p>دو عکس را انتخاب کن تا مسیر ورودی محصول را ببینی.</p>
        </div>
        <div className="prototypeBadge"><i /> نمونه تعاملی بدون اتصال AI</div>
      </div>

      <div className="demoUploadGrid">
        <UploadCard
          number="۰۱"
          title="عکس شخص"
          description="عکس واضح تمام‌قد یا روبه‌رو"
          preview={person}
          capture="user"
          onChange={(event) => chooseImage(event, "person")}
        />
        <div className="uploadFlowArrow">＋</div>
        <UploadCard
          number="۰۲"
          title="عکس لباس جدید"
          description="عکس محصول، مانکن یا Flat-lay"
          preview={garment}
          capture="environment"
          onChange={(event) => chooseImage(event, "garment")}
        />
      </div>

      <div className="demoUploadFooter">
        <div>
          <strong>{ready ? "هر دو عکس آماده‌اند" : "برای ادامه، هر دو عکس را انتخاب کن"}</strong>
          <span>عکس‌ها فقط در همین مرورگر Preview می‌شوند و به OpenAI یا هیچ سروری ارسال نمی‌شوند.</span>
        </div>
        <button className="primary" type="button" disabled={!ready} onClick={showSample}>
          مشاهده نتیجه نمونه
        </button>
      </div>
      {error && <p className="formError">{error}</p>}
    </section>
  );
}
