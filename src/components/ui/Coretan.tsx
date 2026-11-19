import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

// pathLength valid untuk <motion.path>, tetapi tipe Variants umum belum mengenalnya.
const GAMBAR = { h: { pathLength: 0 }, v: { pathLength: 1 } } as unknown as Variants;

/** Coretan tangan dosen: garis bawah, coret, dan lingkaran — SVG yang "digambar" saat muncul. */

export function GarisBawah({ children, className, tunda = 0.3 }: { children: ReactNode; className?: string; tunda?: number }) {
  return (
    <span className={cn('relative inline-block', className)}>
      {children}
      <svg className="pointer-events-none absolute -bottom-[0.18em] left-[-2%] h-[0.35em] w-[104%] overflow-visible" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden>
        <motion.path
          d="M2 8 C 40 3, 80 11, 120 6 S 180 4, 198 7"
          fill="none"
          stroke="#D33A2C"
          strokeWidth="3.2"
          strokeLinecap="round"
          variants={GAMBAR}
          initial="h"
          whileInView="v"
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: tunda, ease: [0.65, 0, 0.35, 1] }}
        />
      </svg>
    </span>
  );
}

export function Coret({ children, className, tunda = 0.4 }: { children: ReactNode; className?: string; tunda?: number }) {
  return (
    <span className={cn('relative inline-block', className)}>
      <span className="text-tinta/55">{children}</span>
      <svg className="pointer-events-none absolute left-[-3%] top-[46%] h-[0.4em] w-[106%] -translate-y-1/2 overflow-visible" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden>
        <motion.path
          d="M3 9 C 50 4, 90 12, 140 6 S 185 5, 197 4"
          fill="none"
          stroke="#D33A2C"
          strokeWidth="3.6"
          strokeLinecap="round"
          variants={GAMBAR}
          initial="h"
          whileInView="v"
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: tunda, ease: [0.65, 0, 0.35, 1] }}
        />
      </svg>
    </span>
  );
}

export function Lingkari({ children, className, tunda = 0.2 }: { children: ReactNode; className?: string; tunda?: number }) {
  return (
    <span className={cn('relative inline-block px-1', className)}>
      {children}
      <svg className="pointer-events-none absolute inset-[-18%_-8%] h-[136%] w-[116%] overflow-visible" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden>
        <motion.path
          d="M120 6 C 60 2, 8 14, 6 40 C 4 68, 70 78, 120 74 C 170 70, 196 56, 194 36 C 192 14, 150 4, 96 8"
          fill="none"
          stroke="#D33A2C"
          strokeWidth="2.6"
          strokeLinecap="round"
          variants={GAMBAR}
          initial="h"
          whileInView="v"
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: tunda, ease: [0.65, 0, 0.35, 1] }}
        />
      </svg>
    </span>
  );
}

/** Catatan tangan merah di pinggir, miring sedikit. */
export function CatatanDosen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-block -rotate-2 font-serif italic text-revisi', className)}>
      {children}
    </span>
  );
}
