"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { Group } from "three";

const COLORS = [
  { name: "رز خاکی", value: "#ad6670" },
  { name: "سبز زیتونی", value: "#667a62" },
  { name: "مشکی", value: "#282326" }
];

function Garment({ color, paused }: { color: string; paused: boolean }) {
  const group = useRef<Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    if (!paused) group.current.rotation.y += delta * 0.34;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 1.15) * 0.06;
  });

  return (
    <group ref={group} rotation={[0.08, -0.45, 0]}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[1.55, 2.05, 0.48, 8, 8, 4]} />
        <meshStandardMaterial color={color} roughness={0.68} metalness={0.02} />
      </mesh>

      <mesh position={[-1.04, 0.3, 0]} rotation={[0, 0, -0.58]} castShadow>
        <capsuleGeometry args={[0.27, 1.25, 8, 20]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[1.04, 0.3, 0]} rotation={[0, 0, 0.58]} castShadow>
        <capsuleGeometry args={[0.27, 1.25, 8, 20]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>

      <mesh position={[0, 1.02, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.38, 0.09, 12, 32]} />
        <meshStandardMaterial color="#f1ddd9" roughness={0.72} />
      </mesh>
      <mesh position={[0, -0.94, 0.04]}>
        <boxGeometry args={[1.65, 0.18, 0.54]} />
        <meshStandardMaterial color={color} roughness={0.76} />
      </mesh>

      {[-0.45, 0, 0.45].map((y) => (
        <mesh key={y} position={[0.28, y, 0.28]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color="#f5e9e5" roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

export default function ThreeGarmentShowcase() {
  const [color, setColor] = useState(COLORS[0].value);
  const [paused, setPaused] = useState(false);

  return (
    <section className="threeShowcase" aria-labelledby="three-title">
      <div className="threeCopy">
        <span className="sectionLabel">پیش‌نمایش سه‌بعدی · نسخه آزمایشی</span>
        <h2 id="three-title">لباس را از زاویه‌ای تازه ببین.</h2>
        <p>
          این استودیوی تعاملی با Three.js ساخته شده است. فعلاً نمایش سه‌بعدی مسیر آینده محصول را نشان می‌دهد؛
          تحلیل خرید و پرو تصویری در مرحله بعد به مدل هوش مصنوعی متصل می‌شوند.
        </p>
        <div className="colorPicker" aria-label="انتخاب رنگ لباس">
          {COLORS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={color === item.value ? "selected" : ""}
              onClick={() => setColor(item.value)}
              aria-label={`رنگ ${item.name}`}
              aria-pressed={color === item.value}
            >
              <i style={{ backgroundColor: item.value }} />
              {item.name}
            </button>
          ))}
        </div>
        <button className="threeControl" type="button" onClick={() => setPaused((value) => !value)}>
          {paused ? "ادامه چرخش" : "توقف چرخش"}
        </button>
      </div>

      <div className="threeCanvasWrap">
        <div className="threeBadge"><i /> رندر زنده در مرورگر</div>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0.15, 5.4], fov: 38 }}
          gl={{ antialias: true, alpha: true }}
          shadows
          aria-label="مدل سه‌بعدی تعاملی یک لباس"
        >
          <ambientLight intensity={1.35} />
          <directionalLight position={[3, 4, 5]} intensity={2.5} castShadow />
          <pointLight position={[-3, 0, 2]} intensity={1.2} color="#e8b6ba" />
          <Garment color={color} paused={paused} />
          <mesh position={[0, -1.55, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[2.2, 48]} />
            <shadowMaterial transparent opacity={0.16} />
          </mesh>
        </Canvas>
        <span className="threeHint">رنگ را انتخاب کن و مدل را زنده ببین</span>
      </div>
    </section>
  );
}
