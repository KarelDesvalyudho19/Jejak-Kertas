import { Link } from 'react-router-dom';
import { BadgeJemput, BadgePesanan } from '@/components/ui/StatusBadge';
import { useLookup } from '@/context/AppContext';
import { JENIS_KERTAS_LABEL, KATEGORI_LABEL, WARNA_LABEL } from '@/lib/constants';
import { angka, cn, idPendek, rupiah, tanggalJam } from '@/lib/format';
import { labelSlot } from '@/lib/jadwal';
import type { Mitra, PermintaanJemput, PesananCetak } from '@/lib/types';

export function BarisPesanan({ p, ke }: { p: PesananCetak; ke?: string }) {
  const { dok, users } = useLookup();
  const d = dok.get(p.dokumenId);
  const m = users.get(p.mitraId) as Mitra | undefined;
  const isi = (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 sm:grid-cols-[96px_1fr_auto_auto]">
      <span className="hidden font-mono text-[11px] text-tinta-abu sm:block">#{idPendek(p.id.replace(/^pc-/, ''))}</span>
      <div className="min-w-0">
        <div className="truncate font-medium">{d?.namaFile ?? 'Dokumen'}</div>
        <div className="truncate text-[12.5px] text-tinta-abu">
          {JENIS_KERTAS_LABEL[p.jenisKertas]} · {WARNA_LABEL[p.warna]} · {(d?.jumlahHalaman ?? 0) * p.salinan} lbr · {m?.namaUsaha}
        </div>
      </div>
      <span className="hidden text-right font-mono text-[13px] sm:block">{rupiah(p.totalHarga)}</span>
      <BadgePesanan status={p.status} className="justify-self-end" />
    </div>
  );
  return ke ? (
    <Link to={ke} className="block border-b border-tinta/10 transition-colors last:border-0 hover:bg-kertas">
      {isi}
    </Link>
  ) : (
    <div className="border-b border-tinta/10 last:border-0">{isi}</div>
  );
}

export function BarisJemput({ j, ke }: { j: PermintaanJemput; ke?: string }) {
  const isi = (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 sm:grid-cols-[120px_1fr_auto]">
      <span className="hidden font-mono text-[11px] text-tinta-abu sm:block">{j.kodeQR}</span>
      <div className="min-w-0">
        <div className="truncate font-medium">
          ±{angka(j.estimasiLembar)} lembar ·{' '}
          <span className={cn(j.kategori === 'RAHASIA' && 'text-revisi')}>{j.kategori === 'RAHASIA' ? 'Rahasia' : 'Aman'}</span>
        </div>
        <div className="truncate text-[12.5px] text-tinta-abu">{labelSlot(j.jadwal)}</div>
      </div>
      <BadgeJemput status={j.status} className="justify-self-end" />
    </div>
  );
  return ke ? (
    <Link to={ke} className="block border-b border-tinta/10 transition-colors last:border-0 hover:bg-kertas">
      {isi}
    </Link>
  ) : (
    <div className="border-b border-tinta/10 last:border-0">{isi}</div>
  );
}

export { KATEGORI_LABEL, tanggalJam };
