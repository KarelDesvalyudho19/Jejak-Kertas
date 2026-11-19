import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/format';

export function Label({ children, htmlFor, petunjuk }: { children: ReactNode; htmlFor?: string; petunjuk?: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-3">
      <span className="label-mono text-tinta">{children}</span>
      {petunjuk && <span className="text-[12px] text-tinta-abu">{petunjuk}</span>}
    </label>
  );
}

const kotak =
  'w-full border-0 border-b border-tinta/40 bg-transparent px-0 py-2 text-[15px] text-tinta placeholder:text-tinta-pudar transition-colors focus:border-revisi focus:outline-none focus:ring-0 focus-visible:outline-none';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(kotak, className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(kotak, 'bergaris resize-none leading-8', className)} {...p} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...p }, ref) {
  return (
    <select ref={ref} className={cn(kotak, 'cursor-pointer appearance-none bg-[length:12px] bg-[right_2px_center] bg-no-repeat pr-6', className)} style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' fill='none' stroke='%23161513' stroke-width='1.5'/></svg>\")" }} {...p}>
      {children}
    </select>
  );
});

export function Bidang({ label, petunjuk, galat, children, className }: { label: string; petunjuk?: ReactNode; galat?: string | null; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label petunjuk={petunjuk}>{label}</Label>
      {children}
      {galat && <p className="mt-1 text-[12.5px] text-revisi">{galat}</p>}
    </div>
  );
}

/** Pilihan berbentuk kartu (radio). */
export function PilihanKartu<T extends string>({
  nilai,
  onChange,
  opsi,
  kolom = 2,
  nama,
}: {
  nilai: T;
  onChange: (v: T) => void;
  opsi: { nilai: T; judul: ReactNode; isi?: ReactNode; tambahan?: ReactNode; nonaktif?: boolean }[];
  kolom?: 2 | 3 | 4;
  nama: string;
}) {
  const grid = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' }[kolom];
  return (
    <div role="radiogroup" className={cn('grid gap-3', grid)}>
      {opsi.map((o) => {
        const aktif = o.nilai === nilai;
        return (
          <label
            key={o.nilai}
            className={cn(
              'relative flex cursor-pointer flex-col border bg-kertas-terang p-3.5 transition-all',
              aktif ? 'border-tinta shadow-[3px_3px_0_#161513] -translate-x-[1px] -translate-y-[1px]' : 'border-tinta/15 hover:border-tinta/50',
              o.nonaktif && 'pointer-events-none opacity-45',
            )}
          >
            <input type="radio" name={nama} className="sr-only" checked={aktif} onChange={() => onChange(o.nilai)} disabled={o.nonaktif} />
            <span className="flex items-start justify-between gap-2">
              <span className="font-medium leading-snug">{o.judul}</span>
              <span className={cn('mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border', aktif ? 'border-revisi' : 'border-tinta/30')}>
                {aktif && <span className="h-2 w-2 rounded-full bg-revisi" />}
              </span>
            </span>
            {o.isi && <span className="mt-1 text-[13px] leading-snug text-tinta-abu">{o.isi}</span>}
            {o.tambahan}
          </label>
        );
      })}
    </div>
  );
}

/** Tombol pilihan kecil (chip) */
export function Chip({ aktif, onClick, children, jumlah }: { aktif?: boolean; onClick?: () => void; children: ReactNode; jumlah?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-2 border px-3 text-[13px] transition-colors',
        aktif ? 'border-tinta bg-tinta text-kertas-terang' : 'border-tinta/20 bg-kertas-terang hover:border-tinta/60',
      )}
    >
      {children}
      {jumlah !== undefined && <span className={cn('font-mono text-[11px]', aktif ? 'text-kraft-muda' : 'text-tinta-abu')}>{jumlah}</span>}
    </button>
  );
}
