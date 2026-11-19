import { STATUS_JEMPUT, STATUS_PESANAN, type Tone } from '@/lib/constants';
import { cn } from '@/lib/format';
import type { StatusJemput, StatusPesanan } from '@/lib/types';

const tone: Record<Tone, string> = {
  netral: 'text-tinta-abu border-tinta-abu/50 bg-kertas',
  proses: 'text-tinta border-tinta bg-kertas-terang',
  siap: 'text-revisi border-revisi bg-revisi-muda/40',
  sukses: 'text-sukses border-sukses bg-sukses-muda/50',
  bahaya: 'text-tinta-abu border-tinta-abu/40 line-through decoration-revisi/70',
  kraft: 'text-kraft-tua border-kraft bg-kraft-muda/50',
};

/** Badge status bergaya cap stempel: huruf mono kapital, bingkai ganda tipis. */
export function Badge({ label, t = 'netral', className }: { label: string; t?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2 py-[3px] font-mono text-[10.5px] font-medium uppercase leading-none tracking-[0.12em] outline outline-1 outline-offset-[2px] outline-current/0',
        tone[t],
        className,
      )}
      style={{ outlineColor: 'transparent' }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden />
      {label}
    </span>
  );
}

export function BadgePesanan({ status, className }: { status: StatusPesanan; className?: string }) {
  const s = STATUS_PESANAN[status];
  return <Badge label={s.label} t={s.tone} className={className} />;
}

export function BadgeJemput({ status, className }: { status: StatusJemput; className?: string }) {
  const s = STATUS_JEMPUT[status];
  return <Badge label={s.label} t={s.tone} className={className} />;
}
