"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { DoubleSide, PlaneGeometry, SRGBColorSpace, TextureLoader, type Group } from "three";

const DEFAULT_GARMENT = "/demo/garment.png";
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const STORAGE_KEY = "fitcheck-wardrobe-v1";

type WardrobeItem = {
  id: string;
  name: string;
  image: string;
  category: string;
  color: string;
};

const sampleSet: WardrobeItem[] = [
  { id: "sample-bottom", name: "شلوار راسته مشکی", category: "شلوار", color: "مشکی", image: "" },
  { id: "sample-shoes", name: "کتانی سفید", category: "کفش", color: "سفید", image: "" },
  { id: "sample-bag", name: "کیف ساختارمند", category: "کیف", color: "مشکی", image: "" }
];

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

async function createCutout(source: string) {
  const image = await loadImage(source);
  const scale = Math.min(1, 760 / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("canvas");
  context.drawImage(image, 0, 0, width, height);

  const pixels = context.getImageData(0, 0, width, height);
  const data = pixels.data;
  const corners = [0, width - 1, (height - 1) * width, height * width - 1];
  const background = corners.reduce((color, index) => {
    color[0] += data[index * 4];
    color[1] += data[index * 4 + 1];
    color[2] += data[index * 4 + 2];
    return color;
  }, [0, 0, 0]).map((value) => value / corners.length);

  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let start = 0;
  let end = 0;
  const thresholdSquared = 74 * 74;
  const canRemove = (index: number) => {
    const offset = index * 4;
    const dr = data[offset] - background[0];
    const dg = data[offset + 1] - background[1];
    const db = data[offset + 2] - background[2];
    return dr * dr + dg * dg + db * db < thresholdSquared;
  };
  const add = (index: number) => {
    if (visited[index] || !canRemove(index)) return;
    visited[index] = 1;
    queue[end++] = index;
  };

  for (let x = 0; x < width; x += 1) {
    add(x);
    add((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    add(y * width);
    add(y * width + width - 1);
  }
  while (start < end) {
    const index = queue[start++];
    const x = index % width;
    if (x > 0) add(index - 1);
    if (x < width - 1) add(index + 1);
    if (index >= width) add(index - width);
    if (index < width * (height - 1)) add(index + width);
  }
  for (let index = 0; index < visited.length; index += 1) {
    if (visited[index]) data[index * 4 + 3] = 0;
  }
  context.putImageData(pixels, 0, 0);

  return { url: canvas.toDataURL("image/png"), aspect: width / height };
}

function GarmentCutout({ imageUrl, aspect, paused }: { imageUrl: string; aspect: number; paused: boolean }) {
  const group = useRef<Group>(null);
  const texture = useLoader(TextureLoader, imageUrl);
  const maxHeight = 3.4;
  const width = Math.min(3.05, maxHeight * aspect);
  const height = width / aspect;
  const geometry = useMemo(() => {
    const shape = new PlaneGeometry(width, height, 28, 32);
    const positions = shape.attributes.position;
    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index);
      const y = positions.getY(index);
      const curve = Math.cos((x / width) * Math.PI) * 0.14;
      const drape = Math.sin((y / height) * Math.PI * 2) * 0.025 * (1 - Math.abs(x) / (width / 2));
      positions.setZ(index, curve + drape);
    }
    positions.needsUpdate = true;
    shape.computeVertexNormals();
    return shape;
  }, [height, width]);

  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    if (!group.current) return;
    if (!paused) group.current.rotation.y += delta * 0.34;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 1.05) * 0.08;
    group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.55) * 0.018;
  });

  return (
    <group ref={group} rotation={[0.03, -0.38, 0]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.08}
          roughness={0.78}
          metalness={0.01}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

function OutfitItem({ item }: { item: WardrobeItem }) {
  return (
    <figure className="threeOutfitItem">
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt={item.name} />
      ) : (
        <div data-category={item.category}><span>{item.category}</span></div>
      )}
      <figcaption><strong>{item.name}</strong><small>{item.color}</small></figcaption>
    </figure>
  );
}

