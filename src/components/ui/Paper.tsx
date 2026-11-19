import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/format';

/** Lembar kertas — wadah utama konten. */
export function Kertas({
  className,
  bergaris,
  tumpuk,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { bergaris?: boolean; tumpuk?: boolean }) {
  return (
    <div className={cn('kartu relative', bergaris && 'bergaris', tumpuk && 'shadow-tumpuk', className)} {...rest}>
      {children}
    </div>
  );
}

/** Judul halaman ala dokumen: nomor bagian mono, judul serif besar. */
export function JudulHalaman({ nomor, judul, deskripsi, aksi }: { nomor: string; judul: ReactNode; deskripsi?: ReactNode; aksi?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-tinta/15 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <div className="mb-3 inline-block -rotate-1 drop-shadow-[0_2px_3px_rgba(22,21,19,0.18)]">
          <div className="sudut-lipat bg-[#FEFEFC] py-1 pl-3 pr-7 text-[13px] text-tinta">{nomor.replace(' — ', '. ')}</div>
        </div>
        <h1 className="text-[30px] font-semibold leading-[1.05] md:text-[38px]">{judul}</h1>
        {deskripsi && <p className="mt-3 text-[15px] text-tinta-abu">{deskripsi}</p>}
      </div>
      {aksi && <div className="flex shrink-0 flex-wrap gap-3">{aksi}</div>}
    </header>
  );
}

export function SubJudul({ children, kanan, className }: { children: ReactNode; kanan?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3 flex items-baseline justify-between gap-3', className)}>
      <h2 className="text-[19px] font-semibold leading-tight">{children}</h2>
      {kanan}
    </div>
  );
}

export function Kosong({ judul, isi, aksi }: { judul: string; isi?: ReactNode; aksi?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-tinta/25 bg-kertas-terang px-6 py-10 text-center">
      <svg width="56" height="64" viewBox="0 0 56 64" aria-hidden className="mb-4 text-tinta/40">
        <path d="M6 4h32l12 12v44H6z" fill="#FBFAF6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M38 4v12h12" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 28h28M14 36h28M14 44h18" stroke="currentColor" strokeWidth="1.2" />
        <path d="M12 50 L44 22" stroke="#D33A2C" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <div className="font-serif text-xl font-semibold">{judul}</div>
      {isi && <p className="mt-1 max-w-sm text-sm text-tinta-abu">{isi}</p>}
      {aksi && <div className="mt-5">{aksi}</div>}
    </div>
  );
}

export function Angka({ label, nilai, satuan, catatan, aksen, className }: { label: string; nilai: ReactNode; satuan?: string; catatan?: ReactNode; aksen?: boolean; className?: string }) {
  return (
    <div className={cn('kartu flex flex-col justify-between p-4', className)}>
      <div className="label-mono">{label}</div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={cn('font-serif text-[38px] font-semibold leading-none tracking-rapat tabular-nums', aksen && 'text-revisi')}>{nilai}</span>
        {satuan && <span className="font-mono text-xs text-tinta-abu">{satuan}</span>}
      </div>
      {catatan && <div className="mt-2 text-[12.5px] text-tinta-abu">{catatan}</div>}
    </div>
  );
}
