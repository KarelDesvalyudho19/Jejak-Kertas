import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { repo } from '@/data';
import { PemilihLokasi } from '@/components/map/Peta';
import { Button } from '@/components/ui/Button';
import { Chip, Input, Label, PilihanKartu } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { JudulHalaman, Kertas } from '@/components/ui/Paper';
import { Stempel } from '@/components/ui/Stempel';
import { useApp, useData } from '@/context/AppContext';
import { angka, cn } from '@/lib/format';
import { labelSlot, slotTersedia } from '@/lib/jadwal';
import type { KategoriKerahasiaan, Mahasiswa, PermintaanJemput } from '@/lib/types';

export default function AjukanJemput() {
  const { data, user } = useData();
  const me = user as Mahasiswa;
  const { aksi } = useApp();
  const nav = useNavigate();

  const [estimasi, setEstimasi] = useState(100);
  const [kategori, setKategori] = useState<KategoriKerahasiaan>('AMAN');
  const [jadwal, setJadwal] = useState<string>('');
  const [foto, setFoto] = useState<File | null>(null);
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const [mengirim, setMengirim] = useState(false);
  const [hasil, setHasil] = useState<PermintaanJemput | null>(null);

  const hari = useMemo(() => slotTersedia(), []);
  useEffect(() => {
    if (!foto) return setPratinjau(null);
    const u = URL.createObjectURL(foto);
    setPratinjau(u);
    return () => URL.revokeObjectURL(u);
  }, [foto]);

  const lokasiOk = !!me.lat && !!me.alamatKos;
  const siap = estimasi >= 10 && !!jadwal && lokasiOk;

  async function kirim() {
    setMengirim(true);
    const j = await aksi(() => repo.ajukanJemput({ estimasiLembar: estimasi, kategori, jadwal, foto }), 'Permintaan jemput tercatat.');
    setMengirim(false);
    if (j) setHasil(j);
  }

  return (
    <>
      <JudulHalaman nomor="02 — Ajukan jemput" judul="Setor tumpukan draf dari kos." deskripsi="Kurir datang di slot yang kamu pilih. Poin masuk setelah mitra selesai menyortir." />

      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          <section>
            <Label petunjuk="tumpukan setebal 1 cm ≈ 100 lembar">Estimasi jumlah lembar</Label>
            <div className="flex flex-wrap items-end gap-4">
              <Input type="number" min={10} max={5000} value={estimasi} onChange={(e) => setEstimasi(Number(e.target.value))} className="w-36 font-mono text-[28px]" aria-label="Estimasi lembar" />
              <div className="flex flex-wrap gap-2 pb-1">
                {[50, 100, 200, 500].map((n) => (
                  <Chip key={n} aktif={estimasi === n} onClick={() => setEstimasi(n)}>
                    {n === 500 ? '1 rim' : `${n}`}
                  </Chip>
                ))}
              </div>
            </div>
            {estimasi < 10 && <p className="mt-2 text-sm text-revisi">Minimal 10 lembar agar kurir berangkat.</p>}
          </section>

          <section>
            <Label>Kategori kerahasiaan</Label>
            <PilihanKartu<KategoriKerahasiaan>
              nama="kategori"
              nilai={kategori}
              onChange={setKategori}
              opsi={[
                { nilai: 'AMAN', judul: 'Aman dipakai ulang', isi: 'Draf laporan, catatan kuliah, fotokopi modul. Sisi kosongnya akan jadi Eco-Paper.' },
                {
                  nilai: 'RAHASIA',
                  judul: <span className="text-revisi">Berisi data pribadi → dicacah</span>,
                  isi: 'KRS, slip UKT, fotokopi KTP/KTM, lembar bertanda tangan. Seluruh bundel dicacah, tidak ada yang dipakai ulang.',
                },
              ]}
            />
            {kategori === 'RAHASIA' && <p className="mt-3 text-[13px] text-tinta-abu">Tips: masukkan ke amplop atau kantong tertutup. Kurir hanya memindai label QR, tidak membuka isinya.</p>}
          </section>

          <section>
            <Label petunjuk="Minggu libur">Pilih slot jadwal</Label>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {hari.map(({ tanggal, slot }) => (
                <div key={tanggal.toISOString()} className="border border-tinta/15 bg-kertas-terang">
                  <div className="border-b border-tinta/10 px-3 py-2">
                    <div className="font-serif text-[17px] font-semibold capitalize leading-tight">{tanggal.toLocaleDateString('id-ID', { weekday: 'long' })}</div>
                    <div className="font-mono text-[11px] text-tinta-abu">{tanggal.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</div>
                  </div>
                  <div className="flex flex-col p-1.5">
                    {slot.map((s) => (
                      <button
                        key={s.mulai}
                        type="button"
                        disabled={s.habis}
                        onClick={() => setJadwal(s.mulai)}
                        className={cn(
                          'px-2.5 py-2 text-left font-mono text-[13px] transition-colors',
                          jadwal === s.mulai ? 'bg-tinta text-kertas-terang' : 'hover:bg-kertas',
                          s.habis && 'cursor-not-allowed text-tinta-pudar line-through',
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <Label petunjuk="opsional · membantu kurir menyiapkan kantong">Foto tumpukan</Label>
            <label className="flex cursor-pointer items-center gap-4 border border-dashed border-tinta/25 p-3 hover:border-tinta/60">
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
              {pratinjau ? (
                <img src={pratinjau} alt="Pratinjau foto tumpukan kertas" className="h-20 w-20 object-cover" />
              ) : (
                <div className="grid h-20 w-20 place-items-center bg-kertas text-tinta-abu">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7h4l2-3h4l2 3h4v13H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
                </div>
              )}
              <div className="text-sm">
                <div className="font-medium">{foto ? foto.name : 'Ambil atau pilih foto'}</div>
                <div className="text-tinta-abu">{foto ? 'klik untuk mengganti' : 'JPG/PNG dari kamera ponsel'}</div>
              </div>
            </label>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
          <Kertas className="p-5">
            <div className="label-mono">Dijemput di</div>
            {lokasiOk ? (
              <>
                <div className="mt-2 font-medium">{me.alamatKos}</div>
                <PemilihLokasi lat={me.lat} lng={me.lng} onChange={() => {}} className="pointer-events-none mt-3 h-36" />
                <Link to="/mhs/profil" className="tautan mt-2 inline-block text-[13px]">Ubah alamat kos</Link>
              </>
            ) : (
              <p className="mt-2 text-sm text-revisi">
                Alamat atau titik kos belum diisi. <Link to="/mhs/profil" className="underline">Lengkapi profil</Link> dulu.
              </p>
            )}
          </Kertas>
          <Kertas bergaris className="p-5">
            <div className="label-mono">Ringkasan</div>
            <dl className="mt-3 space-y-1 text-sm leading-8">
              <div className="flex justify-between"><dt className="text-tinta-abu">Estimasi</dt><dd className="font-mono">{angka(estimasi)} lbr</dd></div>
              <div className="flex justify-between"><dt className="text-tinta-abu">Kategori</dt><dd className={cn(kategori === 'RAHASIA' && 'text-revisi')}>{kategori === 'AMAN' ? 'Aman' : 'Dicacah'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-tinta-abu">Jadwal</dt><dd className="text-right">{jadwal ? labelSlot(jadwal) : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-tinta-abu">Perkiraan poin</dt><dd className="font-mono">±{angka(estimasi * data.pengaturan.poinPerLembar)}</dd></div>
            </dl>
            <p className="mt-2 text-[12px] text-tinta-abu">Poin final mengikuti jumlah lembar hasil sortir mitra.</p>
            <Button varian="revisi" className="mt-5 w-full" disabled={!siap} memuat={mengirim} onClick={kirim}>
              Ajukan penjemputan
            </Button>
          </Kertas>
        </aside>
      </div>

      <Modal buka={!!hasil} tutup={() => nav(`/mhs/lacak/jemput/${hasil!.id}`)} judul="Tempel kode ini di bundelmu.">
        {hasil && (
          <div className="text-center">
            <div className="relative mx-auto w-fit border border-tinta bg-white p-4">
              <QRCodeSVG value={hasil.kodeQR} size={168} fgColor="#161513" bgColor="#FFFFFF" level="M" />
              {hasil.kategori === 'RAHASIA' && (
                <div className="absolute -right-12 -top-10">
                  <Stempel atas="rahasia" tengah="CACAH" bawah="data pribadi" ukuran={86} miring={14} />
                </div>
              )}
            </div>
            <div className="mt-4 font-mono text-[22px] font-semibold tracking-[0.12em]">{hasil.kodeQR}</div>
            <p className="mx-auto mt-3 max-w-sm text-sm text-tinta-abu">Tulis kode di kertas paling atas atau tunjukkan layar ini ke kurir. Kurir memindai kode yang sama saat menjemput, lalu mitra saat menerima.</p>
            <Button className="mt-6" onClick={() => nav(`/mhs/lacak/jemput/${hasil.id}`)}>
              Lihat status penjemputan
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
