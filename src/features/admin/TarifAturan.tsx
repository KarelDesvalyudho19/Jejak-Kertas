import { useState } from 'react';
import { repo } from '@/data';
import { Button } from '@/components/ui/Button';
import { Bidang, Input } from '@/components/ui/Field';
import { JudulHalaman, Kertas, SubJudul } from '@/components/ui/Paper';
import { useApp, useData } from '@/context/AppContext';
import { JENIS_KERTAS_LABEL, JILID_LABEL, WARNA_LABEL } from '@/lib/constants';
import { rupiah } from '@/lib/format';
import { cariTarif } from '@/lib/pricing';
import type { Jilid, JenisKertas, Pengaturan, Tarif, Warna } from '@/lib/types';

const JENIS: JenisKertas[] = ['BARU', 'ECO'];
const WARNA: Warna[] = ['HITAM_PUTIH', 'WARNA'];

export default function TarifAturan() {
  const { data } = useData();
  const { aksi } = useApp();
  const [tarif, setTarif] = useState<Tarif[]>(() =>
    JENIS.flatMap((j) => WARNA.map((w) => ({ jenisKertas: j, warna: w, hargaPerLembar: cariTarif(data.tarif, j, w) }))),
  );
  const [cfg, setCfg] = useState<Pengaturan>(data.pengaturan);
  const ubahTarif = (j: JenisKertas, w: Warna, v: number) => setTarif((t) => t.map((x) => (x.jenisKertas === j && x.warna === w ? { ...x, hargaPerLembar: v } : x)));
  const ecoLebihMahal = WARNA.some((w) => (tarif.find((t) => t.jenisKertas === 'ECO' && t.warna === w)?.hargaPerLembar ?? 0) >= (tarif.find((t) => t.jenisKertas === 'BARU' && t.warna === w)?.hargaPerLembar ?? 0));

  return (
    <>
      <JudulHalaman nomor="01 — Tarif & aturan" judul="Harga per lembar." deskripsi="Perubahan berlaku untuk pesanan baru. Pesanan lama tetap memakai harga saat dipesan." />

      <section>
        <SubJudul>Tarif cetak</SubJudul>
        <Kertas className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-tinta/20">
                <th className="label-mono px-5 py-3 text-left font-normal">Jenis kertas</th>
                {WARNA.map((w) => (
                  <th key={w} className="label-mono px-5 py-3 text-left font-normal">{WARNA_LABEL[w]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {JENIS.map((j) => (
                <tr key={j} className="border-b border-tinta/[0.08] last:border-0">
                  <td className="px-5 py-4 font-serif text-lg font-semibold">{JENIS_KERTAS_LABEL[j]}</td>
                  {WARNA.map((w) => (
                    <td key={w} className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-tinta-abu">Rp</span>
                        <Input type="number" min={0} step={50} value={tarif.find((t) => t.jenisKertas === j && t.warna === w)?.hargaPerLembar ?? 0} onChange={(e) => ubahTarif(j, w, Number(e.target.value))} className="w-28 font-mono" aria-label={`Tarif ${JENIS_KERTAS_LABEL[j]} ${WARNA_LABEL[w]}`} />
                        <span className="font-mono text-[12px] text-tinta-abu">/lbr</span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Kertas>
        {ecoLebihMahal && <p className="mt-2 text-sm text-revisi">Eco-Paper sebaiknya lebih murah dari Kertas Baru — itu insentif utama mahasiswa memilihnya.</p>}
        <Button className="mt-4" onClick={() => aksi(() => repo.simpanTarif(tarif), 'Tarif disimpan.')}>Simpan tarif</Button>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <SubJudul>Biaya jilid (per salinan)</SubJudul>
          <Kertas bergaris className="space-y-4 p-5">
            {(Object.keys(JILID_LABEL) as Jilid[]).map((k) => (
              <div key={k} className="flex items-center justify-between gap-4">
                <span>{JILID_LABEL[k]}</span>
                <Input type="number" min={0} step={500} value={cfg.biayaJilid[k]} disabled={k === 'TANPA'} onChange={(e) => setCfg({ ...cfg, biayaJilid: { ...cfg.biayaJilid, [k]: Number(e.target.value) } })} className="w-28 font-mono" aria-label={`Biaya ${JILID_LABEL[k]}`} />
              </div>
            ))}
          </Kertas>
        </section>
        <section>
          <SubJudul>Aturan poin</SubJudul>
          <Kertas bergaris className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-3">
            <Bidang label="Poin / lembar">
              <Input type="number" min={0} value={cfg.poinPerLembar} onChange={(e) => setCfg({ ...cfg, poinPerLembar: Number(e.target.value) })} className="font-mono" />
            </Bidang>
            <Bidang label="Nilai 1 poin (Rp)">
              <Input type="number" min={1} value={cfg.nilaiPoinRupiah} onChange={(e) => setCfg({ ...cfg, nilaiPoinRupiah: Number(e.target.value) })} className="font-mono" />
            </Bidang>
            <Bidang label="Maks potongan %">
              <Input type="number" min={0} max={100} value={cfg.maksPotonganPersen} onChange={(e) => setCfg({ ...cfg, maksPotonganPersen: Number(e.target.value) })} className="font-mono" />
            </Bidang>
            <p className="text-[12.5px] text-tinta-abu sm:col-span-3">
              Contoh: setor 200 lembar → {200 * cfg.poinPerLembar} poin ≈ potongan {rupiah(200 * cfg.poinPerLembar * cfg.nilaiPoinRupiah)}, dibatasi {cfg.maksPotonganPersen}% dari subtotal pesanan.
            </p>
          </Kertas>
        </section>
      </div>
      <Button className="mt-4" onClick={() => aksi(() => repo.simpanPengaturan(cfg), 'Aturan jilid & poin disimpan.')}>Simpan aturan</Button>
    </>
  );
}
