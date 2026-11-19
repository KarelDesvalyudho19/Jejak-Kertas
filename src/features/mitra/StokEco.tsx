import { useMemo, useState } from 'react';
import { repo } from '@/data';
import { Button } from '@/components/ui/Button';
import { Bidang, Input } from '@/components/ui/Field';
import { Angka, JudulHalaman, Kertas } from '@/components/ui/Paper';
import { useApp, useData, useLookup } from '@/context/AppContext';
import { angka, cn } from '@/lib/format';

export default function StokEco() {
  const { data, user } = useData();
  const { aksi } = useApp();
  const { stok, dok } = useLookup();
  const sekarang = stok.get(user.id) ?? 0;
  const [nilai, setNilai] = useState(sekarang);
  const [memuat, setMemuat] = useState(false);

  const { masuk30, keluar30, antre } = useMemo(() => {
    const batas = Date.now() - 30 * 864e5;
    const jMap = new Map(data.jemput.map((j) => [j.id, j]));
    const masuk30 = data.bundel
      .filter((b) => b.mitraId === user.id && b.tanggalSortir && new Date(b.tanggalSortir).getTime() > batas && jMap.get(b.permintaanJemputId)?.status === 'DIPAKAI_ULANG')
      .reduce((s, b) => s + b.lembarLayak, 0);
    const ecoMilik = data.pesanan.filter((p) => p.mitraId === user.id && p.jenisKertas === 'ECO' && p.status !== 'DIBATALKAN');
    const lbr = (p: (typeof ecoMilik)[number]) => (dok.get(p.dokumenId)?.jumlahHalaman ?? 0) * p.salinan;
    const keluar30 = ecoMilik.filter((p) => new Date(p.createdAt).getTime() > batas).reduce((s, p) => s + lbr(p), 0);
    const antre = ecoMilik.filter((p) => ['DIAJUKAN', 'DIPROSES'].includes(p.status)).reduce((s, p) => s + lbr(p), 0);
    return { masuk30, keluar30, antre };
  }, [data, user.id, dok]);

  const hari = keluar30 > 0 ? Math.floor(sekarang / (keluar30 / 30)) : null;
  const persen = Math.min(100, (sekarang / 2000) * 100);

  return (
    <>
      <JudulHalaman nomor="03 — Stok Eco-Paper" judul="Lembar siap cetak ulang." deskripsi="Stok bertambah otomatis saat bundel aman disalurkan, dan berkurang saat mahasiswa memesan Eco-Paper." />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <Kertas className="p-5">
          <div className="label-mono">Stok saat ini</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={cn('font-serif text-[80px] font-semibold leading-none tracking-rapat tabular-nums', sekarang < 200 && 'text-revisi')}>{angka(sekarang)}</span>
            <span className="font-mono text-sm text-tinta-abu">lembar</span>
          </div>
          {/* tumpukan visual */}
          <div className="mt-6 h-3 w-full border border-tinta/30 bg-kertas">
            <div className="h-full bg-kraft transition-all" style={{ width: `${persen}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[10.5px] text-tinta-abu">
            <span>0</span>
            <span>±4 rim (2.000 lbr)</span>
          </div>
          {sekarang < 200 && <p className="mt-4 text-sm text-revisi">Stok menipis. Pesanan Eco-Paper baru akan ditolak bila lembarnya tidak cukup.</p>}
        </Kertas>
        <div className="grid grid-cols-2 gap-4">
          <Angka label="Masuk 30 hari" nilai={`+${angka(masuk30)}`} satuan="lbr" />
          <Angka label="Terpakai 30 hari" nilai={angka(keluar30)} satuan="lbr" />
          <Angka label="Tertahan antrean" nilai={angka(antre)} satuan="lbr" catatan="sudah dipotong dari stok" />
          <Angka label="Cukup untuk" nilai={hari === null ? '—' : angka(hari)} satuan="hari" catatan="pada laju 30 hari terakhir" />
        </div>
      </div>

      <Kertas bergaris className="mt-5 max-w-xl p-5">
        <h2 className="text-[22px] font-semibold">Koreksi stok fisik</h2>
        <p className="mt-1 text-sm text-tinta-abu">Gunakan setelah stock opname, misalnya bila ada lembar rusak atau terpakai di luar sistem.</p>
        <div className="mt-5 flex flex-wrap items-end gap-4">
          <Bidang label="Jumlah lembar sebenarnya" className="w-56">
            <Input type="number" min={0} value={nilai} onChange={(e) => setNilai(Math.max(0, Number(e.target.value)))} className="font-mono text-xl" />
          </Bidang>
          <Button
            memuat={memuat}
            disabled={nilai === sekarang}
            onClick={async () => {
              setMemuat(true);
              await aksi(() => repo.aturStok(nilai), 'Stok diperbarui.');
              setMemuat(false);
            }}
          >
            Simpan ({nilai - sekarang >= 0 ? '+' : ''}
            {angka(nilai - sekarang)})
          </Button>
        </div>
      </Kertas>
    </>
  );
}
