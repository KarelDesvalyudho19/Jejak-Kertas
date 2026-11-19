import { Link } from 'react-router-dom';
import { cn } from '@/lib/format';

export function Logo({ className, ke = '/', kecil }: { className?: string; ke?: string; kecil?: boolean }) {
  return (
    <Link to={ke} className={cn('group inline-flex items-center gap-2.5', className)} aria-label="JejakKertas-Zero, beranda">
      <svg width="26" height="32" viewBox="0 0 26 32" aria-hidden className="shrink-0">
        <rect x="4" y="4" width="20" height="26" fill="#E9E4D8" stroke="#161513" strokeWidth="1.2" />
        <rect x="1" y="1" width="20" height="26" fill="#FBFAF6" stroke="#161513" strokeWidth="1.4" />
        <path d="M5 8h12M5 12h12M5 16h8" stroke="#6B675F" strokeWidth="1.1" />
        <path d="M4 21 L18 10" stroke="#D33A2C" strokeWidth="2.2" strokeLinecap="round" className="origin-center transition-transform duration-300 group-hover:rotate-6" />
      </svg>
      <span className={cn('font-serif font-semibold leading-none tracking-rapat', kecil ? 'text-[16px]' : 'text-[21px]')}>
        JejakKertas<span className="text-revisi">–</span>Zero
      </span>
    </Link>
  );
}
