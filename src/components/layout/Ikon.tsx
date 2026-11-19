/** Ikon garis sederhana bergaya sketsa pena (stroke 1.5). */
const jalur: Record<string, JSX.Element> = {
  meja: <><path d="M3 10h18M5 10v9M19 10v9" /><path d="M8 10V5h8v5" /></>,
  printer: <><path d="M7 9V3h10v6" /><rect x="3" y="9" width="18" height="8" /><path d="M7 14h10v7H7z" /></>,
  tumpuk: <><path d="M4 7l8-4 8 4-8 4z" /><path d="M4 12l8 4 8-4" /><path d="M4 17l8 4 8-4" /></>,
  lacak: <><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 6h6a4 4 0 0 1 0 8h-4a4 4 0 0 0 0 8" /></>,
  poin: <><rect x="3" y="5" width="18" height="14" /><path d="M3 10h18" /><path d="M15 15h3" /></>,
  profil: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>,
  stok: <><path d="M3 7h18v13H3z" /><path d="M3 7l3-4h12l3 4" /><path d="M10 11h4" /></>,
  rute: <><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" /></>,
  grafik: <><path d="M3 21h18" /><path d="M6 17V11M11 17V6M16 17v-4M20 17V9" /></>,
  keluar: <><path d="M14 4h6v16h-6" /><path d="M10 8l-4 4 4 4M6 12h11" /></>,
  unduh: <><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 20h16" /></>,
  kamera: <><path d="M4 7h4l2-3h4l2 3h4v13H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  qr: <><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" /><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" /></>,
  panah: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  cek: <><path d="M4 12l5 5L20 6" /></>,
  peta: <><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>,
};

export function Ikon({ nama, className = 'h-[18px] w-[18px]' }: { nama: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {jalur[nama] ?? jalur.meja}
    </svg>
  );
}
