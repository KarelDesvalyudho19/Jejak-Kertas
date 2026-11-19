import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/lib/format';

type Jenis = 'sukses' | 'galat' | 'info';
interface Pesan {
  id: number;
  jenis: Jenis;
  teks: string;
}
const Ctx = createContext<(teks: string, jenis?: Jenis) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [daftar, setDaftar] = useState<Pesan[]>([]);
  const tampil = useCallback((teks: string, jenis: Jenis = 'sukses') => {
    const id = Date.now() + Math.random();
    setDaftar((d) => [...d, { id, jenis, teks }]);
    setTimeout(() => setDaftar((d) => d.filter((x) => x.id !== id)), jenis === 'galat' ? 6000 : 3800);
  }, []);
  return (
    <Ctx.Provider value={tampil}>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[80] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2 md:bottom-6" aria-live="polite">
        <AnimatePresence>
          {daftar.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 40, opacity: 0, rotate: 2 }}
              animate={{ x: 0, opacity: 1, rotate: 0 }}
              exit={{ x: 40, opacity: 0 }}
              className={cn(
                'pointer-events-auto border-l-4 bg-kertas-terang px-4 py-3 text-sm shadow-kertas',
                p.jenis === 'sukses' && 'border-sukses',
                p.jenis === 'galat' && 'border-revisi',
                p.jenis === 'info' && 'border-kraft',
              )}
            >
              <div className="label-mono mb-0.5">{p.jenis === 'galat' ? 'Perlu revisi' : p.jenis === 'sukses' ? 'Tercatat' : 'Catatan'}</div>
              {p.teks}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
