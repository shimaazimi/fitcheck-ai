"use client";

import { ChangeEvent, useRef } from "react";

type Props = {
  title: string;
  description: string;
  preview: string | null;
  onFile: (file: File) => void;
};

export default function ImageUploader({ title, description, preview, onFile }: Props) {
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
              Replace image
            </button>
          </>
        ) : (
          <div className="uploadCopy">
            <strong>Drop or choose an image</strong>
            <span>JPG, PNG or WEBP · clear, well-lit photos work best</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} />
      </div>
    </section>
  );
}
