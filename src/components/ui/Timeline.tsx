import { cn } from '@/lib/format';

export interface Langkah {
  kunci: string;
  label: string;
  ket?: string;
}

/**
 * Timeline status. `aktif` = indeks langkah saat ini; `batal` menandai alur yang dihentikan.
 * Tampil vertikal (mobile) dan horizontal (layar lebar).
 */
export function Timeline({ langkah, aktif, batal }: { langkah: Langkah[]; aktif: number; batal?: boolean }) {
  return (
    <ol className="relative grid gap-0 md:grid-flow-col md:auto-cols-fr">
      {langkah.map((l, i) => {
        const selesai = i < aktif || (i === aktif && i === langkah.length - 1 && !batal);
        const kini = i === aktif && !selesai;
        return (
          <li key={l.kunci} className="relative flex gap-4 pb-6 md:flex-col md:gap-3 md:pb-0 md:pr-4">
            {/* garis penghubung */}
            {i < langkah.length - 1 && (
              <span
                className={cn(
                  'absolute left-[11px] top-6 h-[calc(100%-12px)] w-px transition-colors duration-500 md:left-6 md:top-[11px] md:h-px md:w-[calc(100%-12px)]',
                  i < aktif ? 'bg-tinta' : 'bg-tinta/15',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 grid h-6 w-6 shrink-0 place-items-center border font-mono text-[10px]',
                selesai && 'border-tinta bg-tinta text-kertas-terang',
                kini && !batal && 'border-revisi bg-revisi text-kertas-terang',
                kini && batal && 'border-tinta-abu bg-kertas text-tinta-abu',
                !selesai && !kini && 'border-tinta/25 bg-kertas-terang text-tinta-pudar',
              )}
            >
              {selesai ? '✓' : batal && kini ? '×' : String(i + 1).padStart(2, '0')}
              {kini && !batal && <span className="absolute inset-0 animate-ping border border-revisi opacity-60" />}
            </span>
            <div className="min-w-0">
              <div className={cn('font-mono text-[11.5px] uppercase tracking-[0.12em]', selesai || kini ? 'text-tinta' : 'text-tinta-pudar', kini && !batal && 'text-revisi')}>
                {l.label}
              </div>
              {l.ket && <div className="mt-0.5 text-[13px] leading-snug text-tinta-abu">{l.ket}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
