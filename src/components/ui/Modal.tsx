import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/format';

export function Modal({ buka, tutup, judul, children, className }: { buka: boolean; tutup: () => void; judul?: ReactNode; children: ReactNode; className?: string }) {
  useEffect(() => {
    if (!buka) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && tutup();
    window.addEventListener('keydown', k);
    const o = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', k);
      document.body.style.overflow = o;
    };
  }, [buka, tutup]);
  return (
    <AnimatePresence>
      {buka && (
        <motion.div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-tinta/45" onClick={tutup} />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn('relative max-h-[92vh] w-full overflow-y-auto bg-kertas-terang p-6 shadow-2xl sm:max-w-lg', className)}
            initial={{ y: 40, rotate: -1.2, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <button onClick={tutup} className="absolute right-3 top-3 grid h-8 w-8 place-items-center text-tinta-abu hover:text-revisi" aria-label="Tutup">
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" /></svg>
            </button>
            {judul && <h2 className="mb-4 pr-8 text-2xl font-semibold leading-tight">{judul}</h2>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