export default function ThreeGarmentShowcase() {
  const [sourceUrl, setSourceUrl] = useState(DEFAULT_GARMENT);
  const [renderUrl, setRenderUrl] = useState(DEFAULT_GARMENT);
  const [imageName, setImageName] = useState("پیراهن سبز نمونه");
  const [aspect, setAspect] = useState(0.82);
  const [paused, setPaused] = useState(false);
  const [processing, setProcessing] = useState(true);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setWardrobe(JSON.parse(saved));
    } catch {
      setWardrobe([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    setProcessing(true);
    createCutout(sourceUrl)
      .then((result) => {
        if (!active) {
          return;
        }
        setRenderUrl(result.url);
        setAspect(Math.max(0.45, Math.min(1.8, result.aspect)));
        setError(null);
      })
      .catch(() => {
        if (active) {
          setRenderUrl(sourceUrl);
          setError("حذف پس‌زمینه این عکس ممکن نشد؛ تصویر اصلی نمایش داده می‌شود.");
        }
      })
      .finally(() => active && setProcessing(false));
    return () => { active = false; };
  }, [sourceUrl]);

  const outfit = useMemo(() => {
    const preferredOrder = ["شلوار", "دامن", "کفش", "کیف", "اکسسوری"];
    const selected = preferredOrder
      .map((category) => wardrobe.find((item) => item.category === category))
      .filter((item): item is WardrobeItem => Boolean(item))
      .slice(0, 3);
    return selected.length >= 2 ? selected : sampleSet;
  }, [wardrobe]);

  const missing = useMemo(() => {
    const owned = new Set(wardrobe.map((item) => item.category));
    const options = [
      { category: "شلوار", title: "شلوار راسته خنثی", reason: "پایه‌ی کاربردی برای ست‌های روزمره" },
      { category: "کفش", title: "کتانی سفید ساده", reason: "هماهنگ با بیشتر رنگ‌های کمد" },
      { category: "کیف", title: "کیف مینیمال مشکی", reason: "برای کامل‌کردن استایل روز و کار" },
      { category: "اکسسوری", title: "اکسسوری ظریف", reason: "جزئیات بیشتر بدون شلوغی" }
    ];
    return options.find((item) => !owned.has(item.category)) ?? options[3];
  }, [wardrobe]);

  async function chooseGarment(event: ChangeEvent<HTMLInputElement>) {
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
    event.target.value = "";
    try {
      const nextUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setSourceUrl(nextUrl);
      setImageName(file.name);
      setPaused(false);
      setError(null);
    } catch {
      setError("خواندن این عکس ممکن نشد؛ یک فایل دیگر انتخاب کن.");
    }
  }

  return (
    <section className="threeShowcase" aria-labelledby="three-title">
      <div className="threeStudio">
        <div className="threeStudioHeader">
          <div>
            <span className="sectionLabel">استودیوی سه‌بعدی با عکس واقعی</span>
            <h2 id="three-title">خودِ لباس را ببین؛ نه یک عکس داخل قاب.</h2>
          </div>
          <div className="threeUploadActions">
            <label className="threeUploadButton">
              <input type="file" accept="image/jpeg,image/png,image/webp,image/bmp" onChange={chooseGarment} />
              <span aria-hidden="true">＋</span>
              {sourceUrl === DEFAULT_GARMENT ? "آپلود عکس لباس" : "تغییر عکس لباس"}
            </label>
            <button className="threeControl" type="button" onClick={() => setPaused((value) => !value)}>
              {paused ? "ادامه چرخش" : "توقف چرخش"}
            </button>
          </div>
        </div>

        <div className="threeExperience">
          <div className="threeCanvasWrap">
            <div className="threeBadge"><i /> {processing ? "در حال جداکردن لباس…" : "لباس شناور سه‌بعدی"}</div>
            <Canvas
              dpr={[1, 1.5]}
              camera={{ position: [0, 0.08, 5.3], fov: 38 }}
              gl={{ antialias: true, alpha: true }}
              aria-label="پیش‌نمایش سه‌بعدی لباس بدون قاب"
            >
              <ambientLight intensity={1.5} />
              <directionalLight position={[3, 4, 5]} intensity={2.4} />
              <pointLight position={[-3, 0, 2]} intensity={1.25} color="#e8b6ba" />
              <GarmentCutout imageUrl={renderUrl} aspect={aspect} paused={paused} />
            </Canvas>
            <span className="threeHint">لباس را زنده و بدون قاب از زاویه‌های مختلف ببین</span>
          </div>

          <aside className="threeRecommendation" aria-label="پیشنهاد ست و تکمیل کمد">
            <div className="threeRecommendationHead">
              <span>پیشنهاد فیت‌چک</span>
              <strong>این‌طوری ستش کن</strong>
              <p>{wardrobe.length ? "با انتخاب‌های موجود در کمد خودت" : "نمونه‌ی پیشنهادی تا وقتی کمدت را کامل کنی"}</p>
            </div>
            <div className="threeOutfitGrid">{outfit.map((item) => <OutfitItem item={item} key={item.id} />)}</div>
            <div className="threeAddSuggestion">
              <div className="threeAddIcon">＋</div>
              <div><small>جای خالی پیشنهادی در کمد</small><strong>{missing.title}</strong><span>{missing.reason}</span></div>
            </div>
            <Link className="threeWardrobeLink" href="/wardrobe">اگر می‌خواهی به کمدت اضافه کن <span>←</span></Link>
          </aside>
        </div>

        <div className="threeFooter">
          <div className="threeFileStatus"><i /><span>{imageName}</span><small>پس‌زمینه ساده نتیجه بهتری می‌دهد · حداکثر ۸MB</small></div>
          {error && <span className="threeUploadError" role="alert">{error}</span>}
          <p>پیشنهاد فعلی از اطلاعات کمد و قواعد ساده ساخته می‌شود؛ تحلیل تصویری هوشمند در مرحله اتصال AI فعال خواهد شد.</p>
        </div>
      </div>
    </section>
  );
}
