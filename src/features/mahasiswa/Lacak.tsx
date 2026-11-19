import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TombolTautan } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Field';
import { JudulHalaman, Kertas, Kosong } from '@/components/ui/Paper';
import { useData } from '@/context/AppContext';
import { cn } from '@/lib/format';
import { BarisJemput, BarisPesanan } from '../shared/Baris';

type Saring = 'aktif' | 'selesai' | 'semua';

export default function Lacak() {
  const { data, user } = useData();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'jemput' ? 'jemput' : 'pesanan';
  const [saring, setSaring] = useState<Saring>('aktif');

  const pesanan = useMemo(() => data.pesanan.filter((p) => p.mahasiswaId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [data, user.id]);
  const jemput = useMemo(() => data.jemput.filter((j) => j.mahasiswaId === user.id).sort((a, b) => b.jadwal.localeCompare(a.jadwal)), [data, user.id]);

  const pesananAktif = (s: string) => !['SELESAI', 'DIBATALKAN'].includes(s);
  const jemputAktif = (s: string) => !['DIPAKAI_ULANG', 'DICACAH', 'DIBATALKAN'].includes(s);

  const listP = pesanan.filter((p) => (saring === 'semua' ? true : saring === 'aktif' ? pesananAktif(p.status) : !pesananAktif(p.status)));
  const listJ = jemput.filter((j) => (saring === 'semua' ? true : saring === 'aktif' ? jemputAktif(j.status) : !jemputAktif(j.status)));

  return (
    <>
      <JudulHalaman nomor="03 — Lacak status" judul="Di mana berkasku sekarang?" deskripsi="Setiap perubahan status dari mitra dan kurir langsung tercatat di sini." />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex border-b border-tinta/15" role="tablist">
          {(
            [
              ['pesanan', 'Pesanan cetak', pesanan.filter((p) => pesananAktif(p.status)).length],
              ['jemput', 'Penjemputan', jemput.filter((j) => jemputAktif(j.status)).length],
            ] as const
          ).map(([k, l, n]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setParams(k === 'jemput' ? { tab: 'jemput' } : {})}
              className={cn('-mb-px border-b-2 px-4 py-2.5 font-serif text-[18px] font-semibold transition-colors', tab === k ? 'border-revisi text-tinta' : 'border-transparent text-tinta-abu hover:text-tinta')}
            >
              {l} {n > 0 && <span className="ml-1 font-mono text-[11px] font-normal text-revisi">{n}</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['aktif', 'selesai', 'semua'] as Saring[]).map((s) => (
            <Chip key={s} aktif={saring === s} onClick={() => setSaring(s)}>
              {s[0].toUpperCase() + s.slice(1)}
            </Chip>
          ))}
        </div>
      </div>

      {tab === 'pesanan' ? (
        listP.length ? (
          <Kertas>{listP.map((p) => <BarisPesanan key={p.id} p={p} ke={`/mhs/lacak/pesanan/${p.id}`} />)}</Kertas>
        ) : (
          <Kosong judul="Tidak ada pesanan di sini" aksi={<TombolTautan to="/mhs/cetak" ukuran="sm">Pesan cetak</TombolTautan>} />
        )
      ) : listJ.length ? (
        <Kertas>{listJ.map((j) => <BarisJemput key={j.id} j={j} ke={`/mhs/lacak/jemput/${j.id}`} />)}</Kertas>
      ) : (
        <Kosong judul="Tidak ada penjemputan di sini" aksi={<TombolTautan to="/mhs/jemput" ukuran="sm">Ajukan jemput</TombolTautan>} />
      )}
    </>
  );
}
