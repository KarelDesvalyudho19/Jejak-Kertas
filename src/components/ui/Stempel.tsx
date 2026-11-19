import { motion } from 'framer-motion';
import { cn } from '@/lib/format';

/** Cap stempel bundar dengan teks melingkar — dipakai untuk penanda "Eco-Paper · draf", "Dicacah", dsb. */
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
  const id = `busur-${atas.replace(/\W/g, '')}-${ukuran}`;
  const isi = (
    <svg width={ukuran} height={ukuran} viewBox="0 0 120 120" aria-hidden style={{ color: warna }}>
      <defs>
        <path id={`${id}-a`} d="M 60 60 m -44 0 a 44 44 0 1 1 88 0" />
        <path id={`${id}-b`} d="M 60 60 m -44 0 a 44 44 0 0 0 88 0" />
        <filter id={`${id}-kasar`}>
          <feTurbulence baseFrequency="0.9" numOctaves="2" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="1.6" />
        </filter>
      </defs>
      <g filter={`url(#${id}-kasar)`} opacity="0.88">
        <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <text fill="currentColor" fontFamily="IBM Plex Mono, monospace" fontSize="10.5" fontWeight="600" letterSpacing="2.4">
          <textPath href={`#${id}-a`} startOffset="50%" textAnchor="middle">
            {atas.toUpperCase()}
          </textPath>
        </text>
        {bawah && (
          <text fill="currentColor" fontFamily="IBM Plex Mono, monospace" fontSize="9" fontWeight="500" letterSpacing="2">
            <textPath href={`#${id}-b`} startOffset="50%" textAnchor="middle" dominantBaseline="hanging">
              {bawah.toUpperCase()}
            </textPath>
          </text>
        )}
        <text x="60" y="64.5" textAnchor="middle" fill="currentColor" fontFamily="Newsreader, serif" fontSize="15" fontWeight="700" letterSpacing="-0.4">
          {tengah}
        </text>
      </g>
    </svg>
  );
  if (!animasi) return <span className={cn('inline-block', className)} style={{ transform: `rotate(${miring}deg)` }}>{isi}</span>;
  return (
    <motion.span
      className={cn('inline-block', className)}
      initial={{ scale: 1.6, opacity: 0, rotate: miring - 8 }}
      whileInView={{ scale: 1, opacity: 1, rotate: miring }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.15 }}
    >
      {isi}
    </motion.span>
  );
}
