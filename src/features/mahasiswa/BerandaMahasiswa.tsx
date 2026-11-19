import { Link } from 'react-router-dom';
import { Ikon } from '@/components/layout/Ikon';
import { TombolTautan } from '@/components/ui/Button';
import { JudulHalaman, Kertas, Kosong, SubJudul } from '@/components/ui/Paper';
import { Stempel } from '@/components/ui/Stempel';
import { useData, useLookup } from '@/context/AppContext';
import { angka, angka1, rupiah } from '@/lib/format';
import { hitungDampak } from '@/lib/impact';
import type { Mahasiswa } from '@/lib/types';
import { BarisJemput, BarisPesanan } from '../shared/Baris';

export default function BerandaMahasiswa() {
  const { data, user } = useData();
  const me = user as Mahasiswa;
  const { bundelByJemput } = useLookup();

  const pesananSaya = data.pesanan.filter((p) => p.mahasiswaId === me.id);
  const jemputSaya = data.jemput.filter((j) => j.mahasiswaId === me.id);
  const pesananAktif = pesananSaya.filter((p) => !['SELESAI', 'DIBATALKAN'].includes(p.status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const jemputAktif = jemputSaya.filter((j) => !['DIPAKAI_ULANG', 'DICACAH', 'DIBATALKAN'].includes(j.status)).sort((a, b) => a.jadwal.localeCompare(b.jadwal));
  const bundelSaya = jemputSaya.map((j) => bundelByJemput.get(j.id)).filter((b): b is NonNullable<typeof b> => !!b);
  const d = hitungDampak(bundelSaya, pesananSaya, data.dokumen, data.pengaturan);
  const siapAmbil = pesananAktif.filter((p) => p.status === 'SIAP_DIAMBIL').length;
  const namaDepan = me.nama.split(' ')[0];

  return (
    <>
      <JudulHalaman
        nomor="00 — Meja kerja"
        judul={<>Halo, {namaDepan}.</>}
        deskripsi={
          siapAmbil > 0
            ? `${siapAmbil} pesanan cetakmu sudah siap diambil di mitra.`
            : jemputAktif.length
              ? `Ada ${jemputAktif.length} penjemputan kertas yang sedang berjalan.`
              : 'Belum ada yang berjalan. Draf berikutnya mau dicetak di mana?'
        }
        aksi={
          <>
            <TombolTautan to="/mhs/cetak" varian="revisi">Pesan cetak</TombolTautan>
            <TombolTautan to="/mhs/jemput" varian="garis">Ajukan jemput</TombolTautan>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        {/* Dompet poin */}
        <Link to="/mhs/poin" className="group">
          <Kertas className="h-full overflow-hidden p-6 transition-transform group-hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div className="label-mono">Dompet poin</div>
              <Ikon nama="panah" className="h-4 w-4 text-tinta-abu transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="font-serif text-[64px] font-semibold leading-none tracking-rapat tabular-nums">{angka(me.saldoPoin)}</span>
              <span className="font-mono text-sm text-tinta-abu">poin</span>
            </div>
            <div className="mt-2 text-sm text-tinta-abu">
              setara potongan <span className="font-mono text-tinta">{rupiah(me.saldoPoin * data.pengaturan.nilaiPoinRupiah)}</span> untuk cetak berikutnya
            </div>
            <div className="garis-putus mt-6" />
            <div className="mt-3 font-mono text-[11px] text-tinta-abu">1 lembar tersortir = {data.pengaturan.poinPerLembar} poin · 1 poin = {rupiah(data.pengaturan.nilaiPoinRupiah)}</div>
          </Kertas>
        </Link>

        {/* Kartu dampak pribadi */}
        <Kertas bergaris className="relative overflow-hidden p-6">
          <div className="label-mono">Kartu dampak pribadi</div>
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            <Mini label="Lembar disetor" nilai={angka(d.lembarDiselamatkan)} />
            <Mini label="Tak ke TPA" nilai={angka1(d.kg)} satuan="kg" />
            <Mini label="Cetak Eco" nilai={angka(d.lembarEcoDicetak)} satuan="lbr" />
            <Mini label="Setoran" nilai={angka(bundelSaya.filter((b) => b.tanggalSortir).length)} satuan="kali" />
          </div>
          <p className="mt-6 max-w-md text-[13px] text-tinta-abu">
            {d.lembarDiselamatkan > 0
              ? `Kalau ditumpuk, kertas yang kamu setor setinggi kira-kira ${angka1(d.lembarDiselamatkan / 100)} cm.`
              : 'Setoran pertamamu akan tercatat di sini setelah mitra selesai menyortir.'}
          </p>
          <div className="pointer-events-none absolute -bottom-3 right-3 hidden sm:block">
            <Stempel atas="jejak kertas" tengah={angka(d.lembarDiselamatkan)} bawah="lembar selamat" ukuran={104} miring={-10} />
          </div>
        </Kertas>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <SubJudul kanan={<Link to="/mhs/lacak" className="tautan text-sm">Semua</Link>}>Pesanan cetak berjalan</SubJudul>
          {pesananAktif.length ? (
            <Kertas>{pesananAktif.slice(0, 5).map((p) => <BarisPesanan key={p.id} p={p} ke={`/mhs/lacak/pesanan/${p.id}`} />)}</Kertas>
          ) : (
            <Kosong judul="Tidak ada pesanan aktif" isi="Draf yang kamu pesan akan muncul di sini sampai diambil." aksi={<TombolTautan to="/mhs/cetak" ukuran="sm">Pesan cetak</TombolTautan>} />
          )}
        </section>
        <section>
          <SubJudul kanan={<Link to="/mhs/lacak?tab=jemput" className="tautan text-sm">Semua</Link>}>Penjemputan berjalan</SubJudul>
          {jemputAktif.length ? (
            <Kertas>{jemputAktif.slice(0, 5).map((j) => <BarisJemput key={j.id} j={j} ke={`/mhs/lacak/jemput/${j.id}`} />)}</Kertas>
          ) : (
            <Kosong judul="Belum ada jadwal jemput" isi="Kumpulkan draf lama di satu tempat, lalu ajukan jemput." aksi={<TombolTautan to="/mhs/jemput" ukuran="sm">Ajukan jemput</TombolTautan>} />
          )}
        </section>
      </div>
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
