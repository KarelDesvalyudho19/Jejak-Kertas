import { ContactShadows, Float } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * Adegan 3D hero: tumpukan draf revisi di meja. Satu lembar teratas melayang,
 * berbalik memperlihatkan sisi belakang yang masih kosong, lalu sisi itu "tercetak" —
 * inti gagasan Eco-Paper.
 */

const W = 2.1;
const H = 2.97; // rasio A4
const CW = 420;
const CH = 594;
const KERTAS = '#FBFAF6'; // kertas-terang
const REVISI = '#D33A2C';

function acak(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function gambarDepan(ctx: CanvasRenderingContext2D, seed: number, coretan: boolean) {
  const r = acak(seed);
  ctx.fillStyle = KERTAS;
  ctx.fillRect(0, 0, CW, CH);
  // judul
  ctx.fillStyle = '#161513';
  ctx.fillRect(48, 52, 220, 13);
  ctx.fillStyle = '#6B675F';
  ctx.fillRect(48, 76, 140, 7);
  // paragraf
  let y = 118;
  const baris: number[] = [];
  for (let p = 0; p < 6; p++) {
    const n = 3 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const w = i === n - 1 ? 120 + r() * 160 : 300 + r() * 24;
      ctx.fillStyle = 'rgba(22,21,19,0.62)';
      ctx.fillRect(48, y, w, 5);
      baris.push(y);
      y += 15;
    }
    y += 12;
    if (y > CH - 70) break;
  }
  ctx.fillStyle = 'rgba(22,21,19,0.4)';
  ctx.fillRect(CW / 2 - 8, CH - 36, 16, 5);
  if (!coretan) return;
  // satu coretan dosen: garis bawah tipis + catatan
  const yy = baris[3] + 9;
  ctx.strokeStyle = REVISI;
  ctx.lineCap = 'round';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(48, yy);
  ctx.bezierCurveTo(130, yy - 3, 220, yy + 3, 330, yy - 1);
  ctx.stroke();
  ctx.font = 'italic 600 26px Spectral, Georgia, serif';
  ctx.fillStyle = REVISI;
  ctx.save();
  ctx.translate(262, 104);
  ctx.rotate(-0.08);
  ctx.fillText('revisi lagi', 0, 0);
  ctx.restore();
}

function gambarBelakang(ctx: CanvasRenderingContext2D, progres: number) {
  ctx.fillStyle = KERTAS;
  ctx.fillRect(0, 0, CW, CH);
  // bayangan tinta tembus dari sisi depan (samar & terbalik)
  ctx.fillStyle = 'rgba(22,21,19,0.035)';
  for (let y = 118; y < CH - 80; y += 15) ctx.fillRect(CW - 48 - 310, y, 310, 5);
  // cap kecil Eco-Paper
  ctx.strokeStyle = 'rgba(47,93,80,0.75)';
  ctx.lineWidth = 2;
  ctx.strokeRect(CW - 140, CH - 62, 96, 26);
  ctx.font = '600 12px "IBM Plex Mono", monospace';
  ctx.fillStyle = 'rgba(47,93,80,0.85)';
  ctx.fillText('ECO-PAPER', CW - 130, CH - 44);
  // baris tercetak sesuai progres
  const total = 26;
  const n = Math.floor(total * progres);
  ctx.font = '600 11px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#6B675F';
  if (progres > 0.02) ctx.fillText('DRAF · BIMBINGAN', 48, 44);
  let y = 70;
  const r = acak(7);
  for (let i = 0; i < total; i++) {
    const w = i % 6 === 0 ? 180 : i % 6 === 5 ? 90 + r() * 120 : 290 + r() * 30;
    if (i < n) {
      ctx.fillStyle = i % 6 === 0 ? '#161513' : 'rgba(22,21,19,0.7)';
      ctx.fillRect(48, y, w, i % 6 === 0 ? 9 : 5);
    }
    y += i % 6 === 5 ? 26 : 16;
  }
  // kepala cetak
  if (progres > 0 && progres < 1) {
    const yh = 70 + n * 16.6;
    ctx.fillStyle = REVISI;
    ctx.fillRect(36, yh, CW - 72, 2);
  }
}

function useKanvas(gambar: (ctx: CanvasRenderingContext2D) => void) {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = CW;
    c.height = CH;
    const ctx = c.getContext('2d')!;
    gambar(ctx);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return { tex: t, ctx };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Geometri kertas sedikit melengkung agar tidak terasa seperti kartu kaku. */
function useGeometriKertas(lengkung = 0.06) {
  return useMemo(() => {
    const g = new THREE.PlaneGeometry(W, H, 24, 1);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) / (W / 2);
      pos.setZ(i, lengkung * x * x);
    }
    g.computeVertexNormals();
    return g;
  }, [lengkung]);
}

