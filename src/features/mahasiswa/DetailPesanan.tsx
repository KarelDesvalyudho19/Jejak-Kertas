import { Link, useParams } from 'react-router-dom';
import { repo } from '@/data';
import { Ikon } from '@/components/layout/Ikon';
import { Button } from '@/components/ui/Button';
import { JudulHalaman, Kertas, Kosong } from '@/components/ui/Paper';
import { BadgePesanan } from '@/components/ui/StatusBadge';
import { BarisStruk, PemisahStruk, Struk } from '@/components/ui/Struk';
import { Timeline } from '@/components/ui/Timeline';
import { useApp, useData, useLookup } from '@/context/AppContext';
import { ALUR_PESANAN, JENIS_KERTAS_LABEL, JILID_LABEL, STATUS_PESANAN, WARNA_LABEL } from '@/lib/constants';
import { angka, idPendek, rupiah, tanggalJam } from '@/lib/format';
import type { Mitra } from '@/lib/types';

const KET: Record<string, string> = {
  DIAJUKAN: 'Menunggu mitra menerima',
  DIPROSES: 'Sedang dicetak',
  SIAP_DIAMBIL: 'Ambil & bayar di mitra',
  SELESAI: 'Sudah diambil',
};

export default function DetailPesanan() {
  const { id } = useParams();
  const { data } = useData();
  const { aksi } = useApp();
  const { dok, users } = useLookup();
  const p = data.pesanan.find((x) => x.id === id);
  if (!p) return <Kosong judul="Pesanan tidak ditemukan" aksi={<Link className="tautan" to="/mhs/lacak">Kembali</Link>} />;
  const d = dok.get(p.dokumenId);
  const m = users.get(p.mitraId) as Mitra | undefined;
  const batal = p.status === 'DIBATALKAN';
  const idx = batal ? 0 : ALUR_PESANAN.indexOf(p.status);
  const lembar = (d?.jumlahHalaman ?? 0) * p.salinan;

  async function unduh() {
    const url = await repo.urlDokumen(p!.dokumenId).catch(() => null);
    if (url) window.open(url, '_blank', 'noopener');
  }

  return (
    <>
      <Link to="/mhs/lacak" className="tautan mb-4 inline-block font-mono text-[12px]">← semua pesanan</Link>
      <JudulHalaman
        nomor={`Pesanan #${idPendek(p.id.replace(/^pc-/, ''))}`}
        judul={<span className="break-words">{d?.namaFile ?? 'Dokumen'}</span>}
        deskripsi={`Dipesan ${tanggalJam(p.createdAt)} · ${m?.namaUsaha ?? ''}`}
        aksi={<BadgePesanan status={p.status} className="text-[12px]" />}
      />

      <Kertas className="mb-6 p-5">
        <Timeline langkah={ALUR_PESANAN.map((s) => ({ kunci: s, label: STATUS_PESANAN[s].label, ket: KET[s] }))} aktif={idx} batal={batal} />
        {batal && <p className="mt-4 border-l-2 border-revisi pl-3 text-sm text-tinta-abu">Pesanan dibatalkan. Poin yang dipakai sudah dikembalikan ke dompet.</p>}
      </Kertas>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Kertas className="p-5">
            <div className="label-mono mb-3">Spesifikasi</div>
            <dl className="grid grid-cols-2 gap-x-6 leading-8 sm:grid-cols-[auto_1fr]">
              <dt className="text-tinta-abu">Kertas</dt><dd>{JENIS_KERTAS_LABEL[p.jenisKertas]}</dd>
              <dt className="text-tinta-abu">Warna</dt><dd>{WARNA_LABEL[p.warna]}</dd>
              <dt className="text-tinta-abu">Jilid</dt><dd>{JILID_LABEL[p.jilid]}</dd>
              <dt className="text-tinta-abu">Halaman × salinan</dt><dd className="font-mono">{d?.jumlahHalaman} × {p.salinan} = {angka(lembar)} lbr</dd>
            </dl>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button varian="garis" ukuran="sm" ikon={<Ikon nama="unduh" className="h-4 w-4" />} onClick={unduh}>Lihat PDF</Button>
              {p.status === 'DIAJUKAN' && (
                <Button
                  varian="hantu"
                  ukuran="sm"
                  className="text-revisi"
                  onClick={() => confirm('Batalkan pesanan ini? Poin akan dikembalikan.') && aksi(() => repo.ubahStatusPesanan(p.id, 'DIBATALKAN'), 'Pesanan dibatalkan, poin dikembalikan.')}
                >
                  Batalkan pesanan
                </Button>
              )}
            </div>
          </Kertas>
          {m && (
            <Kertas className="p-5">
              <div className="label-mono mb-2">Ambil di</div>
              <div className="font-serif text-xl font-semibold">{m.namaUsaha}</div>
              <div className="text-sm text-tinta-abu">{m.alamat}</div>
              <a className="tautan mt-2 inline-block text-sm" href={`https://www.openstreetmap.org/?mlat=${m.lat}&mlon=${m.lng}#map=18/${m.lat}/${m.lng}`} target="_blank" rel="noreferrer">
                Buka di peta ↗
              </a>
            </Kertas>
          )}
        </div>
        <Struk judul="Rincian bayar" sub="bayar di tempat">
          <BarisStruk kiri={`${angka(lembar)} lembar`} kanan="" />
          <BarisStruk kiri="Subtotal" kanan={rupiah(p.totalHarga + p.poinDipakai * data.pengaturan.nilaiPoinRupiah)} />
          {p.poinDipakai > 0 && <BarisStruk kiri={`Poin −${angka(p.poinDipakai)}`} kanan={`−${rupiah(p.poinDipakai * data.pengaturan.nilaiPoinRupiah)}`} merah />}
          <PemisahStruk />
          <BarisStruk kiri="TOTAL" kanan={rupiah(p.totalHarga)} tebal />
          <div className="mt-4 text-center text-[11px] text-tinta-abu">Tunjukkan nomor #{idPendek(p.id.replace(/^pc-/, ''))} ke mitra</div>
        </Struk>
      </div>
    </>
  );
}
