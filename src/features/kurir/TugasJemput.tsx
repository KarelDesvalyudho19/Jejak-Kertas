import { useCallback, useMemo, useState } from 'react';
import { repo } from '@/data';
import { PetaRute, jarakKm, urutkanRute, type TitikRute } from '@/components/map/Peta';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Angka, JudulHalaman, Kosong } from '@/components/ui/Paper';
import { BadgeJemput } from '@/components/ui/StatusBadge';
import { useApp, useData, useLookup } from '@/context/AppContext';
import { PUSAT_UNIB } from '@/lib/constants';
import { angka, angka1, cn, hariIni } from '@/lib/format';
import { labelSlot } from '@/lib/jadwal';
import type { Mahasiswa, PermintaanJemput } from '@/lib/types';
import { PemindaiQR } from '../shared/PemindaiQR';

type Lingkup = 'hari' | 'mendatang';

export default function TugasJemput() {
  const { data, user } = useData();
  const { aksi } = useApp();
  const { users, mitra } = useLookup();
  const [lingkup, setLingkup] = useState<Lingkup>('hari');
  const [dipilih, setDipilih] = useState<string | null>(null);
  const [verifikasi, setVerifikasi] = useState<PermintaanJemput | null>(null);
  const [memuat, setMemuat] = useState(false);

  const now = new Date();
  const relevan = useMemo(
    () =>
      data.jemput.filter((j) => {
        const cocokWaktu = lingkup === 'hari' ? hariIni(j.jadwal, now) : new Date(j.jadwal) > now && !hariIni(j.jadwal, now);
        const cocokKurir = j.status === 'DIAJUKAN' || j.kurirId === user.id;
        return cocokWaktu && cocokKurir && j.status !== 'DIBATALKAN';
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.jemput, lingkup, user.id],
  );

  const mhs = (id: string) => users.get(id) as Mahasiswa | undefined;
  const tugasSaya = relevan.filter((j) => j.kurirId === user.id && j.status === 'DIPROSES');
  const terbuka = relevan.filter((j) => j.status === 'DIAJUKAN');
  const selesai = relevan.filter((j) => j.kurirId === user.id && !['DIAJUKAN', 'DIPROSES'].includes(j.status));

  // Rute: dari gerbang UNIB → kos-kos tugas saya (tetangga terdekat) → mitra terdekat dari titik terakhir
  const rute = useMemo(() => {
    const titikKos = tugasSaya
      .map((j) => ({ j, m: mhs(j.mahasiswaId) }))
      .filter((x) => x.m && x.m.lat)
      .map((x) => ({ ...x, lat: x.m!.lat, lng: x.m!.lng }));
    const urut = urutkanRute(PUSAT_UNIB, titikKos);
    const akhir: [number, number] = urut.length ? [urut[urut.length - 1].lat, urut[urut.length - 1].lng] : PUSAT_UNIB;
    const tujuan = [...mitra].sort((a, b) => jarakKm(akhir, [a.lat, a.lng]) - jarakKm(akhir, [b.lat, b.lng]))[0];
    const garis: [number, number][] = [PUSAT_UNIB, ...urut.map((u) => [u.lat, u.lng] as [number, number])];
    if (tujuan && urut.length) garis.push([tujuan.lat, tujuan.lng]);
    let km = 0;
    for (let i = 1; i < garis.length; i++) km += jarakKm(garis[i - 1], garis[i]);
    return { urut, tujuan, garis, km };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tugasSaya.map((j) => j.id).join(), mitra]);

  const titik: TitikRute[] = [
    { id: 'unib', lat: PUSAT_UNIB[0], lng: PUSAT_UNIB[1], judul: 'Titik awal: Gerbang UNIB', jenis: 'kampus' },
    ...rute.urut.map((u, i) => ({ id: u.j.id, lat: u.lat, lng: u.lng, judul: `${i + 1}. ${u.m!.nama}`, isi: `${u.m!.alamatKos} · ±${u.j.estimasiLembar} lbr`, jenis: 'tugas' as const, nomor: i + 1 })),
    ...terbuka
      .map((j) => ({ j, m: mhs(j.mahasiswaId) }))
      .filter((x) => x.m?.lat)
      .map(({ j, m }) => ({ id: j.id, lat: m!.lat, lng: m!.lng, judul: `Belum diambil: ${m!.nama}`, isi: m!.alamatKos, jenis: 'kos' as const, nomor: undefined })),
    ...mitra.map((m) => ({ id: m.id, lat: m.lat, lng: m.lng, judul: m.namaUsaha, isi: m.alamat, jenis: 'mitra' as const })),
  ];

  const konfirmasiJemput = useCallback(
    async (kode: string) => {
      if (!verifikasi) return;
      setMemuat(true);
      const ok = await aksi(() => repo.tandaiDijemput(verifikasi.id, kode), 'Bundel tercatat dijemput. Antar ke mitra.');
      setMemuat(false);
      if (ok !== null) setVerifikasi(null);
    },
    [verifikasi, aksi],
  );

  const Kartu = ({ j, nomor }: { j: PermintaanJemput; nomor?: number }) => {
    const m = mhs(j.mahasiswaId);
    return (
      <article
        id={`tugas-${j.id}`}
        onMouseEnter={() => setDipilih(j.id)}
        className={cn('kartu grid grid-cols-[auto_1fr] gap-4 p-4 transition-colors', dipilih === j.id && 'border-revisi')}
      >
        <div className={cn('grid h-9 w-9 place-items-center border font-mono text-sm', nomor ? 'border-tinta bg-revisi text-kertas-terang' : 'border-tinta/30 text-tinta-abu')}>{nomor ?? '·'}</div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-medium">{m?.nama}</div>
            <BadgeJemput status={j.status} />
          </div>
          <div className="text-[13px] text-tinta-abu">{m?.alamatKos}</div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[12px]">
            <span>{labelSlot(j.jadwal).split(', ').pop()}</span>
            <span>±{angka(j.estimasiLembar)} lbr</span>
            <span className={cn(j.kategori === 'RAHASIA' ? 'text-revisi' : 'text-tinta-abu')}>{j.kategori === 'RAHASIA' ? 'RAHASIA · jangan dibuka' : 'aman'}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {j.status === 'DIAJUKAN' && (
              <Button ukuran="sm" varian="tinta" onClick={() => aksi(() => repo.ambilTugas(j.id), 'Tugas masuk daftar jemputmu.')}>
                Ambil tugas
              </Button>
            )}
            {j.status === 'DIPROSES' && (
              <Button ukuran="sm" varian="revisi" onClick={() => setVerifikasi(j)}>
                Sudah dijemput
              </Button>
            )}
            {m?.lat ? (
              <a className="inline-flex h-8 items-center px-2 text-[13px] tautan" href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`} target="_blank" rel="noreferrer">
                Navigasi ↗
              </a>
            ) : null}
          </div>
        </div>
      </article>
    );
  };

  return (
    <>
      <JudulHalaman
        nomor="K1 — Tugas jemput"
        judul={lingkup === 'hari' ? 'Rute hari ini.' : 'Jadwal mendatang.'}
        deskripsi={now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        aksi={
          <div className="flex gap-2">
            <Chip aktif={lingkup === 'hari'} onClick={() => setLingkup('hari')}>Hari ini</Chip>
            <Chip aktif={lingkup === 'mendatang'} onClick={() => setLingkup('mendatang')}>Mendatang</Chip>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Angka label="Tugasku" nilai={tugasSaya.length} aksen={tugasSaya.length > 0} />
        <Angka label="Belum diambil" nilai={terbuka.length} />
        <Angka label="Sudah dijemput" nilai={selesai.length} />
        <Angka label="Panjang rute" nilai={angka1(rute.km)} satuan="km" catatan={rute.tujuan && rute.urut.length ? `berakhir di ${rute.tujuan.namaUsaha}` : undefined} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <PetaRute titik={titik} garis={rute.garis} className="h-[360px] lg:sticky lg:top-8 lg:h-[560px]" onPilih={(id) => { setDipilih(id); document.getElementById(`tugas-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} />
        <div className="space-y-6">
          <section>
            <div className="label-mono mb-2">Urutan jemput</div>
            {rute.urut.length === 0 ? (
              <Kosong judul="Belum ada tugas" isi="Ambil tugas dari daftar di bawah untuk menyusun rute." />
            ) : (
              <div className="space-y-3">{rute.urut.map((u, i) => <Kartu key={u.j.id} j={u.j} nomor={i + 1} />)}</div>
            )}
          </section>
          {terbuka.length > 0 && (
            <section>
              <div className="label-mono mb-2">Belum diambil kurir ({terbuka.length})</div>
              <div className="space-y-3">{terbuka.map((j) => <Kartu key={j.id} j={j} />)}</div>
            </section>
          )}
          {selesai.length > 0 && (
            <section>
              <div className="label-mono mb-2">Selesai dijemput</div>
              <div className="space-y-3 opacity-75">{selesai.map((j) => <Kartu key={j.id} j={j} />)}</div>
            </section>
          )}
        </div>
      </div>

      <Modal buka={!!verifikasi} tutup={() => setVerifikasi(null)} judul="Verifikasi label bundel">
        {verifikasi && (
          <>
            <p className="mb-4 text-sm text-tinta-abu">
              Pindai QR di bundel milik <strong className="text-tinta">{mhs(verifikasi.mahasiswaId)?.nama}</strong>, atau ketik kodenya. Status baru berubah bila kode cocok.
            </p>
            <PemindaiQR onKode={konfirmasiJemput} memuat={memuat} labelTombol="Konfirmasi jemput" />
            {repo.mode === 'demo' && <div className="mt-5 border-t border-dashed border-tinta/25 pt-3 font-mono text-[11px] text-tinta-abu">
              Demo: kode bundel ini <button className="underline hover:text-revisi" onClick={() => konfirmasiJemput(verifikasi.kodeQR)}>{verifikasi.kodeQR}</button>
            </div>}
          </>
        )}
      </Modal>
    </>
  );
}
