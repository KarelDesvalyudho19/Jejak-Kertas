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

function acak(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function gambarDepan(ctx: CanvasRenderingContext2D, seed: number, coretan: boolean) {
  const r = acak(seed);
  ctx.fillStyle = '#FBFAF6';
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
  // coretan dosen
  ctx.strokeStyle = '#D33A2C';
  ctx.lineCap = 'round';
  ctx.lineWidth = 3;
  for (let k = 0; k < 3; k++) {
    const yy = baris[Math.floor(r() * baris.length)] + 2;
    ctx.beginPath();
    ctx.moveTo(44, yy + 2);
    ctx.bezierCurveTo(120, yy - 4, 220, yy + 6, 300 + r() * 40, yy - 1);
    ctx.stroke();
  }
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(150, baris[4] + 3, 110, 16, -0.04, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = 'italic 600 30px Fraunces, Georgia, serif';
  ctx.fillStyle = '#D33A2C';
  ctx.save();
  ctx.translate(250, 108);
  ctx.rotate(-0.12);
  ctx.fillText('revisi lagi!', 0, 0);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(368, 150);
  ctx.lineTo(368, 300);
  ctx.stroke();
  ctx.font = 'italic 22px Fraunces, Georgia, serif';
  ctx.save();
  ctx.translate(380, 290);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('sumber?', 0, 0);
  ctx.restore();
}

function gambarBelakang(ctx: CanvasRenderingContext2D, progres: number) {
  ctx.fillStyle = '#F7F4EC';
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
    ctx.fillStyle = 'rgba(211,58,44,0.85)';
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
            <meshStandardMaterial color={i % 3 === 0 ? '#EFEBE1' : '#F6F3EB'} roughness={1} side={THREE.DoubleSide} />
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

function Pensil() {
  return (
    <group position={[-1.55, -1.08, 0.9]} rotation={[0, 0.7, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.055, 0.055, 2.1, 6]} />
        <meshStandardMaterial color="#D33A2C" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.13, 0]} castShadow>
        <coneGeometry args={[0.055, 0.18, 6]} />
        <meshStandardMaterial color="#C49A6C" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <coneGeometry args={[0.018, 0.05, 6]} />
        <meshStandardMaterial color="#161513" />
      </mesh>
    </group>
  );
}

export default function MejaRevisi() {
  const diam = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 1.6, 5.6], fov: 38 }} gl={{ antialias: true, alpha: true }} aria-label="Ilustrasi tumpukan draf revisi; satu lembar berbalik dan sisi kosongnya dicetak ulang">
      <ambientLight intensity={0.85} color="#FFF8EC" />
      <directionalLight position={[3.5, 6, 4]} intensity={1.6} color="#FFF3DF" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      <directionalLight position={[-4, 2, -2]} intensity={0.35} color="#DDE6FF" />
      <Tumpukan />
      <LembarBerbalik diam={!!diam} />
      <Pensil />
      <ContactShadows position={[0, -1.17, 0]} opacity={0.32} scale={9} blur={2.6} far={3} color="#3a2e22" />
    </Canvas>
  );
}