function Tumpukan() {
  const geo = useGeometriKertas(0.015);
  const lembar = useMemo(() => {
    const r = acak(42);
    return Array.from({ length: 9 }, (_, i) => ({
      rot: (r() - 0.5) * 0.22,
      x: (r() - 0.5) * 0.14,
      z: (r() - 0.5) * 0.14,
      y: i * 0.018,
      seed: 100 + i,
    }));
  }, []);
  const atas = useKanvas((ctx) => gambarDepan(ctx, 311, true));
  return (
    <group position={[0.15, -1.15, 0]}>
      {lembar.map((l, i) => (
        <mesh key={i} geometry={geo} position={[l.x, l.y, l.z]} rotation={[-Math.PI / 2, 0, l.rot]} castShadow receiveShadow>
          {i === lembar.length - 1 ? (
            <meshStandardMaterial map={atas.tex} roughness={0.95} side={THREE.DoubleSide} />
          ) : (
            <meshStandardMaterial color={KERTAS} roughness={1} side={THREE.DoubleSide} />
          )}
        </mesh>
      ))}
    </group>
  );
}

function LembarBerbalik({ diam }: { diam: boolean }) {
  const grup = useRef<THREE.Group>(null);
  const geo = useGeometriKertas(0.09);
  const depan = useKanvas((ctx) => gambarDepan(ctx, 2024, true));
  const belakang = useKanvas((ctx) => gambarBelakang(ctx, 0));
  const progresTerakhir = useRef(-1);

  useEffect(() => () => {
    depan.tex.dispose();
    belakang.tex.dispose();
  }, [depan, belakang]);

  useFrame(({ clock }) => {
    const g = grup.current;
    if (!g) return;
    // siklus 11 detik: tampil depan → berbalik → mencetak → tahan → kembali
    const t = diam ? 5.2 : clock.getElapsedTime() % 11;
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    let rotY = 0;
    if (t < 2.2) rotY = 0;
    else if (t < 3.6) rotY = ease((t - 2.2) / 1.4) * Math.PI;
    else if (t < 9.4) rotY = Math.PI;
    else rotY = Math.PI + ease((t - 9.4) / 1.6) * Math.PI;
    g.rotation.y = rotY + Math.sin(clock.getElapsedTime() * 0.6) * 0.08 - 0.25;
    g.rotation.x = -0.18 + Math.sin(clock.getElapsedTime() * 0.4) * 0.04;
    g.rotation.z = 0.06;

    const progres = t < 3.8 ? 0 : t < 7.6 ? (t - 3.8) / 3.8 : t < 9.6 ? 1 : 0;
    const q = Math.round(progres * 52) / 52;
    if (q !== progresTerakhir.current) {
      progresTerakhir.current = q;
      gambarBelakang(belakang.ctx, q);
      belakang.tex.needsUpdate = true;
    }
  });

  return (
    <Float speed={diam ? 0 : 1.4} rotationIntensity={0.15} floatIntensity={0.5} floatingRange={[-0.05, 0.08]}>
      <group ref={grup} position={[0.1, 0.55, 0.4]}>
        <mesh geometry={geo} castShadow>
          <meshStandardMaterial map={depan.tex} roughness={0.92} side={THREE.FrontSide} />
        </mesh>
        <mesh geometry={geo} rotation={[0, Math.PI, 0]} position={[0, 0, -0.002]} castShadow>
          <meshStandardMaterial map={belakang.tex} roughness={0.92} side={THREE.FrontSide} />
        </mesh>
      </group>
    </Float>
  );
}

export default function MejaRevisi() {
  const diam = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return (
    <Canvas flat shadows dpr={[1, 1.75]} camera={{ position: [0, 1.6, 5.6], fov: 38 }} gl={{ antialias: true, alpha: true }} aria-label="Ilustrasi tumpukan draf revisi; satu lembar berbalik dan sisi kosongnya dicetak ulang">
      {/* three r170: diffuse = albedo × (ambient + lampu·cos) ÷ π. Total ≈ 3 agar kertas tampil putih, tidak abu. */}
      <ambientLight intensity={2.3} color="#FFFFFF" />
      <directionalLight position={[3.5, 6, 4]} intensity={1.2} color="#FFFFFF" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      <directionalLight position={[-4, 2, -2]} intensity={0.3} color="#FFFFFF" />
      {/* Ukuran adegan diatur lewat skala grup, bukan kamera: prop camera hanya dibaca sekali saat Canvas dibuat. */}
      <group scale={0.7} position={[0, -0.15, 0]}>
        <Tumpukan />
        <LembarBerbalik diam={!!diam} />
        {/* Bidang bayangan kecil (memudar sebelum tepi kanvas) dan far pendek: hanya tumpukan di lantai yang membayang. */}
        <ContactShadows position={[0, -1.17, 0]} opacity={0.22} scale={4.5} blur={2.4} far={0.45} color="#161513" />
      </group>
    </Canvas>
  );
}
