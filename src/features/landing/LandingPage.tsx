import { motion } from 'framer-motion';
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { repo } from '@/data';
import type { RingkasanPublik } from '@/data/repo';
import { TombolTautan } from '@/components/ui/Button';
import { Coret, GarisBawah, Lingkari } from '@/components/ui/Coretan';
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

const lebarBaris = (n: number, mulai = 0) => Array.from({ length: n }, (_, k) => 62 + (((k + mulai) * 37) % 34));

/** Ilustrasi hero untuk layar kecil: draf lama (belakang) dan sisi kosongnya yang dicetak Eco-Paper (depan). Hanya separuh atas yang tampak. */
function KertasHero() {
  return (
    <div className="relative mx-auto h-[190px] w-full max-w-sm overflow-hidden [mask-image:linear-gradient(to_bottom,black_65%,transparent)]" aria-hidden>
      <div className="absolute left-[8%] top-6 h-[320px] w-[54%] -rotate-6 border border-tinta/15 bg-kertas-terang shadow-kertas">
        <div className="space-y-2 p-5">
          <div className="mb-3 h-2.5 w-1/2 bg-tinta/60" />
          {lebarBaris(9).map((w, k) => (
            <div key={k} className="h-1.5 bg-tinta/20" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="absolute left-4 top-[88px] h-[2px] w-[70%] -rotate-1 rounded-full bg-revisi" />
        <span className="absolute left-6 top-[96px] rotate-[-6deg] font-serif text-[15px] italic text-revisi">revisi lagi</span>
      </div>
      <div className="absolute right-[8%] top-10 h-[320px] w-[54%] rotate-3 border border-tinta/15 bg-kertas-terang shadow-kertas">
        <div className="space-y-2 p-5">
          <div className="label-mono mb-3 text-[9px]">Draf</div>
          {lebarBaris(8, 3).map((w, k) => (
            <div key={k} className={k % 4 === 0 ? 'h-2 bg-tinta/70' : 'h-1.5 bg-tinta/40'} style={{ width: `${k % 4 === 0 ? 48 : w}%` }} />
          ))}
        </div>
        <span className="absolute right-3 top-4 border border-sukses/70 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-sukses">ECO-PAPER</span>
      </div>
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
    // tunggu font termuat agar teks di tekstur kanvas 3D memakai Spectral
    // 3D hanya di layar lebar; layar kecil memakai KertasHero, jadi chunk three.js tidak diunduh.
    const ok = window.matchMedia('(min-width: 1024px)').matches && webglTersedia();
    if (!ok) return;
    (document.fonts?.ready ?? Promise.resolve()).then(() => setSiap3D(true));
  }, []);

  const keCetak = user ? (user.role === 'MAHASISWA' ? '/mhs/cetak' : berandaPeran(user.role)) : '/masuk';
  const keJemput = user ? (user.role === 'MAHASISWA' ? '/mhs/jemput' : berandaPeran(user.role)) : '/masuk';

  const tarif = ringkas?.tarif ?? [];
  const hargaEco = cariTarif(tarif, 'ECO', 'HITAM_PUTIH') || 250;
  const hargaBaru = cariTarif(tarif, 'BARU', 'HITAM_PUTIH') || 500;
  const lembarSelamat = ringkas ? ringkas.lembarLayak + ringkas.lembarDicacah : 0;
  const nilaiPoin = ringkas?.nilaiPoinRupiah ?? 10;
  const totalBaru = 30 * hargaBaru + 500;
  const totalEco = 30 * hargaEco + 500 - 100 * nilaiPoin;

  return (
    <>
      {/* ——— HERO ——— */}
      <section className="relative overflow-hidden border-b border-tinta/10">
        <div className="grid-milimeter pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-4 px-4 pb-16 pt-4 sm:gap-6 sm:px-6 sm:pt-10 lg:grid-cols-[1.08fr_1fr] lg:pb-24 lg:pt-16">
          <motion.div initial="hidden" animate="show">
            <motion.div variants={muncul} custom={0} className="mb-7 hidden -rotate-1 drop-shadow-[0_2px_3px_rgba(22,21,19,0.18)] lg:inline-block">
              <p className="sudut-lipat bg-[#FEFEFC] py-1.5 pl-4 pr-8 text-[14px] text-tinta">Untuk mahasiswa sekitar Universitas Bengkulu</p>
            </motion.div>
            <motion.h1 variants={muncul} custom={1} className="text-[46px] font-medium leading-[0.98] sm:text-[64px] lg:text-[78px]">
              Revisi boleh berkali-kali.
              <br />
              Kertasnya jangan <Coret tunda={0.9}>dibuang</Coret>
              <span className="text-revisi">.</span>
            </motion.h1>
            <motion.p variants={muncul} custom={2} className="mt-7 max-w-lg text-[17px] leading-relaxed text-tinta-abu">
              Cetak draf di sisi kosong kertas bekas. Lembar revisi lamamu kami jemput dari kos.
            </motion.p>
            <motion.div variants={muncul} custom={3} className="mt-9 flex flex-wrap items-center gap-5">
              <TombolTautan to={keCetak} varian="lipat" ukuran="lg">
                Pesan cetak draf
              </TombolTautan>
              <TombolTautan to={keJemput} varian="tumpuk" ukuran="lg">
                Jadwalkan jemput kertas
              </TombolTautan>
            </motion.div>
          </motion.div>

          {/* Mobile: label → ilustrasi → teks hero. Di lg label kembali ke atas judul. */}
          <motion.div initial="hidden" animate="show" variants={muncul} custom={0} className="order-first lg:hidden">
            <div className="inline-block -rotate-1 drop-shadow-[0_2px_3px_rgba(22,21,19,0.18)]">
              <p className="sudut-lipat bg-[#FEFEFC] py-1.5 pl-4 pr-8 text-[14px] text-tinta">Untuk mahasiswa sekitar Universitas Bengkulu</p>
            </div>
          </motion.div>
          <motion.div initial="hidden" animate="show" variants={muncul} custom={1} className="order-first lg:hidden">
            <KertasHero />
          </motion.div>
          <div className="relative hidden lg:block lg:h-[560px]">
            {siap3D ? (
              <Suspense fallback={<IlustrasiCadangan />}>
                <MejaRevisi />
              </Suspense>
            ) : (
              <IlustrasiCadangan />
            )}
            <div className="pointer-events-none absolute bottom-6 right-8">
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
              <LabelBagian nomor={1}>Latar belakang</LabelBagian>
              <h2 className="text-[38px] font-semibold leading-[1.1] sm:text-[48px]">
                Draf dicetak berkali-kali, sisi belakangnya <Lingkari className="px-2">terbuang</Lingkari>.
              </h2>
              <p className="mt-8 max-w-md leading-relaxed text-tinta-abu">
                Laporan praktikum dan skripsi dicetak ulang setiap kali direvisi, biasanya hanya satu sisi. Lembar lama dibuang padahal sisi sebaliknya masih kosong. JejakKertas-Zero menjemput lembar itu dari kos, menyortirnya, lalu memakainya lagi untuk cetak draf berikutnya.
              </p>
            </div>
            <ol className="space-y-6">
              {[
                ['Revisi ketiga, keempat, kelima.', 'Laporan praktikum dan draf skripsi dicetak ulang setiap kali bimbingan. Lembar versi lama langsung dianggap sampah.'],
                ['Sisi belakangnya masih putih.', 'Hampir semua draf dicetak satu sisi. Artinya separuh dari kertas yang dibuang itu belum pernah dipakai sama sekali.'],
                ['TPA Air Sebakul sudah melebihi kapasitas.', 'Sampah Kota Bengkulu bermuara di sana. Kertas yang sebenarnya masih berguna ikut menumpuk bersama sampah lain.'],
              ].map(([j, isi], i) => (
                <motion.li
                  key={j}
                  className="lembar-buku py-8 pl-16 pr-6"
                  style={{ rotate: `${[-0.6, 0.4, -0.3][i]}deg` }}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                >
                  <span className="absolute left-0 w-11 text-center font-serif text-[20px] italic leading-8 text-revisi">{i + 1}.</span>
                  <h3 className="font-serif text-[22px] font-semibold leading-8">{j}</h3>
                  <p className="max-w-xl leading-8 text-tinta-abu">{isi}</p>
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
              <LabelBagian nomor={2}>Cara kerja</LabelBagian>
              <h2 className="max-w-2xl text-[38px] font-semibold leading-[1.02] sm:text-[48px]">
                Lima langkah, dari <GarisBawah>meja kos</GarisBawah> kembali ke meja kos.
              </h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {LANGKAH.map((l, i) => (
              // Pembungkus luar hanya untuk animasi muncul; hover ada di kartu dalam agar masuk dan keluar sama cepat.
              <motion.div
                key={l.huruf}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.07, duration: 0.45 }}
              >
              <motion.article
                className={`kartu group relative flex h-full flex-col ${i === 0 ? 'px-5 pb-3' : 'p-5'} ${GAYA_LANGKAH[i].kertas}`}
                style={{ rotate: `${[-0.8, 0.6, -0.4, 0.9, -0.6][i]}deg` }}
                whileHover={{ y: -6, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              >
                {GAYA_LANGKAH[i].selotip.map((c) => (
                  <span key={c} className={`selotip absolute h-6 w-16 ${c}`} aria-hidden />
                ))}
                <div className={`flex justify-between ${i === 0 ? 'h-16 items-center' : 'items-baseline'}`}>
                  <span className="font-serif text-[44px] font-semibold italic leading-none text-revisi">{l.huruf}</span>
                  <span className="label-mono">{l.tag}</span>
                </div>
                <h3 className={`font-serif text-[21px] font-semibold ${i === 0 ? 'leading-8' : 'mt-5 leading-tight'}`}>{l.judul}</h3>
                <p className={`text-[14px] text-tinta-abu ${i === 0 ? 'leading-8' : 'mt-2 leading-relaxed'}`}>{l.isi}</p>
              </motion.article>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— ECO VS BARU ——— */}
      <section id="eco-paper" className="relative scroll-mt-20 overflow-hidden border-b border-tinta/10 bg-kertas-terang">
        <div className="bergaris pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <LabelBagian nomor={3}>Pilih kertas</LabelBagian>
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
          <div className="relative flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-center sm:gap-5">
            <StrukContoh
              jenis="Kertas Baru"
              kertas="Baru A4 80 gsm"
              no="JK-0411"
              jam="09:17"
              tarif={hargaBaru}
              className="sm:mt-14 sm:-rotate-2"
              catatan={[['Kertas baru terpakai', '30 lbr'], ['Sisi kosong dipakai ulang', '0 lbr']]}
            />
            <StrukContoh
              jenis="Eco-Paper"
              kertas="Eco, sisi kosong"
              no="JK-0412"
              jam="09:21"
              tarif={hargaEco}
              potongan={100 * nilaiPoin}
              aksen
              className="sm:rotate-[1.5deg]"
              catatan={[['Kertas baru terpakai', '0 lbr'], ['Sisi kosong dipakai ulang', '30 lbr'], ['Tidak ke TPA', `±${angka1((30 * (ringkas?.gramPerLembar ?? 5)) / 1000)} kg`]]}
            >
              <div className="pointer-events-none absolute bottom-[116px] right-3">
                <Stempel atas="hemat" tengah={`${Math.round((1 - totalEco / totalBaru) * 100)}%`} bawah="vs kertas baru" warna="#2F5D50" ukuran={130} miring={-9} />
              </div>
            </StrukContoh>
          </div>
        </div>
      </section>

      {/* ——— KERAHASIAAN ——— */}
      <section id="kerahasiaan" className="scroll-mt-20 border-b border-tinta/10">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <LabelBagian nomor={4}>Kerahasiaan</LabelBagian>
          <h2 className="max-w-3xl text-[38px] font-semibold leading-[1.02] sm:text-[48px]">KRS dan slip UKT-mu tidak akan jadi kertas draf orang lain.</h2>
          <div className="mt-12 grid items-start gap-10 md:grid-cols-2">
            {/* Lembar draf bekas: cetakan sisi belakang samar tembus pandang, ditahan selotip. */}
            <div className="kartu relative -rotate-[0.6deg] overflow-visible p-8">
              <span className="selotip absolute -top-3 left-10 h-6 w-20 -rotate-3" aria-hidden />
              {/* hanya di area judul–daftar; paragraf bawah dibiarkan bersih */}
              <div className="pointer-events-none absolute inset-x-8 top-20 space-y-[13px] opacity-[0.07] [mask-image:linear-gradient(to_bottom,black_60%,transparent)] [transform:scaleX(-1)]" aria-hidden>
                {Array.from({ length: 9 }).map((_, k) => (
                  <div key={k} className="h-[5px] bg-tinta" style={{ width: `${55 + ((k * 37) % 45)}%` }} />
                ))}
              </div>
              <div className="relative">
                <div className="label-mono text-sukses">→ stok eco-paper</div>
                <h3 className="mt-3 font-serif text-[28px] font-semibold leading-tight">Aman dipakai ulang</h3>
                <ul className="mt-5 space-y-2 text-tinta-abu">
                  {['Draf laporan & skripsi versi lama', 'Catatan kuliah, fotokopi modul', 'Lembar latihan soal, print-out jurnal'].map((t) => (
                    <li key={t} className="flex gap-3">
                      <span className="font-struk text-sukses">✓</span>
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-8 border-t border-dashed border-tinta/20 pt-5 text-sm leading-relaxed">Mitra menyortir: lembar yang sisi belakangnya bersih masuk stok Eco-Paper, sisanya (sobek, basah, penuh dua sisi) dicacah dan didaur ulang.</p>
              </div>
            </div>

            {/* Map arsip kraft bertab "RAHASIA": isinya tidak pernah keluar sebagai Eco-Paper. */}
            <div className="relative rotate-[0.5deg] pt-7 md:mt-8">
              <div className="absolute left-0 top-0 h-8 w-44 rounded-t-md border border-b-0 border-kraft/50 bg-kraft-muda px-4 pt-1.5 font-struk text-[11px] font-semibold uppercase tracking-[0.2em] text-revisi">
                rahasia · arsip
              </div>
              <div className="relative rounded-b-md rounded-tr-md border border-kraft/50 bg-kraft-muda p-8 shadow-kertas">
                <div className="label-mono text-revisi">→ dicacah seluruhnya</div>
                <h3 className="mt-3 font-serif text-[28px] font-semibold leading-tight">Berisi data pribadi</h3>
                <ul className="mt-5 space-y-2 text-tinta/75">
                  {['KRS, KHS, transkrip, slip UKT', 'Fotokopi KTP / KTM, formulir beasiswa', 'Lembar pengesahan bertanda tangan'].map((t) => (
                    <li key={t} className="flex gap-3">
                      <span className="font-struk text-revisi">✕</span>
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-8 border-t border-dashed border-kraft pt-5 text-sm leading-relaxed">Tandai bundel sebagai <strong>rahasia</strong> saat mengajukan jemput. Sistem menolak setiap upaya memasukkan satu lembar pun dari bundel ini ke stok Eco-Paper.</p>
                <div className="pointer-events-none absolute -bottom-7 right-6">
                  <Stempel atas="data pribadi" tengah="DICACAH" bawah="tidak dipakai ulang" ukuran={120} miring={-8} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— DAMPAK ——— */}
      <section id="dampak" className="relative scroll-mt-20 overflow-hidden border-b border-tinta/10 bg-tinta text-kertas">
        {/* garis buku tulis versi terang di atas papan gelap, memudar ke bawah */}
        <div
          className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
          style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(251,250,246,0.06) 31px, rgba(251,250,246,0.06) 32px)' }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-y-0 left-[max(1rem,calc(50%-40rem))] w-px bg-revisi/30 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-end">
            <div>
              <LabelBagian nomor={5}>Dampak</LabelBagian>
              <h2 className="max-w-2xl text-[38px] font-semibold leading-[1.02] sm:text-[52px]">
                Yang tidak sampai ke <span className="font-serif italic text-kraft">TPA Air Sebakul</span>
                <span className="text-revisi">.</span>
              </h2>
            </div>
            <div className="border-l border-kertas/15 pl-5">
              <div className="font-struk text-[11px] uppercase tracking-[0.2em] text-kraft">sumber angka</div>
              <p className="mt-2 text-[15px] leading-relaxed text-kertas/70">
                Dihitung dari hasil sortir mitra, bukan perkiraan pengguna. 1 lembar A4 80 gsm ≈ <span className="text-kertas">{ringkas?.gramPerLembar ?? 5} gram</span>; 1 pohon ≈ <span className="text-kertas">{angka(ringkas?.lembarPerPohon ?? 8333)} lembar</span>.
              </p>
            </div>
          </div>

          <div className="mt-16 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            <AngkaGelap label="Lembar diselamatkan" nilai={angka(lembarSelamat)} satuan="lbr" rumus="layak + dicacah" kertas="bg-kertas-terang" miring={-1} />
            <AngkaGelap label="Kertas tidak ke TPA" nilai={angka1((lembarSelamat * (ringkas?.gramPerLembar ?? 5)) / 1000)} satuan="kg" rumus={`lembar × ${ringkas?.gramPerLembar ?? 5} g ÷ 1.000`} kertas="bg-kraft-muda" miring={0.8} />
            <AngkaGelap label="Lembar Eco-Paper dicetak" nilai={angka(ringkas?.lembarEco ?? 0)} satuan="lbr" rumus="di sisi kosong kertas bekas" kertas="bergaris bg-kertas-terang" miring={-0.5} />
            <AngkaGelap label="Estimasi pohon terselamatkan" nilai={angka1((ringkas?.lembarEco ?? 0) / (ringkas?.lembarPerPohon ?? 8333))} satuan="pohon" rumus={`lembar eco ÷ ${angka(ringkas?.lembarPerPohon ?? 8333)}`} kertas="bg-sukses text-kertas" gelap miring={1.2} />
          </div>

          <div className="mt-14 flex flex-wrap items-center gap-3 font-struk text-[12px] text-kertas/70">
            {ringkas ? (
              <>
                <span className="rounded-full border border-kertas/15 px-3 py-1"><span className="text-kertas">{angka(ringkas.mahasiswa)}</span> mahasiswa</span>
                <span className="rounded-full border border-kertas/15 px-3 py-1"><span className="text-kertas">{angka(ringkas.mitra)}</span> mitra percetakan</span>
                <span className="text-kertas/40">terdaftar · diperbarui setiap sortir</span>
              </>
            ) : (
              <span className="text-kertas/50">Memuat angka terbaru…</span>
            )}
          </div>
        </div>
      </section>

      {/* ——— AJAKAN ——— */}
      <section className="relative overflow-hidden">
        <div className="bergaris pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
          {/* Lembar polos (tanpa garis) agar judul terbaca; hover sama dengan kartu Cara kerja. */}
          <motion.div
            className="kartu relative flex flex-col items-start gap-8 bg-[#FEFEFC] px-8 py-12 sm:px-12 md:flex-row md:items-center md:justify-between"
            style={{ rotate: '-0.6deg' }}
            whileHover={{ y: -6, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          >
          <span className="selotip absolute -top-3 left-12 h-6 w-20 -rotate-3" aria-hidden />
          <span className="selotip absolute -top-3 right-12 h-6 w-20 rotate-3" aria-hidden />
          <h2 className="max-w-2xl text-[36px] font-semibold leading-[1.05] sm:text-[44px]">
            Ada tumpukan draf di kolong kasur kos? <span className="text-revisi">Setor sekarang.</span>
          </h2>
          <div className="flex shrink-0 flex-wrap gap-4">
            <TombolTautan to={user ? keJemput : '/daftar'} varian="lipat" ukuran="lg">
              {user ? 'Ajukan jemput' : 'Buat akun mahasiswa'}
            </TombolTautan>
            <TombolTautan to="/masuk" varian="tumpuk" ukuran="lg">
              Coba akun demo
            </TombolTautan>
          </div>
          </motion.div>
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

// Kartu a (bergaris) memakai tinggi baris 32px agar teks duduk di garis. Tiap langkah pakai jenis kertas berbeda: bergaris, milimeter, kraft, kertas buram, sudut terlipat.
const GAYA_LANGKAH: { kertas: string; selotip: string[] }[] = [
  { kertas: 'bergaris', selotip: ['-top-3 left-1/2 -translate-x-1/2 -rotate-3'] },
  { kertas: 'grid-milimeter', selotip: ['-left-4 -top-2 -rotate-[38deg]'] },
  { kertas: 'bg-kraft-muda border-kraft/30', selotip: [] },
  { kertas: 'bg-kertas-gelap', selotip: ['-left-3 -top-2 w-12 -rotate-[30deg]', '-right-3 -top-2 w-12 rotate-[30deg]'] },
  { kertas: 'sudut-lipat bg-[#FEFEFC]', selotip: [] },
];

function Kolom({ judul, warna, children }: { judul: string; warna: string; children: ReactNode }) {
  return (
    <div className="lembar-buku py-8 pl-14 pr-5">
      <div className={`label-mono leading-8 ${warna}`}>{judul}</div>
      <ul className="text-[15px] leading-8">{children}</ul>
    </div>
  );
}

// Contoh struk draf 30 halaman HP + jilid staples, untuk membandingkan Kertas Baru dan Eco-Paper.
function StrukContoh({ jenis, kertas, no, jam, tarif, potongan = 0, aksen, catatan, className, children }: {
  jenis: string; kertas: string; no: string; jam: string; tarif: number; potongan?: number; aksen?: boolean;
  catatan: [string, string][]; className?: string; children?: ReactNode;
}) {
  return (
    <div className={`relative w-full max-w-[270px] ${className ?? ''}`}>
      <Struk judul="JejakKertas·Zero" sub="mitra percetakan sekitar UNIB">
        <div className="flex justify-between text-[11px] text-tinta-abu">
          <span>No. {no}</span>
          <span>19/11 {jam}</span>
        </div>
        <div className={`my-3 border-y border-tinta/80 py-1 text-center text-[12px] font-semibold uppercase tracking-[0.2em] ${aksen ? 'text-sukses' : ''}`}>{jenis}</div>
        <BarisStruk kiri="Dokumen" kanan="draf_bab3.pdf" kecil />
        <BarisStruk kiri="Kertas" kanan={kertas} kecil />
        <BarisStruk kiri="Warna" kanan="Hitam-putih" kecil />
        <PemisahStruk />
        <BarisStruk kiri="30 hlm × 1" kanan="30 lbr" />
        <BarisStruk kiri={`30 × ${rupiah(tarif)}`} kanan={rupiah(30 * tarif)} />
        <BarisStruk kiri="Jilid staples" kanan={rupiah(500)} />
        {potongan > 0 && <BarisStruk kiri="Potong 100 poin" kanan={`-${rupiah(potongan)}`} merah />}
        <PemisahStruk />
        <div className="flex items-baseline justify-between text-[15px] font-semibold">
          <span className="tracking-[0.15em]">TOTAL</span>
          <span className="tabular-nums">{rupiah(30 * tarif + 500 - potongan)}</span>
        </div>
        <div className="mt-0.5 text-right text-[10.5px] text-tinta-abu">bayar di tempat</div>
        <PemisahStruk />
        {catatan.map(([k, v]) => (
          <BarisStruk key={k} kiri={k} kanan={v} kecil />
        ))}
        <Barkode kode={no} />
        <div className="mt-2 text-center text-[10.5px] text-tinta-abu">simpan struk · draf, bukan berkas final</div>
      </Struk>
      {children}
    </div>
  );
}

// Barkode hiasan: lebar batang diturunkan dari kode agar tiap struk beda tapi stabil.
function Barkode({ kode }: { kode: string }) {
  const batang = Array.from({ length: 34 }, (_, i) => ((kode.charCodeAt(i % kode.length) * (i + 7)) % 3) + 1);
  return (
    <div className="mt-4" aria-hidden>
      <div className="flex h-9 items-stretch justify-center gap-[2px]">
        {batang.map((w, i) => (
          <span key={i} className="bg-tinta" style={{ width: w }} />
        ))}
      </div>
      <div className="mt-1 text-center text-[10px] tracking-[0.3em]">{kode}</div>
    </div>
  );
}

// Angka dampak sebagai lembar kertas yang ditempel selotip di papan gelap.
// Tiap angka di kertas berbeda (putih, kraft, bergaris, hijau) agar tidak seragam.
function AngkaGelap({ label, nilai, satuan, rumus, kertas, gelap, miring = 0 }: { label: string; nilai: string; satuan?: string; rumus: string; kertas: string; gelap?: boolean; miring?: number }) {
  const redup = gelap ? 'text-kertas/70' : 'text-tinta-abu';
  return (
    <div className={`relative border border-tinta/10 p-6 shadow-kertas ${gelap ? '' : 'text-tinta'} ${kertas}`} style={{ rotate: `${miring}deg` }}>
      <span className="selotip absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 rotate-2" aria-hidden />
      <div className={`font-struk text-[11px] uppercase tracking-[0.16em] ${redup}`}>{label}</div>
      <div className="mt-5 flex items-baseline gap-2">
        <span className="font-serif text-[56px] font-semibold leading-none tracking-rapat tabular-nums">{nilai}</span>
        {satuan && <span className={`font-serif text-[18px] italic ${redup}`}>{satuan}</span>}
      </div>
      <div className={`mt-5 border-t border-dashed pt-3 font-struk text-[11px] ${gelap ? 'border-kertas/30' : 'border-tinta/20'} ${redup}`}>= {rumus}</div>
    </div>
  );
}

// Penanda bagian: secarik kertas bersih dengan sudut terlipat; nomor ditulis tangan di dalamnya.
function LabelBagian({ nomor, children }: { nomor: number; children: ReactNode }) {
  return (
    <div className="mb-5 inline-block -rotate-1 drop-shadow-[0_2px_3px_rgba(22,21,19,0.18)]">
      <div className="sudut-lipat bg-[#FEFEFC] py-1.5 pl-4 pr-8 text-[14px] text-tinta">
        {nomor}. {children}
      </div>
    </div>
  );
}
