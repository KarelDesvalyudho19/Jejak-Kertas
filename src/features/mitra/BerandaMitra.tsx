import { Link } from 'react-router-dom';
import { Ikon } from '@/components/layout/Ikon';
import { TombolTautan } from '@/components/ui/Button';
import { Angka, JudulHalaman, Kertas, Kosong, SubJudul } from '@/components/ui/Paper';
import { Stempel } from '@/components/ui/Stempel';
import { useData, useLookup } from '@/context/AppContext';
import { angka, cn, hariIni } from '@/lib/format';
import type { Mitra } from '@/lib/types';
import { BarisPesanan } from '../shared/Baris';

export default function BerandaMitra() {
  const { data, user } = useData();
  const me = user as Mitra;
  const { stok } = useLookup();

  const pesanan = data.pesanan.filter((p) => p.mitraId === me.id);
  const aktif = pesanan.filter((p) => ['DIAJUKAN', 'DIPROSES', 'SIAP_DIAMBIL'].includes(p.status)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const baru = aktif.filter((p) => p.status === 'DIAJUKAN').length;
  const omzet = pesanan.filter((p) => hariIni(p.createdAt) && p.status !== 'DIBATALKAN').reduce((s, p) => s + p.totalHarga, 0);

  const bundel = data.bundel.filter((b) => b.mitraId === me.id);
  const belumSortir = bundel.filter((b) => !b.tanggalSortir).length;
  const dalamPerjalanan = data.jemput.filter((j) => j.status === 'DIJEMPUT' && !bundel.some((b) => b.permintaanJemputId === j.id)).length;
  const layak = bundel.reduce((s, b) => s + (b.tanggalSortir ? b.lembarLayak : 0), 0);
  const dicacah = bundel.reduce((s, b) => s + (b.tanggalSortir ? b.lembarDicacah : 0), 0);
  const sisaStok = stok.get(me.id) ?? 0;

  return (
    <>
      <JudulHalaman
        nomor="00 — Meja kerja"
        judul={<>Halo, {me.namaUsaha}.</>}
        deskripsi={
          baru > 0
            ? `${baru} pesanan cetak baru menunggu diterima.`
            : dalamPerjalanan > 0
              ? `${dalamPerjalanan} bundel kertas sedang dibawa kurir ke tempatmu.`
              : 'Tidak ada yang mendesak. Antrean dan bundel sedang rapi.'
        }
        aksi={
          <>
            <TombolTautan to="/mitra/antrean" varian="revisi">Antrean cetak</TombolTautan>
            <TombolTautan to="/mitra/bundel" varian="garis">Terima bundel</TombolTautan>
          </>
        }
      />

      {/* Ringkasan */}
      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Angka label="Stok Eco-Paper" nilai={angka(sisaStok)} satuan="lbr" aksen />
        <Angka label="Pesanan berjalan" nilai={angka(aktif.length)} catatan={baru ? `${baru} menunggu diterima` : 'cetak'} />
        <Angka label="Bundel perlu sortir" nilai={angka(belumSortir)} catatan={`${angka(dalamPerjalanan)} dalam perjalanan`} />
        <Angka label="Omzet hari ini" nilai={angka(Math.round(omzet / 1000))} satuan="rb" catatan={`${angka(pesanan.filter((p) => hariIni(p.createdAt) && p.status !== 'DIBATALKAN').length)} pesanan masuk`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        {/* Stok */}
        <Link to="/mitra/stok" className="group">
          <Kertas className="h-full overflow-hidden p-5 transition-transform group-hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div className="label-mono">Stok Eco-Paper</div>
              <Ikon nama="panah" className="h-4 w-4 text-tinta-abu transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className={cn('font-serif text-[52px] font-semibold leading-none tracking-rapat tabular-nums', sisaStok < 200 && 'text-revisi')}>{angka(sisaStok)}</span>
              <span className="font-mono text-sm text-tinta-abu">lembar</span>
            </div>
            <div className="mt-2 text-sm text-tinta-abu">
              {sisaStok < 200 ? 'Stok menipis, pesanan Eco-Paper bisa ditolak.' : 'siap dipakai untuk pesanan Eco-Paper berikutnya'}
            </div>
            <div className="garis-putus mt-6" />
            <div className="mt-3 font-mono text-[11px] text-tinta-abu">bertambah saat bundel aman disalurkan · berkurang saat pesanan Eco masuk</div>
          </Kertas>
        </Link>

        {/* Kartu sortir */}
        <Kertas className="relative p-5 pt-7 sm:pr-36">
          <span className="selotip absolute -top-3 left-8 h-6 w-16 -rotate-2" aria-hidden />
          <div className="label-mono">Kartu sortir</div>
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
            <Mini label="Layak Eco" nilai={angka(layak)} satuan="lbr" />
            <Mini label="Dicacah" nilai={angka(dicacah)} satuan="lbr" />
            <Mini label="Bundel disortir" nilai={angka(bundel.filter((b) => b.tanggalSortir).length)} satuan="kali" />
          </div>
          <p className="mt-6 max-w-md text-[13px] text-tinta-abu">
            {layak + dicacah > 0 ? 'Bundel rahasia selalu dicacah seluruhnya; sisanya yang bersih masuk stok.' : 'Hasil sortir pertamamu akan tercatat di sini.'}
          </p>
          <div className="pointer-events-none absolute bottom-4 right-4 hidden sm:block">
            <Stempel atas="jejak kertas" tengah={angka(layak + dicacah)} bawah="lembar disortir" ukuran={104} miring={-10} />
          </div>
        </Kertas>
      </div>

      <section className="mt-8">
        <SubJudul kanan={<Link to="/mitra/antrean" className="tautan text-sm">Semua</Link>}>Antrean cetak berjalan</SubJudul>
        {aktif.length ? (
          <Kertas>{aktif.slice(0, 5).map((p) => <BarisPesanan key={p.id} p={p} ke="/mitra/antrean" untukMitra />)}</Kertas>
        ) : (
          <Kosong judul="Antrean kosong" isi="Pesanan baru dari mahasiswa akan muncul di sini." />
        )}
      </section>
    </>
  );
}

function Mini({ label, nilai, satuan }: { label: string; nilai: string; satuan?: string }) {
  return (
    <div>
      <div className="label-mono text-[10px]">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-serif text-[30px] font-semibold leading-none tracking-rapat tabular-nums">{nilai}</span>
        {satuan && <span className="font-mono text-[11px] text-tinta-abu">{satuan}</span>}
      </div>
    </div>
  );
}
