import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import { repo } from '@/data';
import { Button } from '@/components/ui/Button';
import { Bidang, Chip, Input } from '@/components/ui/Field';
import { Angka, JudulHalaman, Kertas, SubJudul } from '@/components/ui/Paper';
import { useApp, useData } from '@/context/AppContext';
import { angka, angka1, cn } from '@/lib/format';
import { dampakPerBulan, hitungDampak, keCSV, unduhFile } from '@/lib/impact';

// Warna seri: kraft tua (layak pakai) & tinta batu (dicacah) — divalidasi CVD ΔE ≥ 15.
const W_LAYAK = '#B5793A';
const W_CACAH = '#4F6274';
const W_ECO = '#161513';

export default function LaporanDampak() {
  const { data, user } = useData();
  const { aksi } = useApp();
  const [bulan, setBulan] = useState(6);
  const [tabel, setTabel] = useState(false);
  const p = data.pengaturan;
  const [faktor, setFaktor] = useState({ gram: p.gramPerLembar, pohon: p.lembarPerPohon });

  const total = useMemo(() => hitungDampak(data.bundel, data.pesanan, data.dokumen, p), [data, p]);
  const baris = useMemo(() => dampakPerBulan(data.bundel, data.pesanan, data.dokumen, p, bulan), [data, p, bulan]);
  const mhsAktif = new Set(data.jemput.filter((j) => j.status !== 'DIBATALKAN').map((j) => j.mahasiswaId)).size;
  const rahasia = data.jemput.filter((j) => j.status === 'DICACAH').length;

  function ekspor() {
    const rows = baris.map((r) => ({
      bulan: r.kunci,
      lembar_layak: r.layak,
      lembar_dicacah: r.dicacah,
      lembar_diselamatkan: r.layak + r.dicacah,
      kg_tidak_ke_tpa: r.kg,
      lembar_eco_dicetak: r.eco,
      estimasi_pohon: Number((r.eco / p.lembarPerPohon).toFixed(4)),
    }));
    unduhFile(`laporan-dampak-jejakkertas-${new Date().toISOString().slice(0, 10)}.csv`, keCSV(rows));
  }

  return (
    <>
      <JudulHalaman
        nomor="00 — Meja kerja"
        judul={<>Halo, {user.nama.split(' ')[0]}.</>}
        deskripsi={`${angka(total.lembarDiselamatkan)} lembar tidak sampai ke TPA, dari ${angka(mhsAktif)} mahasiswa penyetor. ${angka(rahasia)} bundel berisi data pribadi sudah dicacah.`}
        aksi={<Button varian="garis" onClick={ekspor}>Ekspor CSV</Button>}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Angka label="Lembar diselamatkan" nilai={angka(total.lembarDiselamatkan)} satuan="lbr" aksen catatan={`${angka(total.lembarLayak)} layak · ${angka(total.lembarDicacah)} dicacah`} />
        <Angka label="Kertas tidak ke TPA" nilai={angka1(total.kg)} satuan="kg" catatan={`@ ${p.gramPerLembar} g/lembar`} />
        <Angka label="Lembar Eco dicetak" nilai={angka(total.lembarEcoDicetak)} satuan="lbr" catatan="kertas baru tak perlu dibeli" />
        <Angka label="Estimasi pohon" nilai={angka1(total.pohon)} satuan="pohon" catatan={`@ ${angka(p.lembarPerPohon)} lembar/pohon`} />
      </div>

      <section className="mt-8">
        <SubJudul
          kanan={
            <div className="flex gap-2">
              {[3, 6, 12].map((n) => (
                <Chip key={n} aktif={bulan === n} onClick={() => setBulan(n)}>
                  {n} bln
                </Chip>
              ))}
              <Chip aktif={tabel} onClick={() => setTabel(!tabel)}>Tabel</Chip>
            </div>
          }
        >
          Lembar terkumpul per bulan
        </SubJudul>
        <Kertas className="p-5">
          <div className="mb-3 flex flex-wrap gap-5 text-[13px] text-tinta-abu">
            <Legenda warna={W_LAYAK} label="Layak pakai → Eco-Paper" />
            <Legenda warna={W_CACAH} label="Dicacah → daur ulang" />
          </div>
          {tabel ? (
            <TabelBulan baris={baris} />
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={baris} margin={{ top: 18, right: 8, left: -8, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid vertical={false} stroke="rgba(22,21,19,0.08)" />
                  <XAxis dataKey="bulan" tickLine={false} axisLine={{ stroke: 'rgba(22,21,19,0.3)' }} tick={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fill: '#6B675F' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fill: '#6B675F' }} tickFormatter={(v) => angka(v)} />
                  <Tooltip cursor={{ fill: 'rgba(22,21,19,0.05)' }} content={<TipKertas />} />
                  <Bar dataKey="layak" name="Layak pakai" stackId="a" fill={W_LAYAK} stroke="#FBFAF6" strokeWidth={2} />
                  <Bar dataKey="dicacah" name="Dicacah" stackId="a" fill={W_CACAH} stroke="#FBFAF6" strokeWidth={2} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Kertas>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <SubJudul>Lembar Eco-Paper dicetak</SubJudul>
          <Kertas className="p-5">
            <div className="h-[220px]">
              <ResponsiveContainer>
                <LineChart data={baris} margin={{ top: 18, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(22,21,19,0.08)" />
                  <XAxis dataKey="bulan" tickLine={false} axisLine={{ stroke: 'rgba(22,21,19,0.3)' }} tick={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fill: '#6B675F' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fill: '#6B675F' }} tickFormatter={(v) => angka(v)} />
                  <Tooltip cursor={{ stroke: '#D33A2C', strokeWidth: 1 }} content={<TipKertas />} />
                  <Line type="monotone" dataKey="eco" name="Lembar Eco" stroke={W_ECO} strokeWidth={2} dot={{ r: 4, fill: '#FBFAF6', stroke: W_ECO, strokeWidth: 2 }} activeDot={{ r: 5, fill: '#D33A2C', stroke: '#FBFAF6', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Kertas>
        </section>

        <section>
          <SubJudul>Faktor konversi</SubJudul>
          <Kertas bergaris className="p-5">
            <div className="grid grid-cols-2 gap-5">
              <Bidang label="Gram / lembar">
                <Input type="number" step="0.1" min={0.1} value={faktor.gram} onChange={(e) => setFaktor({ ...faktor, gram: Number(e.target.value) })} className="font-mono" />
              </Bidang>
              <Bidang label="Lembar / pohon">
                <Input type="number" min={1} value={faktor.pohon} onChange={(e) => setFaktor({ ...faktor, pohon: Number(e.target.value) })} className="font-mono" />
              </Bidang>
            </div>
            <p className="mt-4 text-[12.5px] leading-relaxed text-tinta-abu">
              <strong className="text-tinta">Cara hitung.</strong> Lembar diselamatkan = layak + dicacah (keduanya tidak dibuang ke TPA). Kg = lembar × gram ÷ 1.000. Pohon = lembar Eco-Paper dicetak ÷ lembar per pohon — yaitu kertas baru yang tidak perlu diproduksi.
            </p>
            <Button
              className="mt-4"
              ukuran="sm"
              disabled={faktor.gram === p.gramPerLembar && faktor.pohon === p.lembarPerPohon}
              onClick={() => aksi(() => repo.simpanPengaturan({ ...p, gramPerLembar: faktor.gram, lembarPerPohon: faktor.pohon }), 'Faktor konversi diperbarui.')}
            >
              Simpan faktor
            </Button>
          </Kertas>
        </section>
      </div>
    </>
  );
}

function Legenda({ warna, label }: { warna: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-3 w-3 rounded-[2px]" style={{ background: warna }} />
      {label}
    </span>
  );
}

function TipKertas({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const jumlah = payload.reduce((s, x) => s + Number(x.value ?? 0), 0);
  return (
    <div className="border border-tinta/20 bg-kertas-terang px-3 py-2 font-mono text-[12px] shadow-kertas">
      <div className="mb-1 text-tinta-abu">{label}</div>
      {payload.map((x) => (
        <div key={x.dataKey as string} className="flex items-center justify-between gap-6">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px]" style={{ background: x.color }} />
            {x.name}
          </span>
          <span className="font-semibold">{angka(Number(x.value))}</span>
        </div>
      ))}
      {payload.length > 1 && (
        <div className={cn('mt-1 flex justify-between gap-6 border-t border-dashed border-tinta/25 pt-1')}>
          <span>Total</span>
          <span className="font-semibold">{angka(jumlah)}</span>
        </div>
      )}
    </div>
  );
}

function TabelBulan({ baris }: { baris: ReturnType<typeof dampakPerBulan> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] font-mono text-[12.5px]">
        <thead>
          <tr className="border-b border-tinta/20 text-left">
            <th className="label-mono py-2 pr-3 font-normal">Bulan</th>
            <th className="label-mono py-2 pr-3 text-right font-normal">Layak</th>
            <th className="label-mono py-2 pr-3 text-right font-normal">Dicacah</th>
            <th className="label-mono py-2 pr-3 text-right font-normal">Kg</th>
            <th className="label-mono py-2 text-right font-normal">Eco dicetak</th>
          </tr>
        </thead>
        <tbody>
          {baris.map((r) => (
            <tr key={r.kunci} className="border-b border-tinta/[0.07]">
              <td className="py-1.5 pr-3">{r.bulan}</td>
              <td className="py-1.5 pr-3 text-right">{angka(r.layak)}</td>
              <td className="py-1.5 pr-3 text-right">{angka(r.dicacah)}</td>
              <td className="py-1.5 pr-3 text-right">{angka1(r.kg)}</td>
              <td className="py-1.5 text-right">{angka(r.eco)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
