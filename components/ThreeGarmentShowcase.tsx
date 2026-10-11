"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { DoubleSide, SRGBColorSpace, TextureLoader, type Group } from "three";

const DEFAULT_GARMENT = "/demo/garment.png";
const MAX_FILE_SIZE = 8 * 1024 * 1024;

function GarmentPhoto({ imageUrl, aspect, paused }: { imageUrl: string; aspect: number; paused: boolean }) {
  const group = useRef<Group>(null);
  const texture = useLoader(TextureLoader, imageUrl);
  const maxHeight = 2.9;
  const width = Math.min(2.55, maxHeight * aspect);
  const height = width / aspect;

  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame((state, delta) => {
    if (!group.current) return;
    if (!paused) group.current.rotation.y += delta * 0.32;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 1.1) * 0.06;
  });

  return (
    <group ref={group} rotation={[0.04, -0.35, 0]}>
      <mesh castShadow>
        <boxGeometry args={[width + 0.16, height + 0.16, 0.12]} />
        <meshStandardMaterial color="#fffaf7" roughness={0.62} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0, 0.066]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} toneMapped={false} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0, -0.066]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} toneMapped={false} side={DoubleSide} />
      </mesh>
    </group>
  );
}

export default function ThreeGarmentShowcase() {
  const [imageUrl, setImageUrl] = useState(DEFAULT_GARMENT);
  const [imageName, setImageName] = useState("نمونه لباس فیت‌چک");
  const [aspect, setAspect] = useState(0.82);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  function chooseGarment(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("لطفاً یک فایل تصویری انتخاب کن.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("حجم عکس باید کمتر از ۸ مگابایت باشد.");
      event.target.value = "";
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      setAspect(Math.max(0.45, Math.min(1.8, image.naturalWidth / image.naturalHeight)));
      setImageUrl(nextUrl);
      setImageName(file.name);
      setPaused(false);
      setError(null);
    };
    image.onerror = () => {
      URL.revokeObjectURL(nextUrl);
      setError("این عکس قابل خواندن نیست؛ یک تصویر دیگر انتخاب کن.");
    };
    image.src = nextUrl;
    event.target.value = "";
  }

  return (
    <section className="threeShowcase" aria-labelledby="three-title">
      <div className="threeCopy">
        <span className="sectionLabel">پیش‌نمایش سه‌بعدی با عکس واقعی</span>
        <h2 id="three-title">لباست را آپلود کن و از زاویه‌های مختلف ببین.</h2>
        <p>
          یک عکس واضح از لباس انتخاب کن. فیت‌چک همان تصویر واقعی را روی کارت سه‌بعدی نمایش می‌دهد؛ عکس در این مرحله
          فقط داخل مرورگر تو باقی می‌ماند.
        </p>

        <div className="threeUploadActions">
          <label className="threeUploadButton">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/bmp" onChange={chooseGarment} />
            <span aria-hidden="true">＋</span>
            {imageUrl === DEFAULT_GARMENT ? "آپلود عکس لباس" : "تغییر عکس لباس"}
          </label>
          <button className="threeControl" type="button" onClick={() => setPaused((value) => !value)}>
            {paused ? "ادامه چرخش" : "توقف چرخش"}
          </button>
        </div>

        <div className="threeFileStatus">
          <i />
          <span>{imageName}</span>
          <small>JPG، PNG یا WEBP · حداکثر ۸MB</small>
        </div>
        {error && <span className="threeUploadError" role="alert">{error}</span>}
      </div>

      <div className="threeCanvasWrap">
        <div className="threeBadge"><i /> تصویر واقعی انتخاب‌شده</div>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0.05, 5.2], fov: 38 }}
          gl={{ antialias: true, alpha: true }}
          shadows
          aria-label="پیش‌نمایش سه‌بعدی عکس لباس انتخاب‌شده"
        >
          <ambientLight intensity={1.25} />
          <directionalLight position={[3, 4, 5]} intensity={2.2} castShadow />
          <pointLight position={[-3, 0, 2]} intensity={1.1} color="#e8b6ba" />
          <GarmentPhoto imageUrl={imageUrl} aspect={aspect} paused={paused} />
          <mesh position={[0, -1.65, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[2.2, 48]} />
            <shadowMaterial transparent opacity={0.15} />
          </mesh>
        </Canvas>
        <span className="threeHint">عکس خودت را آپلود کن؛ کارت به‌صورت زنده می‌چرخد</span>
      </div>
    </section>
  );
}
