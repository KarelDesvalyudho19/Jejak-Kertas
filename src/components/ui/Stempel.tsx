import { motion } from 'framer-motion';
import { cn } from '@/lib/format';

/**
 * Cap karet persegi khas kasir: garis ganda, huruf mono, tinta sedikit tembus (multiply).
 * HTML murni agar tajam di layar apa pun. `ukuran` ≈ lebar cap dalam px; semua isi diskalakan lewat em.
 */
export function Stempel({
  atas,
  tengah,
  bawah,
  warna = '#D33A2C',
  ukuran = 112,
  miring = -12,
  className,
  animasi = true,
}: {
  atas: string;
  tengah: string;
  bawah?: string;
  warna?: string;
  ukuran?: number;
  miring?: number;
  className?: string;
  animasi?: boolean;
}) {
  const isi = (
    <span
      className="block rounded-[0.2em] border-[0.16em] border-current p-[0.18em] text-center font-struk"
      style={{ color: warna, fontSize: ukuran / 8 }}
    >
      <span className="block rounded-[0.08em] border-[0.07em] border-current px-[0.6em] pb-[0.3em] pt-[0.4em]">
        <span className="block whitespace-nowrap text-[0.56em] font-semibold uppercase leading-tight tracking-[0.3em]">{atas}</span>
        <span className="block whitespace-nowrap text-[1.7em] font-bold leading-none tracking-tight">{tengah}</span>
        {bawah && (
          <span className="mt-[0.3em] block whitespace-nowrap border-t-[0.07em] border-dashed border-current pt-[0.25em] text-[0.5em] uppercase leading-tight tracking-[0.18em]">
            {bawah}
          </span>
        )}
      </span>
    </span>
  );
  const kelas = cn('inline-block mix-blend-multiply', className);
  if (!animasi)
    return (
      <span aria-hidden className={kelas} style={{ transform: `rotate(${miring}deg)`, opacity: 0.9 }}>
        {isi}
      </span>
    );
  return (
    <motion.span
      aria-hidden
      className={kelas}
      initial={{ scale: 1.5, opacity: 0, rotate: miring - 10 }}
      whileInView={{ scale: 1, opacity: 0.9, rotate: miring }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.15 }}
    >
      {isi}
    </motion.span>
  );
}
