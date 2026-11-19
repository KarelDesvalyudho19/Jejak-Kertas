import { useCallback, useMemo, useState } from 'react';
import { repo } from '@/data';
import { Button } from '@/components/ui/Button';
import { Bidang, Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { JudulHalaman, Kertas, Kosong, SubJudul } from '@/components/ui/Paper';
import { BadgeJemput } from '@/components/ui/StatusBadge';
import { useApp, useData, useLookup } from '@/context/AppContext';
import { angka, cn, tanggal } from '@/lib/format';
import type { BundelKertas, Mahasiswa, PermintaanJemput } from '@/lib/types';
import { PemindaiQR } from '../shared/PemindaiQR';

export default function BundelSortir() {
  const { data, user } = useData();
  const { aksi } = useApp();
  const { users } = useLookup();
  const [menerima, setMenerima] = useState(false);
  const [sortir, setSortir] = useState<{ b: BundelKertas; j: PermintaanJemput } | null>(null);

  const jemputMap = useMemo(() => new Map(data.jemput.map((j) => [j.id, j])), [data.jemput]);
  const milik = data.bundel.filter((b) => b.mitraId === user.id).map((b) => ({ b, j: jemputMap.get(b.permintaanJemputId)! })).filter((x) => x.j);
  const belumSortir = milik.filter((x) => !x.b.tanggalSortir);
  const menungguSelesai = milik.filter((x) => x.j.status === 'DISORTIR');
  const riwayat = milik.filter((x) => ['DIPAKAI_ULANG', 'DICACAH'].includes(x.j.status)).sort((a, b) => (b.b.tanggalSortir ?? '').localeCompare(a.b.tanggalSortir ?? ''));
  const dalamPerjalanan = data.jemput.filter((j) => j.status === 'DIJEMPUT' && !milik.some((x) => x.j.id === j.id));

  const terima = useCallback(
    async (kode: string) => {
      setMenerima(true);
      const b = await aksi(() => repo.terimaBundel(kode), `Bundel ${kode} diterima. Silakan sortir.`);
      setMenerima(false);
      if (b) {
        const j = data.jemput.find((x) => x.id === b.permintaanJemputId);
        if (j) setSortir({ b, j });
      }
    },
    [aksi, data.jemput],
  );

  const nama = (id: string) => (users.get(id) as Mahasiswa | undefined)?.nama ?? '—';

  return (
    <>
      <JudulHalaman nomor="M2 — Bundel & sortir" judul="Kertas bekas yang datang." deskripsi="Pindai label QR saat kurir menyerahkan bundel, pilah isinya, lalu salurkan: sisi kosong jadi Eco-Paper, sisanya dicacah." />

      <Kertas bergaris className="mb-10 p-6">
        <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-center">
          <div>
            <div className="label-mono mb-1">Konfirmasi penerimaan</div>
            <h2 className="text-[24px] font-semibold leading-tight">Pindai atau ketik kode bundel.</h2>
            <p className="mt-1 text-sm text-tinta-abu">{dalamPerjalanan.length > 0 ? `${dalamPerjalanan.length} bundel sedang dibawa kurir.` : 'Tidak ada bundel dalam perjalanan saat ini.'}</p>
          </div>
          <PemindaiQR onKode={terima} memuat={menerima} labelTombol="Terima bundel" />
        </div>
        {dalamPerjalanan.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-tinta/10 pt-4">
            <span className="label-mono mr-2 self-center">Dalam perjalanan</span>
            {dalamPerjalanan.map((j) => (
              <button key={j.id} onClick={() => terima(j.kodeQR)} className="border border-dashed border-tinta/30 px-2 py-1 font-mono text-[12px] hover:border-revisi hover:text-revisi" title="Klik untuk menerima (demo)">
                {j.kodeQR} · {j.kategori === 'RAHASIA' ? 'rahasia' : `±${j.estimasiLembar}`}
              </button>
            ))}
          </div>
        )}
      </Kertas>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <SubJudul>Perlu disortir</SubJudul>
          {belumSortir.length === 0 ? (
            <Kosong judul="Tidak ada bundel menunggu" />
          ) : (
            <Kertas>
              {belumSortir.map(({ b, j }) => (
                <div key={b.id} className="flex items-center justify-between gap-3 border-b border-tinta/10 px-4 py-3.5 last:border-0">
                  <div className="min-w-0">
                    <div className="font-mono text-[13px]">{j.kodeQR}</div>
                    <div className="truncate text-[13px] text-tinta-abu">
                      {nama(j.mahasiswaId)} · ±{angka(j.estimasiLembar)} lbr · <span className={cn(j.kategori === 'RAHASIA' && 'text-revisi')}>{j.kategori === 'RAHASIA' ? 'RAHASIA' : 'aman'}</span>
                    </div>
                  </div>
                  <Button ukuran="sm" varian="revisi" onClick={() => setSortir({ b, j })}>
                    Input sortir
                  </Button>
                </div>
              ))}
            </Kertas>
          )}
        </section>

        <section>
          <SubJudul>Siap disalurkan</SubJudul>
          {menungguSelesai.length === 0 ? (
            <Kosong judul="Belum ada hasil sortir" />
          ) : (
            <Kertas>
              {menungguSelesai.map(({ b, j }) => (
                <div key={b.id} className="flex items-center justify-between gap-3 border-b border-tinta/10 px-4 py-3.5 last:border-0">
                  <div className="min-w-0">
                    <div className="font-mono text-[13px]">{j.kodeQR}</div>
                    <div className="text-[13px] text-tinta-abu">
                      <span className="text-sukses">{angka(b.lembarLayak)} layak</span> · {angka(b.lembarDicacah)} dicacah
                    </div>
                  </div>
                  <Button
                    ukuran="sm"
                    varian={j.kategori === 'AMAN' ? 'sukses' : 'tinta'}
                    onClick={() => aksi(() => repo.selesaikanBundel(b.id), j.kategori === 'AMAN' ? `${angka(b.lembarLayak)} lembar masuk stok Eco-Paper.` : 'Bundel tercatat dicacah.')}
                  >
                    {j.kategori === 'AMAN' ? 'Masukkan ke stok' : 'Catat sudah dicacah'}
                  </Button>
                </div>
              ))}
            </Kertas>
          )}
        </section>
      </div>

      <section className="mt-12">
        <SubJudul>Riwayat sortir</SubJudul>
        {riwayat.length === 0 ? (
          <Kosong judul="Belum ada riwayat" />
        ) : (
          <div className="kartu overflow-x-auto">
            <table className="w-full min-w-[620px] text-[13.5px]">
              <thead>
                <tr className="border-b border-tinta/20 text-left">
                  {['Tanggal', 'Kode', 'Penyetor', 'Layak', 'Dicacah', 'Status'].map((h) => (
                    <th key={h} className="label-mono px-4 py-2.5 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {riwayat.slice(0, 30).map(({ b, j }) => (
                  <tr key={b.id} className="border-b border-tinta/[0.07]">
                    <td className="px-4 py-2 font-mono text-[12px] text-tinta-abu">{b.tanggalSortir && tanggal(b.tanggalSortir)}</td>
                    <td className="px-4 py-2 font-mono text-[12px]">{j.kodeQR}</td>
                    <td className="px-4 py-2">{nama(j.mahasiswaId)}</td>
                    <td className="px-4 py-2 font-mono text-sukses">{angka(b.lembarLayak)}</td>
                    <td className="px-4 py-2 font-mono">{angka(b.lembarDicacah)}</td>
                    <td className="px-4 py-2"><BadgeJemput status={j.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {sortir && <FormSortir key={sortir.b.id} b={sortir.b} j={sortir.j} tutup={() => setSortir(null)} poinPerLembar={data.pengaturan.poinPerLembar} />}
    </>
  );
}

function FormSortir({ b, j, tutup, poinPerLembar }: { b: BundelKertas; j: PermintaanJemput; tutup: () => void; poinPerLembar: number }) {
  const { aksi } = useApp();
  const rahasia = j.kategori === 'RAHASIA';
  const [layak, setLayak] = useState(rahasia ? 0 : Math.round(j.estimasiLembar * 0.85));
  const [cacah, setCacah] = useState(rahasia ? j.estimasiLembar : Math.round(j.estimasiLembar * 0.15));
  const [memuat, setMemuat] = useState(false);
  const total = (layak || 0) + (cacah || 0);

  async function simpan() {
    setMemuat(true);
    const ok = await aksi(() => repo.simpanSortir(b.id, layak, cacah), `Sortir tersimpan. ${angka(total * poinPerLembar)} poin masuk ke penyetor.`);
    setMemuat(false);
    if (ok !== null) tutup();
  }

  return (
    <Modal buka tutup={tutup} judul={`Sortir ${j.kodeQR}`}>
      {rahasia && (
        <p className="mb-5 border-l-2 border-revisi bg-revisi-muda/30 p-3 text-sm">
          Bundel ini ditandai <strong>berisi data pribadi</strong>. Seluruh lembar wajib dicacah — kolom "layak pakai" dikunci di 0.
        </p>
      )}
      <div className="grid grid-cols-2 gap-6">
        <Bidang label="Layak jadi Eco-Paper" petunjuk="sisi belakang bersih">
          <Input type="number" min={0} value={layak} disabled={rahasia} onChange={(e) => setLayak(Math.max(0, Number(e.target.value)))} className="font-mono text-2xl" />
        </Bidang>
        <Bidang label="Dicacah" petunjuk="rusak / dua sisi / rahasia">
          <Input type="number" min={0} value={cacah} onChange={(e) => setCacah(Math.max(0, Number(e.target.value)))} className="font-mono text-2xl" />
        </Bidang>
      </div>
      <div className="mt-5 flex items-baseline justify-between border-t border-dashed border-tinta/30 pt-4 font-mono text-sm">
        <span className="text-tinta-abu">Estimasi penyetor: {angka(j.estimasiLembar)} lbr</span>
        <span>
          Total {angka(total)} lbr → <span className="text-revisi">+{angka(total * poinPerLembar)} poin</span>
        </span>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button varian="hantu" onClick={tutup}>Nanti</Button>
        <Button varian="revisi" memuat={memuat} disabled={total === 0} onClick={simpan}>
          Simpan hasil sortir
        </Button>
      </div>
    </Modal>
  );
}
