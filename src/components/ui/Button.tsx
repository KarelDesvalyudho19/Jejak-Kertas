import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/lib/format';

type Varian = 'revisi' | 'tinta' | 'garis' | 'hantu' | 'sukses' | 'lipat' | 'tumpuk';
type Ukuran = 'sm' | 'md' | 'lg';

const dasar =
  'inline-flex items-center justify-center gap-2 rounded-[3px] font-medium select-none whitespace-nowrap transition-[transform,box-shadow,background-color,color,border-color] duration-150 disabled:opacity-45 disabled:pointer-events-none active:translate-y-px';

const varian: Record<Varian, string> = {
  revisi: 'bg-revisi text-kertas-terang hover:bg-revisi-tua',
  tinta: 'bg-tinta text-kertas-terang hover:bg-black',
  garis: 'border border-tinta/25 text-tinta hover:border-tinta hover:bg-kertas-terang',
  hantu: 'text-tinta hover:bg-tinta/5 active:translate-y-0',
  sukses: 'bg-sukses text-kertas-terang hover:brightness-110',
  // lembar merah dengan sudut terlipat
  lipat: 'sudut-lipat rounded-none bg-revisi pr-7 text-kertas-terang hover:bg-revisi-tua',
  // tumpukan lembar: dua lembar di belakang bergeser saat hover
  // diam: lembar diangkat 6px sehingga tepi bawah tumpukan sejajar tombol lain; hover: mendarat tepat di garis dasar itu
  tumpuk: 'rounded-none border border-tinta/15 bg-kertas-terang text-tinta shadow-tumpuk -translate-x-1.5 -translate-y-1.5 hover:translate-x-0 hover:translate-y-0 hover:shadow-none',
};
const ukuran: Record<Ukuran, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  varian?: Varian;
  ukuran?: Ukuran;
  memuat?: boolean;
  ikon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { varian: v = 'tinta', ukuran: u = 'md', memuat, ikon, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button ref={ref} className={cn(dasar, varian[v], ukuran[u], className)} disabled={disabled || memuat} {...rest}>
      {memuat ? <Putar /> : ikon}
      {children}
    </button>
  );
});

export function TombolTautan({
  varian: v = 'tinta',
  ukuran: u = 'md',
  className,
  ...rest
}: LinkProps & { varian?: Varian; ukuran?: Ukuran }) {
  return <Link className={cn(dasar, varian[v], ukuran[u], className)} {...rest} />;
}

export function Putar({ className }: { className?: string }) {
  return (
    <svg className={cn('h-4 w-4 animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
