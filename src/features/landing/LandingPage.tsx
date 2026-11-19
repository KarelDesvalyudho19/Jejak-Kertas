import { motion } from 'framer-motion';
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { repo } from '@/data';
import type { RingkasanPublik } from '@/data/repo';
import { TombolTautan } from '@/components/ui/Button';
import { CatatanDosen, Coret, GarisBawah, Lingkari } from '@/components/ui/Coretan';
import { Stempel } from '@/components/ui/Stempel';
import { BarisStruk, PemisahStruk, Struk } from '@/components/ui/Struk';
import { useApp } from '@/context/AppContext';
import { angka, angka1, rupiah } from '@/lib/format';
import { cariTarif } from '@/lib/pricing';
import { berandaPeran } from '@/lib/navigasi';

const MejaRevisi = lazy(() => import('@/components/three/MejaRevisi'));

function webglTersedia() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function IlustrasiCadangan() {
  return (
    <div className="relative mx-auto h-full w-full max-w-md">
      {[8, -4, 3].map((r, i) => (
        <div key={i} className="absolute left-1/2 top-1/2 h-[70%] w-[52%] -translate-x-1/2 -translate-y-1/2 border border-tinta/15 bg-kertas-terang shadow-kertas" style={{ transform: `translate(-50%,-50%) rotate(${r}deg) translateY(${i * 6}px)` }}>
          <div className="space-y-2 p-6">
            {Array.from({ length: 12 }).map((_, k) => (
              <div key={k} className="h-1.5 bg-tinta/20" style={{ width: `${60 + ((k * 37) % 40)}%` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const muncul = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] } }),
};

export default function LandingPage() {
  const { user } = useApp();
  const [ringkas, setRingkas] = useState<RingkasanPublik | null>(null);
  const [siap3D, setSiap3D] = useState(false);

  useEffect(() => {
    repo.ringkasanPublik().then(setRingkas).catch(() => setRingkas(null));
    // tunggu font termuat agar teks di tekstur kanvas 3D memakai Fraunces
    const ok = webglTersedia();
    if (!ok) return;
    (document.fonts?.ready ?? Promise.resolve()).then(() => setSiap3D(true));
  }, []);

  const keCetak = user ? (user.role === 'MAHASISWA' ? '/mhs/cetak' : berandaPeran(user.role)) : '/masuk';
  const keJemput = user ? (user.role === 'MAHASISWA' ? '/mhs/jemput' : berandaPeran(user.role)) : '/masuk';

  const tarif = ringkas?.tarif ?? [];
  const hargaEco = cariTarif(tarif, 'ECO', 'HITAM_PUTIH') || 250;
  const hargaBaru = cariTarif(tarif, 'BARU', 'HITAM_PUTIH') || 500;
  const lembarSelamat = ringkas ? ringkas.lembarLayak + ringkas.lembarDicacah : 0;

  return (
    <>
      {/* ——— HERO ——— */}
      <section className="relative overflow-hidden border-b border-tinta/10">
        <div className="grid-milimeter pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.08fr_1fr] lg:pb-24 lg:pt-16">
          <motion.div initial="hidden" animate="show">
            <motion.div variants={muncul} custom={0} className="label-mono mb-6 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-block h-2 w-2 bg-revisi" />
              Kandang Limun · Jl. W.R. Supratman · Bumi Ayu — sekitar UNIB
            </motion.div>
            <motion.h1 variants={muncul} custom={1} className="text-[46px] font-semibold leading-[0.98] sm:text-[64px] lg:text-[78px]">
              Revisi boleh berkali-kali.
              <br />
              Kertasnya jangan <Coret tunda={0.9}>dibuang</Coret>
              <span className="text-revisi">.</span>
            </motion.h1>
            <motion.div variants={muncul} custom={2} className="mt-3 pl-1 text-[22px] sm:text-[26px]">
              <CatatanDosen>↳ balik, cetak lagi di belakangnya.</CatatanDosen>
            </motion.div>
            <motion.p variants={muncul} custom={3} className="mt-7 max-w-xl text-[17px] leading-relaxed text-tinta-abu">
              JejakKertas-Zero mencetak draf laporan praktikum dan skripsimu di sisi kosong kertas bekas, menjemput tumpukan lembar revisi langsung dari kos, lalu mengubah setiap setoran jadi potongan biaya cetak berikutnya.
            </motion.p>
            <motion.div variants={muncul} custom={4} className="mt-9 flex flex-wrap gap-4">
              <TombolTautan to={keCetak} varian="revisi" ukuran="lg">
                Pesan cetak draf
              </TombolTautan>
              <TombolTautan to={keJemput} varian="garis" ukuran="lg">
                Jadwalkan jemput kertas
              </TombolTautan>
            </motion.div>
            <motion.dl variants={muncul} custom={5} className="mt-12 grid max-w-xl grid-cols-3 border-y border-tinta/15 font-mono text-[12px]">
              <div className="border-r border-tinta/15 py-3 pr-3">
                <dt className="text-tinta-abu">Eco-Paper</dt>
                <dd className="mt-1 text-[15px] font-semibold text-tinta">{rupiah(hargaEco)}<span className="font-normal text-tinta-abu">/lbr</span></dd>
              </div>
              <div className="border-r border-tinta/15 px-3 py-3">
                <dt className="text-tinta-abu">Setor 1 lembar</dt>
                <dd className="mt-1 text-[15px] font-semibold text-tinta">+{ringkas?.poinPerLembar ?? 1} poin</dd>
              </div>
              <div className="py-3 pl-3">
                <dt className="text-tinta-abu">Data pribadi</dt>
                <dd className="mt-1 text-[15px] font-semibold text-revisi">dicacah</dd>
              </div>
            </motion.dl>
          </motion.div>

          <div className="relative h-[380px] sm:h-[460px] lg:h-[560px]">
            {siap3D ? (
              <Suspense fallback={<IlustrasiCadangan />}>
                <MejaRevisi />
              </Suspense>
            ) : (
              <IlustrasiCadangan />
            )}
            <div className="pointer-events-none absolute bottom-6 right-2 sm:right-8">
              <Stempel atas="Eco-Paper" tengah="DRAF" bawah="bukan berkas final" ukuran={108} miring={-14} />
            </div>
          </div>
        </div>
      </section>

      {/* ——— MASALAH ——— */}
      <section className="border-b border-tinta/10 bg-kertas-terang">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="label-mono mb-3">§ 01 — Latar belakang</div>
              <h2 className="text-[38px] font-semibold leading-[1.02] sm:text-[48px]">
                Satu laporan, <Lingkari>lima kali cetak</Lingkari>.
              </h2>
              <p className="mt-5 max-w-md text-tinta-abu">
                Dosen pembimbing mencoret, mahasiswa mencetak ulang. Polanya sama di setiap kos sekitar kampus — dan ujungnya selalu di tong sampah.
              </p>
            </div>
            <ol className="bergaris relative border-l border-revisi/50 pl-6 sm:pl-10">
              {[
                ['Revisi ketiga, keempat, kelima.', 'Laporan praktikum dan draf skripsi dicetak ulang setiap kali bimbingan. Lembar versi lama langsung dianggap sampah.'],
                ['Sisi belakangnya masih putih.', 'Hampir semua draf dicetak satu sisi. Artinya separuh dari kertas yang dibuang itu belum pernah dipakai sama sekali.'],
                ['TPA Air Sebakul sudah melebihi kapasitas.', 'Sampah Kota Bengkulu bermuara di sana. Kertas yang sebenarnya masih berguna ikut menumpuk bersama sampah lain.'],
              ].map(([j, isi], i) => (
                <motion.li
                  key={j}
                  className="relative pb-8 last:pb-0"
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                >
                  <span className="absolute -left-[42px] top-1 hidden font-mono text-xs text-revisi sm:block">0{i + 1}</span>
                  <h3 className="font-serif text-[24px] font-semibold leading-8">{j}</h3>
                  <p className="mt-1 max-w-xl leading-8 text-tinta-abu">{isi}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ——— CARA KERJA ——— */}
      <section id="cara-kerja" className="scroll-mt-20 border-b border-tinta/10">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="label-mono mb-3">§ 02 — Cara kerja</div>
              <h2 className="max-w-2xl text-[38px] font-semibold leading-[1.02] sm:text-[48px]">
                Lima langkah, dari <GarisBawah>meja kos</GarisBawah> kembali ke meja kos.
              </h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {LANGKAH.map((l, i) => (
              <motion.article
                key={l.huruf}
                className="kartu group relative flex flex-col p-5"
                style={{ rotate: `${[-0.8, 0.6, -0.4, 0.9, -0.6][i]}deg` }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, rotate: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.07, duration: 0.45 }}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-[44px] font-semibold italic leading-none text-revisi">{l.huruf}</span>
                  <span className="label-mono">{l.tag}</span>
                </div>
                <h3 className="mt-5 font-serif text-[21px] font-semibold leading-tight">{l.judul}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-tinta-abu">{l.isi}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ——— ECO VS BARU ——— */}
      <section id="eco-paper" className="scroll-mt-20 border-b border-tinta/10 bg-kraft-muda/40">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="label-mono mb-3">§ 03 — Pilih kertasnya</div>
            <h2 className="text-[38px] font-semibold leading-[1.02] sm:text-[48px]">Draf cukup di Eco-Paper. Berkas final, kertas baru.</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <Kolom judul="Pakai Eco-Paper untuk" warna="text-sukses">
                <li>Draf yang akan dicoret pembimbing</li>
                <li>Bahan bimbingan & asistensi praktikum</li>
                <li>Latihan presentasi, catatan baca</li>
              </Kolom>
              <Kolom judul="Pakai Kertas Baru untuk" warna="text-revisi">
                <li>Naskah sidang & berkas yang dijilid final</li>
                <li>Dokumen yang diserahkan ke prodi atau fakultas</li>
                <li>Apa pun yang perlu dicetak bolak-balik bersih</li>
              </Kolom>
            </div>
            <p className="mt-8 max-w-lg text-[14px] text-tinta-abu">
              Eco-Paper adalah lembar setoran yang sudah disortir mitra: satu sisinya bekas cetakan, sisi lainnya masih kosong. Tulisanmu dicetak di sisi kosong itu. Lembar dari bundel berisi data pribadi tidak pernah masuk ke stok ini.
            </p>
          </div>
          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-center">
            <Struk judul="Kertas Baru" sub="Draf 30 halaman · HP" className="w-full max-w-[250px] sm:mt-10 sm:-rotate-2">
              <BarisStruk kiri="30 lbr × tarif" kanan={rupiah(hargaBaru)} />
              <BarisStruk kiri="Jilid staples" kanan={rupiah(500)} />
              <PemisahStruk />
              <BarisStruk kiri="TOTAL" kanan={rupiah(30 * hargaBaru + 500)} tebal />
              <div className="mt-4 text-center text-[11px] text-tinta-abu">30 lembar kertas baru terpakai</div>
            </Struk>
            <div className="relative w-full max-w-[250px] sm:rotate-2">
              <Struk judul="Eco-Paper" sub="Draf 30 halaman · HP">
                <BarisStruk kiri="30 lbr × tarif" kanan={rupiah(hargaEco)} />
                <BarisStruk kiri="Jilid staples" kanan={rupiah(500)} />
                <BarisStruk kiri="Potong 100 poin" kanan={`-${rupiah(100 * (ringkas?.nilaiPoinRupiah ?? 10))}`} merah />
                <PemisahStruk />
                <BarisStruk kiri="TOTAL" kanan={rupiah(30 * hargaEco + 500 - 100 * (ringkas?.nilaiPoinRupiah ?? 10))} tebal />
                <div className="mt-4 text-center text-[11px] text-sukses">0 lembar kertas baru terpakai</div>
              </Struk>
              <div className="absolute -right-6 -top-8">
                <Stempel atas="hemat" tengah={`${Math.round((1 - (30 * hargaEco + 500 - 100 * (ringkas?.nilaiPoinRupiah ?? 10)) / (30 * hargaBaru + 500)) * 100)}%`} bawah="dibanding baru" warna="#2F5D50" ukuran={92} miring={10} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— KERAHASIAAN ——— */}
      <section id="kerahasiaan" className="scroll-mt-20 border-b border-tinta/10">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="label-mono mb-3">§ 04 — Kerahasiaan</div>
          <h2 className="max-w-3xl text-[38px] font-semibold leading-[1.02] sm:text-[48px]">KRS dan slip UKT-mu tidak akan jadi kertas draf orang lain.</h2>
          <div className="mt-12 grid gap-px border border-tinta/15 bg-tinta/15 md:grid-cols-2">
            <div className="bergaris bg-kertas-terang p-8">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-[26px] font-semibold">Aman dipakai ulang</h3>
                <span className="font-mono text-xs text-sukses">→ STOK ECO-PAPER</span>
              </div>
              <ul className="mt-4 space-y-0 leading-8 text-tinta-abu">
                <li>Draf laporan & skripsi versi lama</li>
                <li>Catatan kuliah, fotokopi modul</li>
                <li>Lembar latihan soal, print-out jurnal</li>
              </ul>
              <p className="mt-6 text-sm">Mitra menyortir: lembar yang sisi belakangnya bersih masuk stok Eco-Paper, sisanya (sobek, basah, penuh dua sisi) dicacah dan didaur ulang.</p>
            </div>
            <div className="relative bg-kertas-terang p-8">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-[26px] font-semibold">Berisi data pribadi</h3>
                <span className="font-mono text-xs text-revisi">→ DICACAH SELURUHNYA</span>
              </div>
              <ul className="mt-4 space-y-0 leading-8 text-tinta-abu">
                <li>KRS, KHS, transkrip, slip UKT</li>
                <li>Fotokopi KTP / KTM, formulir beasiswa</li>
                <li>Lembar pengesahan bertanda tangan</li>
              </ul>
              <p className="mt-6 text-sm">Tandai bundel sebagai <strong>rahasia</strong> saat mengajukan jemput. Sistem menolak setiap upaya memasukkan satu lembar pun dari bundel ini ke stok Eco-Paper.</p>
              <div className="pointer-events-none absolute -bottom-6 right-6">
                <Stempel atas="data pribadi" tengah="DICACAH" bawah="tidak dipakai ulang" ukuran={110} miring={-8} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— DAMPAK ——— */}
      <section id="dampak" className="scroll-mt-20 border-b border-tinta/10 bg-tinta text-kertas">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-kraft">§ 05 — Dampak, dihitung terbuka</div>
              <h2 className="max-w-2xl text-[38px] font-semibold leading-[1.02] sm:text-[48px]">Yang tidak sampai ke TPA Air Sebakul.</h2>
            </div>
            <p className="max-w-sm text-sm text-kertas/60">Angka berasal dari hasil sortir mitra (bukan perkiraan pengguna). 1 lembar A4 80 gsm ≈ {ringkas?.gramPerLembar ?? 5} gram; 1 pohon ≈ {angka(ringkas?.lembarPerPohon ?? 8333)} lembar.</p>
          </div>
          <div className="mt-12 grid gap-px bg-kertas/15 sm:grid-cols-2 lg:grid-cols-4">
            <AngkaGelap label="Lembar diselamatkan" nilai={angka(lembarSelamat)} />
            <AngkaGelap label="Kertas tidak ke TPA" nilai={angka1((lembarSelamat * (ringkas?.gramPerLembar ?? 5)) / 1000)} satuan="kg" />
            <AngkaGelap label="Lembar Eco-Paper dicetak" nilai={angka(ringkas?.lembarEco ?? 0)} />
            <AngkaGelap label="Estimasi pohon terselamatkan" nilai={angka1((ringkas?.lembarEco ?? 0) / (ringkas?.lembarPerPohon ?? 8333))} satuan="pohon" aksen />
          </div>
          <div className="mt-6 font-mono text-[12px] text-kertas/50">
            {ringkas ? `${angka(ringkas.mahasiswa)} mahasiswa · ${angka(ringkas.mitra)} mitra percetakan terdaftar` : 'Memuat angka terbaru…'}
          </div>
        </div>
      </section>

      {/* ——— AJAKAN ——— */}
      <section className="bergaris">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 py-20 sm:px-6 md:flex-row md:items-center md:justify-between">
          <h2 className="max-w-2xl text-[36px] font-semibold leading-[1.05] sm:text-[44px]">
            Ada tumpukan draf di kolong kasur kos? <span className="text-revisi">Setor sekarang.</span>
          </h2>
          <div className="flex flex-wrap gap-4">
            <TombolTautan to={user ? keJemput : '/daftar'} varian="revisi" ukuran="lg">
              {user ? 'Ajukan jemput' : 'Buat akun mahasiswa'}
            </TombolTautan>
            <TombolTautan to="/masuk" varian="garis" ukuran="lg">
              Coba akun demo
            </TombolTautan>
          </div>
        </div>
      </section>
    </>
  );
}

const LANGKAH = [
  { huruf: 'a', tag: 'cetak', judul: 'Pesan cetak, pilih kertasnya', isi: 'Unggah PDF, jumlah halaman terbaca otomatis. Pilih Kertas Baru atau Eco-Paper, harga langsung muncul.' },
  { huruf: 'b', tag: 'jemput', judul: 'Ajukan jemput dari kos', isi: 'Perkirakan jumlah lembar, pilih slot jadwal. Kurir datang membawa label QR untuk bundelmu.' },
  { huruf: 'c', tag: 'sortir', judul: 'Data pribadi dicacah', isi: 'Bundel bertanda rahasia tidak dipakai ulang. Mitra mencacahnya lalu menyerahkan ke pendaur ulang.' },
  { huruf: 'd', tag: 'poin', judul: 'Setoran jadi poin', isi: 'Setiap lembar yang tersortir masuk dompet poin, bisa dipakai memotong biaya cetak berikutnya.' },
  { huruf: 'e', tag: 'dampak', judul: 'Dampaknya terbuka', isi: 'Lembar, kilogram, dan estimasi pohon dihitung dari hasil sortir — bisa dicek siapa saja.' },
];

function Kolom({ judul, warna, children }: { judul: string; warna: string; children: ReactNode }) {
  return (
    <div>
      <div className={`label-mono mb-2 ${warna}`}>{judul}</div>
      <ul className="space-y-1.5 text-[15px] [&>li]:border-b [&>li]:border-tinta/10 [&>li]:pb-1.5">{children}</ul>
    </div>
  );
}

function AngkaGelap({ label, nilai, satuan, aksen }: { label: string; nilai: string; satuan?: string; aksen?: boolean }) {
  return (
    <div className="bg-tinta p-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-kertas/50">{label}</div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className={`font-serif text-[52px] font-semibold leading-none tracking-rapat tabular-nums ${aksen ? 'text-revisi' : ''}`}>{nilai}</span>
        {satuan && <span className="font-mono text-sm text-kertas/60">{satuan}</span>}
      </div>
    </div>
  );
}
