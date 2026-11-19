import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

/** Struk kasir: kertas sempit, huruf mono, tepi bawah bergerigi. */
export function Struk({ children, className, judul, sub }: { children: ReactNode; className?: string; judul?: string; sub?: string }) {
  return (
    // drop-shadow di pembungkus: box-shadow di dalam ikut terpotong mask tepi bergerigi
    <div className={cn('relative drop-shadow-[0_6px_10px_rgba(22,21,19,0.12)]', className)}>
      <div className="tepi-struk bg-[#FEFEFC] px-5 pb-8 pt-5 font-struk text-[12px] text-tinta">
        {judul && (
          <div className="mb-3 text-center">
            <div className="text-[13px] font-semibold uppercase tracking-[0.2em]">{judul}</div>
            {sub && <div className="mt-0.5 text-[11px] text-tinta-abu">{sub}</div>}
            <div className="garis-putus mt-3" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function BarisStruk({ kiri, kanan, tebal, merah, kecil }: { kiri: ReactNode; kanan: ReactNode; tebal?: boolean; merah?: boolean; kecil?: boolean }) {
  return (
    <div className={cn('flex items-baseline gap-2 py-[3px]', tebal && 'font-semibold', merah && 'text-revisi', kecil && 'text-[11px] text-tinta-abu')}>
      <span className="shrink-0">{kiri}</span>
      <span className="mx-1 flex-1 translate-y-[-3px] border-b border-dotted border-tinta/30" />
      <span className="shrink-0 tabular-nums">{kanan}</span>
    </div>
  );
}

export function PemisahStruk() {
  return <div className="garis-putus my-3" />;
}
