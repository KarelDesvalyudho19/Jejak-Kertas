import { useMemo } from 'react';
import { JudulHalaman, Kosong } from '@/components/ui/Paper';
import { useData } from '@/context/AppContext';
import { angka, rupiah, tanggal } from '@/lib/format';
import type { Mahasiswa } from '@/lib/types';

/** Riwayat poin bergaya buku tabungan: kolom Masuk / Keluar / Saldo berjalan. */
export default function DompetPoin() {
  const { data, user } = useData();
  const me = user as Mahasiswa;

  const baris = useMemo(() => {
    const tx = data.transaksi.filter((t) => t.mahasiswaId === me.id).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    let saldo = 0;
    return tx.map((t) => {
      saldo += t.jenis === 'MASUK' ? t.jumlah : -t.jumlah;
      return { ...t, saldo };
    });
  }, [data.transaksi, me.id]);

  const masuk = baris.filter((b) => b.jenis === 'MASUK').reduce((s, b) => s + b.jumlah, 0);
  const keluar = baris.filter((b) => b.jenis === 'KELUAR').reduce((s, b) => s + b.jumlah, 0);
  const terbaru = [...baris].reverse();

  return (
    <>
      <JudulHalaman nomor="04 — Dompet poin" judul="Buku poin." deskripsi="Setiap lembar yang tersortir menambah saldo; setiap potongan cetak mengurangi. Semua tercatat seperti buku tabungan." />

      <div className="mb-8 grid gap-px border border-tinta/15 bg-tinta/15 sm:grid-cols-3">
        <div className="bg-kertas-terang p-5">
          <div className="label-mono">Saldo sekarang</div>
          <div className="mt-2 font-serif text-[48px] font-semibold leading-none tracking-rapat tabular-nums">{angka(me.saldoPoin)}</div>
          <div className="mt-1 font-mono text-[12px] text-tinta-abu">≈ {rupiah(me.saldoPoin * data.pengaturan.nilaiPoinRupiah)} potongan</div>
        </div>
        <div className="bg-kertas-terang p-5">
          <div className="label-mono">Total masuk</div>
          <div className="mt-2 font-serif text-[36px] font-semibold leading-none text-sukses tabular-nums">+{angka(masuk)}</div>
        </div>
        <div className="bg-kertas-terang p-5">
          <div className="label-mono">Total dipakai</div>
          <div className="mt-2 font-serif text-[36px] font-semibold leading-none text-revisi tabular-nums">−{angka(keluar)}</div>
        </div>
      </div>

      {baris.length === 0 ? (
        <Kosong judul="Buku masih kosong" isi="Transaksi pertama muncul setelah setoran disortir atau saat kamu memakai poin." />
      ) : (
        <div className="kartu overflow-hidden">
          <div className="flex items-baseline justify-between border-b-2 border-double border-tinta/40 px-5 py-4">
            <div>
              <div className="font-serif text-xl font-semibold">Buku Poin JejakKertas</div>
              <div className="font-mono text-[11px] text-tinta-abu">
                Pemilik: {me.nama} · NPM {me.npm}
              </div>
            </div>
            <div className="hidden font-mono text-[11px] text-tinta-abu sm:block">{baris.length} transaksi</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse font-mono text-[12.5px]">
              <thead>
                <tr className="border-b border-tinta/30 text-left text-[10.5px] uppercase tracking-[0.12em] text-tinta-abu">
                  <th className="w-10 px-3 py-2 font-medium">No</th>
                  <th className="w-28 px-3 py-2 font-medium">Tanggal</th>
                  <th className="px-3 py-2 font-medium">Keterangan</th>
                  <th className="w-24 px-3 py-2 text-right font-medium">Masuk</th>
                  <th className="w-24 px-3 py-2 text-right font-medium">Keluar</th>
                  <th className="w-24 border-l border-revisi/40 px-3 py-2 text-right font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {terbaru.map((b, i) => (
                  <tr key={b.id} className="h-9 border-b border-tinta/[0.08] odd:bg-kertas/40">
                    <td className="px-3 text-tinta-pudar">{String(baris.length - i).padStart(3, '0')}</td>
                    <td className="px-3 text-tinta-abu">{tanggal(b.tanggal, { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                    <td className="max-w-[320px] truncate px-3 font-sans text-[13px]" title={b.keterangan}>{b.keterangan}</td>
                    <td className="px-3 text-right text-sukses">{b.jenis === 'MASUK' ? angka(b.jumlah) : ''}</td>
                    <td className="px-3 text-right text-revisi">{b.jenis === 'KELUAR' ? angka(b.jumlah) : ''}</td>
                    <td className="border-l border-revisi/40 px-3 text-right font-semibold">{angka(b.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
