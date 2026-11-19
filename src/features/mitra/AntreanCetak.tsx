import { useMemo, useState } from 'react';
import { repo } from '@/data';
import { Ikon } from '@/components/layout/Ikon';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Field';
import { Angka, JudulHalaman, Kertas, Kosong } from '@/components/ui/Paper';
import { BadgePesanan } from '@/components/ui/StatusBadge';
import { useApp, useData, useLookup } from '@/context/AppContext';
import { JENIS_KERTAS_LABEL, JILID_LABEL, STATUS_PESANAN, WARNA_LABEL } from '@/lib/constants';
import { angka, cn, hariIni, idPendek, rupiah, tanggalJam } from '@/lib/format';
import type { Mahasiswa, PesananCetak, StatusPesanan } from '@/lib/types';

const LANJUT: Partial<Record<StatusPesanan, { ke: StatusPesanan; label: string }>> = {
  DIAJUKAN: { ke: 'DIPROSES', label: 'Terima & proses' },
  DIPROSES: { ke: 'SIAP_DIAMBIL', label: 'Tandai siap diambil' },
  SIAP_DIAMBIL: { ke: 'SELESAI', label: 'Sudah diambil' },
};

type Saring = StatusPesanan | 'AKTIF';

export default function AntreanCetak() {
  const { data, user } = useData();
  const { aksi } = useApp();
  const { dok, users, stok } = useLookup();
  const [saring, setSaring] = useState<Saring>('AKTIF');
  const [sibuk, setSibuk] = useState<string | null>(null);

  const milik = useMemo(() => data.pesanan.filter((p) => p.mitraId === user.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [data.pesanan, user.id]);
  const hitung = (s: StatusPesanan) => milik.filter((p) => p.status === s).length;
  const aktif = milik.filter((p) => ['DIAJUKAN', 'DIPROSES', 'SIAP_DIAMBIL'].includes(p.status));
  const daftar = saring === 'AKTIF' ? aktif : milik.filter((p) => p.status === saring).reverse();
  const omzetHariIni = milik.filter((p) => hariIni(p.createdAt) && p.status !== 'DIBATALKAN').reduce((s, p) => s + p.totalHarga, 0);
  const lembarEcoAntre = aktif.filter((p) => p.jenisKertas === 'ECO').reduce((s, p) => s + (dok.get(p.dokumenId)?.jumlahHalaman ?? 0) * p.salinan, 0);

  async function ubah(p: PesananCetak, ke: StatusPesanan, pesan: string) {
    setSibuk(p.id);
    await aksi(() => repo.ubahStatusPesanan(p.id, ke), pesan);
    setSibuk(null);
  }
  async function unduh(p: PesananCetak) {
    try {
      const url = await repo.urlDokumen(p.dokumenId);
      const a = document.createElement('a');
      a.href = url;
      a.download = dok.get(p.dokumenId)?.namaFile ?? 'dokumen.pdf';
      a.target = '_blank';
      a.click();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <>
      <JudulHalaman nomor="01 — Antrean cetak" judul="Pesanan masuk." deskripsi="Urut dari yang paling lama menunggu. Unduh PDF, cetak, lalu geser statusnya." />

      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Angka label="Menunggu diterima" nilai={hitung('DIAJUKAN')} aksen={hitung('DIAJUKAN') > 0} />
        <Angka label="Sedang dicetak" nilai={hitung('DIPROSES')} />
        <Angka label="Siap diambil" nilai={hitung('SIAP_DIAMBIL')} />
        <Angka label="Omzet hari ini" nilai={angka(Math.round(omzetHariIni / 1000))} satuan="rb" catatan={`Eco dalam antrean: ${angka(lembarEcoAntre)} lbr · stok ${angka(stok.get(user.id) ?? 0)}`} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Chip aktif={saring === 'AKTIF'} onClick={() => setSaring('AKTIF')} jumlah={aktif.length}>Semua aktif</Chip>
        {(['DIAJUKAN', 'DIPROSES', 'SIAP_DIAMBIL', 'SELESAI', 'DIBATALKAN'] as StatusPesanan[]).map((s) => (
          <Chip key={s} aktif={saring === s} onClick={() => setSaring(s)} jumlah={hitung(s)}>
            {STATUS_PESANAN[s].label}
          </Chip>
        ))}
      </div>

      {daftar.length === 0 ? (
        <Kosong judul="Antrean kosong" isi="Pesanan baru dari mahasiswa akan muncul di sini." />
      ) : (
        <Kertas>
          {daftar.map((p) => {
            const d = dok.get(p.dokumenId);
            const m = users.get(p.mahasiswaId) as Mahasiswa | undefined;
            const lanjut = LANJUT[p.status];
            return (
              <article key={p.id} className={cn('grid gap-4 border-b border-tinta/10 px-4 py-3.5 last:border-0 md:grid-cols-[1fr_auto] md:items-center', p.status === 'DIAJUKAN' && 'bg-revisi-muda/30')}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-[11px] text-tinta-abu">#{idPendek(p.id.replace(/^pc-/, ''))}</span>
                    <BadgePesanan status={p.status} />
                    <span className="font-mono text-[11px] text-tinta-abu">{tanggalJam(p.createdAt)}</span>
                  </div>
                  <div className="mt-2 truncate font-serif text-[19px] font-semibold">{d?.namaFile}</div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-tinta-abu">
                    <span>{m?.nama} · <span className="font-mono">{m?.npm}</span></span>
                    <span>{JENIS_KERTAS_LABEL[p.jenisKertas]}</span>
                    <span>{WARNA_LABEL[p.warna]}</span>
                    <span>{JILID_LABEL[p.jilid]}</span>
                    <span className="font-mono">{d?.jumlahHalaman} hlm × {p.salinan} = {angka((d?.jumlahHalaman ?? 0) * p.salinan)} lbr</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <span className="mr-2 font-mono text-[15px] font-semibold">{rupiah(p.totalHarga)}</span>
                  <Button varian="garis" ukuran="sm" ikon={<Ikon nama="unduh" className="h-4 w-4" />} onClick={() => unduh(p)}>
                    PDF
                  </Button>
                  {p.status === 'DIAJUKAN' && (
                    <Button varian="hantu" ukuran="sm" disabled={sibuk === p.id} onClick={() => confirm('Tolak pesanan ini? Poin mahasiswa akan dikembalikan.') && ubah(p, 'DIBATALKAN', 'Pesanan ditolak.')}>
                      Tolak
                    </Button>
                  )}
                  {lanjut && (
                    <Button varian={p.status === 'SIAP_DIAMBIL' ? 'sukses' : 'revisi'} ukuran="sm" memuat={sibuk === p.id} onClick={() => ubah(p, lanjut.ke, `Status: ${STATUS_PESANAN[lanjut.ke].label}.`)}>
                      {lanjut.label}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </Kertas>
      )}
    </>
  );
}
