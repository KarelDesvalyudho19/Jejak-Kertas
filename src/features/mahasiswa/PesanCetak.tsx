import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { repo } from '@/data';
import { jarakKm } from '@/components/map/Peta';
import { Button } from '@/components/ui/Button';
import { Bidang, Chip, PilihanKartu } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { JudulHalaman } from '@/components/ui/Paper';
import { Stempel } from '@/components/ui/Stempel';
import { BarisStruk, PemisahStruk, Struk } from '@/components/ui/Struk';
import { useApp, useData, useLookup } from '@/context/AppContext';
import { JENIS_KERTAS_LABEL, JILID_LABEL, WARNA_LABEL } from '@/lib/constants';
import { angka, angka1, cn, rupiah } from '@/lib/format';
import { hitungHalamanPdf, tampakFinal } from '@/lib/pdf';
import { cariTarif, hitungHarga } from '@/lib/pricing';
import type { Jilid, JenisKertas, Mahasiswa, Warna } from '@/lib/types';

export default function PesanCetak() {
  const { data, user } = useData();
  const me = user as Mahasiswa;
  const { aksi } = useApp();
  const { mitra, stok } = useLookup();
  const nav = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [halaman, setHalaman] = useState(0);
  const [membaca, setMembaca] = useState(false);
  const [galatPdf, setGalatPdf] = useState<string | null>(null);
  const [seret, setSeret] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [jenis, setJenis] = useState<JenisKertas>('ECO');
  const [warna, setWarna] = useState<Warna>('HITAM_PUTIH');
  const [jilid, setJilid] = useState<Jilid>('STAPLES');
  const [salinan, setSalinan] = useState(1);
  const [mitraId, setMitraId] = useState<string>('');
  const [poin, setPoin] = useState(0);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [mengirim, setMengirim] = useState(false);

  const daftarMitra = useMemo(
    () =>
      mitra
        .map((m) => ({ m, jarak: me.lat ? jarakKm([me.lat, me.lng], [m.lat, m.lng]) : 0, stok: stok.get(m.id) ?? 0 }))
        .sort((a, b) => a.jarak - b.jarak),
    [mitra, stok, me.lat, me.lng],
  );
  const lembar = halaman * salinan;
  const mitraTerpilih = daftarMitra.find((x) => x.m.id === mitraId);
  const stokKurang = jenis === 'ECO' && !!mitraTerpilih && mitraTerpilih.stok < lembar;

  const h = hitungHarga({ jumlahHalaman: halaman, salinan, jenisKertas: jenis, warna, jilid, poinDipakai: poin }, data.tarif, data.pengaturan, me.saldoPoin);
  const hBaru = hitungHarga({ jumlahHalaman: halaman, salinan, jenisKertas: 'BARU', warna, jilid, poinDipakai: 0 }, data.tarif, data.pengaturan, 0);

  async function pilihBerkas(f: File | undefined) {
    if (!f) return;
    setGalatPdf(null);
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setGalatPdf('Berkas harus PDF. Ekspor dulu dari Word/Docs ke PDF.');
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      setGalatPdf('Ukuran maksimal 25 MB.');
      return;
    }
    setFile(f);
    setHalaman(0);
    setMembaca(true);
    try {
      const n = await hitungHalamanPdf(f);
      setHalaman(n);
      if (tampakFinal(f.name)) setJenis('BARU');
    } catch {
      setGalatPdf('PDF tidak bisa dibaca. Mungkin terkunci kata sandi atau rusak.');
      setFile(null);
    } finally {
      setMembaca(false);
    }
  }

  const siap = !!file && halaman > 0 && !!mitraId && !stokKurang && salinan >= 1;

  async function kirim() {
    if (!file) return;
    setMengirim(true);
    const hasil = await aksi(async () => {
      const dok = await repo.unggahDokumen(file, halaman);
      return repo.buatPesanan({ mitraId, dokumenId: dok.id, jenisKertas: jenis, warna, jilid, salinan, poinDipakai: h.poinDipakai });
    }, 'Pesanan cetak terkirim ke mitra.');
    setMengirim(false);
    setKonfirmasi(false);
    if (hasil) nav(`/mhs/lacak/pesanan/${hasil.id}`);
  }

  return (
    <>
      <JudulHalaman nomor="01 — Pesan cetak" judul="Cetak draf berikutnya." deskripsi="Unggah PDF, pilih kertas dan mitra. Harga dihitung langsung di struk sebelah." />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* 1. Berkas */}
          <Langkah no="1" judul="Unggah dokumen">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setSeret(true);
              }}
              onDragLeave={() => setSeret(false)}
              onDrop={(e) => {
                e.preventDefault();
                setSeret(false);
                pilihBerkas(e.dataTransfer.files[0]);
              }}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center border-2 border-dashed bg-kertas px-6 py-8 text-center transition-colors',
                seret ? 'border-revisi bg-revisi-muda/30' : 'border-tinta/25 hover:border-tinta/60',
              )}
            >
              <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => pilihBerkas(e.target.files?.[0])} />
              {file ? (
                <div className="flex w-full max-w-md items-center gap-4 text-left">
                  <div className="grid h-14 w-11 shrink-0 place-items-center border border-tinta bg-kertas-terang font-mono text-[10px] font-semibold text-revisi">PDF</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{file.name}</div>
                    <div className="font-mono text-[12px] text-tinta-abu">
                      {membaca ? 'Menghitung halaman…' : `${halaman} halaman · ${angka1(file.size / 1024 / 1024)} MB`}
                    </div>
                  </div>
                  <span className="text-sm text-tinta-abu underline">ganti</span>
                </div>
              ) : (
                <>
                  <div className="font-serif text-xl font-semibold">Seret PDF ke sini</div>
                  <div className="mt-1 text-sm text-tinta-abu">atau klik untuk memilih berkas · maks. 25 MB</div>
                </>
              )}
            </div>
            {galatPdf && <p className="mt-2 text-sm text-revisi">{galatPdf}</p>}
          </Langkah>

          {/* 2. Kertas */}
          <Langkah no="2" judul="Jenis kertas">
            <PilihanKartu<JenisKertas>
              nama="jenis"
              nilai={jenis}
              onChange={setJenis}
              opsi={[
                {
                  nilai: 'ECO',
                  judul: (
                    <span className="flex items-center gap-2">
                      Eco-Paper <span className="font-mono text-[12px] font-normal text-tinta-abu">{rupiah(cariTarif(data.tarif, 'ECO', warna))}/lbr</span>
                    </span>
                  ),
                  isi: 'Dicetak di sisi kosong kertas bekas yang sudah disortir. Untuk draf & bahan bimbingan.',
                  tambahan: <span className="mt-2 inline-block w-fit border border-sukses px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sukses">bukan untuk berkas final</span>,
                },
                {
                  nilai: 'BARU',
                  judul: (
                    <span className="flex items-center gap-2">
                      Kertas Baru <span className="font-mono text-[12px] font-normal text-tinta-abu">{rupiah(cariTarif(data.tarif, 'BARU', warna))}/lbr</span>
                    </span>
                  ),
                  isi: 'HVS 80 gsm baru. Untuk naskah sidang, berkas yang diserahkan, dan jilid final.',
                },
              ]}
            />
            <AnimatePresence>
              {file && tampakFinal(file.name) && jenis === 'ECO' && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 border-l-2 border-revisi pl-3 text-sm text-revisi">
                  Nama berkasnya seperti berkas final. Eco-Paper punya bekas cetakan di baliknya — sebaiknya pakai Kertas Baru untuk yang diserahkan ke prodi.
                </motion.p>
              )}
            </AnimatePresence>
          </Langkah>

          {/* 3. Spesifikasi */}
          <Langkah no="3" judul="Warna, jilid, salinan">
            <div className="grid gap-6 sm:grid-cols-[1fr_1fr]">
              <Bidang label="Warna">
                <div className="mt-1 flex flex-wrap gap-2">
                  {(['HITAM_PUTIH', 'WARNA'] as Warna[]).map((w) => (
                    <Chip key={w} aktif={warna === w} onClick={() => setWarna(w)}>
                      {WARNA_LABEL[w]}
                    </Chip>
                  ))}
                </div>
              </Bidang>
              <Bidang label="Jumlah salinan">
                <div className="mt-1 flex items-center">
                  <button type="button" className="grid h-8 w-8 place-items-center border border-tinta/30 hover:border-tinta" onClick={() => setSalinan((s) => Math.max(1, s - 1))} aria-label="Kurangi">−</button>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={salinan}
                    onChange={(e) => setSalinan(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                    className="h-8 w-14 border-y border-tinta/30 bg-transparent text-center font-mono text-sm focus:outline-none"
                    aria-label="Jumlah salinan"
                  />
                  <button type="button" className="grid h-8 w-8 place-items-center border border-tinta/30 hover:border-tinta" onClick={() => setSalinan((s) => Math.min(50, s + 1))} aria-label="Tambah">+</button>
                </div>
              </Bidang>
            </div>
            <div className="mt-6">
              <Bidang label="Jilid">
                <div className="mt-1 flex flex-wrap gap-2">
                  {(Object.keys(JILID_LABEL) as Jilid[]).map((j) => (
                    <Chip key={j} aktif={jilid === j} onClick={() => setJilid(j)}>
                      {JILID_LABEL[j]}
                      {data.pengaturan.biayaJilid[j] > 0 && <span className="font-mono text-[11px] opacity-70">+{angka(data.pengaturan.biayaJilid[j])}</span>}
                    </Chip>
                  ))}
                </div>
              </Bidang>
            </div>
          </Langkah>

          {/* 4. Mitra */}
          <Langkah no="4" judul="Mitra percetakan">
            <div className="grid gap-3 sm:grid-cols-3">
              {daftarMitra.map(({ m, jarak, stok: s }) => {
                const kurang = jenis === 'ECO' && s < lembar && lembar > 0;
                const aktif = mitraId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMitraId(m.id)}
                    className={cn(
                      'flex flex-col border bg-kertas-terang p-3.5 text-left transition-all',
                      aktif ? 'border-tinta shadow-[3px_3px_0_#161513]' : 'border-tinta/15 hover:border-tinta/50',
                    )}
                  >
                    <span className="font-medium leading-snug">{m.namaUsaha}</span>
                    <span className="mt-1 line-clamp-2 text-[12.5px] text-tinta-abu">{m.alamat}</span>
                    <span className="mt-3 flex items-center justify-between font-mono text-[11px]">
                      <span className="text-tinta-abu">{jarak ? `${angka1(jarak)} km dari kos` : '—'}</span>
                      <span className={cn(kurang ? 'text-revisi' : 'text-sukses')}>eco {angka(s)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {stokKurang && <p className="mt-3 text-sm text-revisi">Stok Eco-Paper di {mitraTerpilih?.m.namaUsaha} tinggal {angka(mitraTerpilih!.stok)} lembar. Pilih mitra lain atau ganti ke Kertas Baru.</p>}
          </Langkah>

          {/* 5. Poin */}
          <Langkah no="5" judul="Pakai poin">
            {me.saldoPoin <= 0 ? (
              <p className="text-sm text-tinta-abu">Saldo poinmu masih 0. Setor kertas bekas untuk mengumpulkan poin.</p>
            ) : (
              <div>
                <div className="flex items-baseline justify-between text-sm">
                  <span>
                    Pakai <span className="font-mono font-semibold">{angka(h.poinDipakai)}</span> dari {angka(me.saldoPoin)} poin
                  </span>
                  <span className="font-mono text-[12px] text-tinta-abu">maks. {angka(h.maksPoin)} ({data.pengaturan.maksPotonganPersen}% subtotal)</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={h.maksPoin}
                  step={1}
                  value={Math.min(poin, h.maksPoin)}
                  onChange={(e) => setPoin(Number(e.target.value))}
                  disabled={h.maksPoin === 0}
                  className="mt-3 w-full accent-[#D33A2C]"
                  aria-label="Jumlah poin yang dipakai"
                />
                <div className="mt-2 flex gap-2">
                  <Chip onClick={() => setPoin(0)} aktif={h.poinDipakai === 0}>Tidak pakai</Chip>
                  <Chip onClick={() => setPoin(h.maksPoin)} aktif={h.poinDipakai === h.maksPoin && h.maksPoin > 0}>Pakai maksimal</Chip>
                </div>
              </div>
            )}
          </Langkah>
        </div>

        {/* Struk */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Struk judul="JejakKertas-Zero" sub={mitraTerpilih ? mitraTerpilih.m.namaUsaha : 'pilih mitra percetakan'}>
            <div className="mb-2 truncate text-[11px] text-tinta-abu">{file?.name ?? 'belum ada dokumen'}</div>
            <BarisStruk kiri={`${halaman} hlm × ${salinan}`} kanan={`${angka(lembar)} lbr`} />
            <BarisStruk kiri={`${JENIS_KERTAS_LABEL[jenis]} ${warna === 'WARNA' ? 'warna' : 'HP'}`} kanan={`@${angka(h.hargaPerLembar)}`} kecil />
            <BarisStruk kiri="Cetak" kanan={rupiah(h.biayaCetak)} />
            <BarisStruk kiri={JILID_LABEL[jilid]} kanan={rupiah(h.biayaJilid)} />
            <PemisahStruk />
            <BarisStruk kiri="Subtotal" kanan={rupiah(h.subtotal)} />
            {h.poinDipakai > 0 && <BarisStruk kiri={`Poin −${angka(h.poinDipakai)}`} kanan={`−${rupiah(h.potongan)}`} merah />}
            <PemisahStruk />
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-semibold uppercase tracking-widest">Total</span>
              <motion.span key={h.total} initial={{ scale: 1.15, color: '#D33A2C' }} animate={{ scale: 1, color: '#161513' }} className="text-[22px] font-semibold tabular-nums">
                {rupiah(h.total)}
              </motion.span>
            </div>
            {jenis === 'ECO' && lembar > 0 && (
              <div className="mt-4 border border-dashed border-sukses/60 p-2 text-center text-[11px] leading-snug text-sukses">
                Hemat {rupiah(Math.max(0, hBaru.subtotal - h.total))} dan {angka(lembar)} lembar kertas baru
                <br />
                dibanding Kertas Baru
              </div>
            )}
            <Button varian="revisi" className="mt-5 w-full" disabled={!siap} onClick={() => setKonfirmasi(true)}>
              Konfirmasi pesanan
            </Button>
            {!siap && (
              <div className="mt-2 text-center text-[11px] text-tinta-abu">
                {!file ? 'Unggah PDF dulu' : !mitraId ? 'Pilih mitra percetakan' : stokKurang ? 'Stok Eco-Paper tidak cukup' : membaca ? 'Membaca PDF…' : ''}
              </div>
            )}
          </Struk>
        </aside>
      </div>

      <Modal buka={konfirmasi} tutup={() => !mengirim && setKonfirmasi(false)} judul="Kirim pesanan ini?">
        <div className="relative">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-tinta-abu">Dokumen</dt>
            <dd className="truncate font-medium">{file?.name}</dd>
            <dt className="text-tinta-abu">Spesifikasi</dt>
            <dd>
              {JENIS_KERTAS_LABEL[jenis]}, {WARNA_LABEL[warna].toLowerCase()}, {JILID_LABEL[jilid].toLowerCase()}, {salinan} salinan
            </dd>
            <dt className="text-tinta-abu">Mitra</dt>
            <dd>{mitraTerpilih?.m.namaUsaha}</dd>
            <dt className="text-tinta-abu">Poin dipakai</dt>
            <dd className="font-mono">{angka(h.poinDipakai)}</dd>
            <dt className="text-tinta-abu">Total bayar</dt>
            <dd className="font-mono text-lg font-semibold">{rupiah(h.total)}</dd>
          </dl>
          <p className="mt-4 text-[13px] text-tinta-abu">Bayar di tempat saat mengambil cetakan. Pesanan masih bisa dibatalkan selama mitra belum memprosesnya; poin akan dikembalikan.</p>
          {jenis === 'ECO' && (
            <div className="pointer-events-none absolute -right-2 -top-14">
              <Stempel atas="eco-paper" tengah="DRAF" bawah="sisi belakang" ukuran={84} miring={12} />
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button varian="hantu" onClick={() => setKonfirmasi(false)} disabled={mengirim}>
            Periksa lagi
          </Button>
          <Button varian="revisi" onClick={kirim} memuat={mengirim}>
            Kirim pesanan
          </Button>
        </div>
      </Modal>
    </>
  );
}

function Langkah({ no, judul, children }: { no: string; judul: string; children: React.ReactNode }) {
  return (
    <section className="kartu p-5">
      <div className="mb-4 flex items-baseline gap-3 border-b border-dashed border-tinta/20 pb-3">
        <span className="font-serif text-[28px] font-semibold italic leading-none text-revisi">{no}</span>
        <h2 className="text-[19px] font-semibold leading-tight">{judul}</h2>
      </div>
      {children}
    </section>
  );
}

