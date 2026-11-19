import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Ikon } from '@/components/layout/Ikon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';

interface BarcodeDetectorLike {
  detect(src: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (o: { formats: string[] }) => BarcodeDetectorLike;
  }
}

/**
 * Masukan kode QR bundel: pindai lewat kamera (BarcodeDetector, tersedia di Chrome Android)
 * atau ketik manual sebagai cadangan.
 */
export function PemindaiQR({ onKode, memuat, labelTombol = 'Konfirmasi' }: { onKode: (kode: string) => void; memuat?: boolean; labelTombol?: string }) {
  const [kode, setKode] = useState('');
  const [kamera, setKamera] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bisaPindai = typeof window !== 'undefined' && !!window.BarcodeDetector && !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => {
    if (!kamera) return;
    let stream: MediaStream | null = null;
    let aktif = true;
    let raf = 0;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        const det = new window.BarcodeDetector!({ formats: ['qr_code'] });
        const loop = async () => {
          if (!aktif) return;
          try {
            const hasil = await det.detect(v);
            const raw = hasil[0]?.rawValue?.trim().toUpperCase();
            if (raw && /^JKZ-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(raw)) {
              setKode(raw);
              setKamera(false);
              onKode(raw);
              return;
            }
          } catch {
            /* frame belum siap */
          }
          raf = requestAnimationFrame(loop);
        };
        loop();
      } catch {
        setGalat('Kamera tidak bisa dibuka. Ketik kodenya saja.');
        setKamera(false);
      }
    })();
    return () => {
      aktif = false;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [kamera, onKode]);

  function kirim(e: FormEvent) {
    e.preventDefault();
    const k = kode.trim().toUpperCase();
    if (!/^JKZ-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(k)) return setGalat('Format kode: JKZ-XXXX-XXXX');
    setGalat(null);
    onKode(k);
  }

  return (
    <div>
      {kamera && (
        <div className="relative mb-3 aspect-square w-full max-w-xs overflow-hidden bg-tinta">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          <div className="pointer-events-none absolute inset-8 border-2 border-revisi" />
          <button type="button" onClick={() => setKamera(false)} className="absolute right-2 top-2 bg-kertas-terang px-2 py-1 font-mono text-[11px]">
            tutup
          </button>
        </div>
      )}
      <form onSubmit={kirim} className="flex flex-wrap items-end gap-3">
        <Input
          value={kode}
          onChange={(e) => setKode(e.target.value.toUpperCase())}
          placeholder="JKZ-XXXX-XXXX"
          className="w-48 font-mono text-[17px] tracking-[0.08em]"
          aria-label="Kode QR bundel"
          maxLength={13}
        />
        {bisaPindai && (
          <Button type="button" varian="garis" ukuran="sm" ikon={<Ikon nama="kamera" className="h-4 w-4" />} onClick={() => setKamera(true)}>
            Pindai
          </Button>
        )}
        <Button type="submit" ukuran="sm" memuat={memuat}>
          {labelTombol}
        </Button>
      </form>
      {galat && <p className="mt-2 text-[13px] text-revisi">{galat}</p>}
    </div>
  );
}
