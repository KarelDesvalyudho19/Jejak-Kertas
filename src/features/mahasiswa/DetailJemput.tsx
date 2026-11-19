import { QRCodeSVG } from 'qrcode.react';
import { Link, useParams } from 'react-router-dom';
import { repo } from '@/data';
import { Button } from '@/components/ui/Button';
import { JudulHalaman, Kertas, Kosong } from '@/components/ui/Paper';
import { Stempel } from '@/components/ui/Stempel';
import { BadgeJemput } from '@/components/ui/StatusBadge';
import { Timeline } from '@/components/ui/Timeline';
import { useApp, useData, useLookup } from '@/context/AppContext';
import { KATEGORI_LABEL, STATUS_JEMPUT, alurJemput } from '@/lib/constants';
import { angka, angka1, tanggal, tanggalJam } from '@/lib/format';
import { labelSlot } from '@/lib/jadwal';
import type { Kurir, Mitra } from '@/lib/types';

const KET: Record<string, string> = {
  DIAJUKAN: 'Menunggu kurir',
  DIPROSES: 'Kurir dijadwalkan',
  DIJEMPUT: 'Dibawa ke mitra',
  DISORTIR: 'Dipilah & dihitung',
  DIPAKAI_ULANG: 'Masuk stok Eco-Paper',
  DICACAH: 'Dicacah & didaur ulang',
};

export default function DetailJemput() {
  const { id } = useParams();
  const { data } = useData();
  const { aksi } = useApp();
  const { users, bundelByJemput } = useLookup();
  const j = data.jemput.find((x) => x.id === id);
  if (!j) return <Kosong judul="Permintaan tidak ditemukan" aksi={<Link className="tautan" to="/mhs/lacak?tab=jemput">Kembali</Link>} />;

  const alur = alurJemput(j.kategori);
  const batal = j.status === 'DIBATALKAN';
  const idx = batal ? (j.kurirId ? 1 : 0) : alur.indexOf(j.status);
  const kurir = j.kurirId ? (users.get(j.kurirId) as Kurir | undefined) : undefined;
  const b = bundelByJemput.get(j.id);
  const mitra = b ? (users.get(b.mitraId) as Mitra | undefined) : undefined;
  const total = b ? b.lembarLayak + b.lembarDicacah : 0;

  return (
    <>
      <Link to="/mhs/lacak?tab=jemput" className="tautan mb-4 inline-block font-mono text-[12px]">← semua penjemputan</Link>
      <JudulHalaman
        nomor={`Jemput ${j.kodeQR}`}
        judul={<>±{angka(j.estimasiLembar)} lembar dari kos</>}
        deskripsi={`Diajukan ${tanggalJam(j.createdAt)} · slot ${labelSlot(j.jadwal)}`}
        aksi={<BadgeJemput status={j.status} className="text-[12px]" />}
      />

      <Kertas className="mb-8 p-6">
        <Timeline langkah={alur.map((s) => ({ kunci: s, label: STATUS_JEMPUT[s].label, ket: KET[s] }))} aktif={idx} batal={batal} />
      </Kertas>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Kertas bergaris className="p-6">
            <div className="label-mono mb-3">Detail</div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 leading-8">
              <dt className="text-tinta-abu">Kategori</dt>
              <dd className={j.kategori === 'RAHASIA' ? 'text-revisi' : ''}>{KATEGORI_LABEL[j.kategori]}</dd>
              <dt className="text-tinta-abu">Slot</dt>
              <dd>{labelSlot(j.jadwal)}</dd>
              <dt className="text-tinta-abu">Kurir</dt>
              <dd>{kurir ? `${kurir.nama} · ${kurir.noHp}` : 'Belum ada kurir yang mengambil'}</dd>
              <dt className="text-tinta-abu">Foto</dt>
              <dd>{j.fotoUrl ? 'Terlampir' : '—'}</dd>
            </dl>
            {['DIAJUKAN', 'DIPROSES'].includes(j.status) && (
              <Button varian="hantu" ukuran="sm" className="mt-4 text-revisi" onClick={() => confirm('Batalkan permintaan jemput ini?') && aksi(() => repo.batalkanJemput(j.id), 'Permintaan jemput dibatalkan.')}>
                Batalkan permintaan
              </Button>
            )}
          </Kertas>

          {b && (
            <Kertas className="relative overflow-hidden p-6">
              <div className="label-mono mb-3">Hasil sortir {mitra ? `· ${mitra.namaUsaha}` : ''}</div>
              {b.tanggalSortir ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="font-serif text-[36px] font-semibold leading-none text-sukses">{angka(b.lembarLayak)}</div>
                      <div className="mt-1 text-[13px] text-tinta-abu">layak jadi Eco-Paper</div>
                    </div>
                    <div>
                      <div className="font-serif text-[36px] font-semibold leading-none">{angka(b.lembarDicacah)}</div>
                      <div className="mt-1 text-[13px] text-tinta-abu">dicacah</div>
                    </div>
                    <div>
                      <div className="font-serif text-[36px] font-semibold leading-none text-revisi">+{angka(total * data.pengaturan.poinPerLembar)}</div>
                      <div className="mt-1 text-[13px] text-tinta-abu">poin masuk</div>
                    </div>
                  </div>
                  <p className="mt-4 text-[13px] text-tinta-abu">
                    Disortir {tanggal(b.tanggalSortir)} · {angka1((total * data.pengaturan.gramPerLembar) / 1000)} kg kertas tidak berakhir di TPA.
                  </p>
                  {j.status === 'DICACAH' && (
                    <div className="pointer-events-none absolute -right-2 -top-2">
                      <Stempel atas="data pribadi" tengah="DICACAH" bawah={tanggal(b.tanggalSortir)} ukuran={100} miring={-12} />
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-tinta-abu">Bundel sudah diterima mitra dan menunggu disortir.</p>
              )}
            </Kertas>
          )}
        </div>

        <Kertas className="h-fit p-6 text-center">
          <div className="label-mono mb-4">Label bundel</div>
          <div className="mx-auto w-fit border border-tinta bg-white p-3">
            <QRCodeSVG value={j.kodeQR} size={150} fgColor="#161513" level="M" />
          </div>
          <div className="mt-3 font-mono text-[17px] font-semibold tracking-[0.1em]">{j.kodeQR}</div>
          <p className="mt-2 text-[12.5px] text-tinta-abu">Tunjukkan ke kurir saat penjemputan.</p>
        </Kertas>
      </div>
    </>
  );
}
