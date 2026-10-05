"use client";

import { ChangeEvent, useRef } from "react";

type Props = {
  title: string;
  description: string;
  preview: string | null;
  onFile: (file: File) => void;
  capture?: "user" | "environment";
};

export default function ImageUploader({ title, description, preview, onFile, capture }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onFile(file);
  }

  return (
    <section className="card">
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="uploader">
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={`${title} preview`} />
            <div className="previewShade" />
            <button className="replace" type="button" onClick={() => inputRef.current?.click()}>
              تغییر عکس
            </button>
          </>
        ) : (
          <div className="uploadCopy">
            <strong>عکس را انتخاب کن</strong>
            <span>JPG، PNG یا WEBP · عکس واضح و پرنور نتیجه بهتری می‌دهد</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture={capture}
          onChange={handleChange}
        />
      </div>
    </section>
  );
}
