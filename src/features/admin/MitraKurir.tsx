import { useState, type FormEvent } from 'react';
import { repo } from '@/data';
import { PemilihLokasi } from '@/components/map/Peta';
import { Button } from '@/components/ui/Button';
import { Bidang, Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { JudulHalaman, Kertas, SubJudul } from '@/components/ui/Paper';
import { useApp, useData, useLookup } from '@/context/AppContext';
import { angka } from '@/lib/format';
import type { Kurir, Mitra } from '@/lib/types';

type Form =
  | { role: 'MITRA'; email: string; nama: string; namaUsaha: string; alamat: string; lat: number; lng: number; baru: boolean }
  | { role: 'KURIR'; email: string; nama: string; noHp: string; baru: boolean };

export default function MitraKurir() {
  const { data } = useData();
  const { aksi } = useApp();
  const { mitra, stok } = useLookup();
  const kurir = data.users.filter((u): u is Kurir => u.role === 'KURIR');
  const [form, setForm] = useState<Form | null>(null);
  const [memuat, setMemuat] = useState(false);

  const pesananMitra = (id: string) => data.pesanan.filter((p) => p.mitraId === id && p.status !== 'DIBATALKAN').length;
  const jemputKurir = (id: string) => data.jemput.filter((j) => j.kurirId === id && !['DIAJUKAN', 'DIPROSES', 'DIBATALKAN'].includes(j.status)).length;

  async function simpan(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setMemuat(true);
    const detail: Record<string, string | number> = form.role === 'MITRA' ? { namaUsaha: form.namaUsaha, alamat: form.alamat, lat: form.lat, lng: form.lng } : { noHp: form.noHp };
    const ok = await aksi(() => repo.tetapkanPeran({ email: form.email, nama: form.nama, role: form.role, detail }), form.baru ? 'Akun ditambahkan.' : 'Data diperbarui.');
    setMemuat(false);
    if (ok !== null) setForm(null);
  }

  const baruMitra = (): Form => ({ role: 'MITRA', email: '', nama: '', namaUsaha: '', alamat: '', lat: -3.7589, lng: 102.2724, baru: true });
  const editMitra = (m: Mitra): Form => ({ role: 'MITRA', email: m.email, nama: m.nama, namaUsaha: m.namaUsaha, alamat: m.alamat, lat: m.lat, lng: m.lng, baru: false });

  return (
    <>
      <JudulHalaman nomor="02 — Mitra & kurir" judul="Siapa yang mencetak dan menjemput." deskripsi={repo.mode === 'supabase' ? 'Calon mitra/kurir mendaftar dulu lewat halaman Daftar, lalu tetapkan perannya di sini dengan email yang sama.' : 'Mode demo: akun baru langsung dibuat dengan kata sandi demo12345.'} />

      <section>
        <SubJudul kanan={<Button ukuran="sm" onClick={() => setForm(baruMitra())}>+ Mitra</Button>}>Mitra percetakan</SubJudul>
        <Kertas>
          {mitra.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-tinta/10 px-5 py-3.5 last:border-0">
              <div className="min-w-0">
                <div className="font-medium">{m.namaUsaha}</div>
                <div className="truncate text-[13px] text-tinta-abu">{m.nama} · {m.alamat}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-[12px] text-tinta-abu">{angka(stok.get(m.id) ?? 0)} lbr stok · {angka(pesananMitra(m.id))} pesanan</span>
                <Button varian="hantu" ukuran="sm" onClick={() => setForm(editMitra(m))}>Ubah</Button>
              </div>
            </div>
          ))}
        </Kertas>
      </section>

      <section className="mt-8">
        <SubJudul kanan={<Button ukuran="sm" onClick={() => setForm({ role: 'KURIR', email: '', nama: '', noHp: '', baru: true })}>+ Kurir</Button>}>Kurir jemput</SubJudul>
        <Kertas>
          {kurir.map((k) => (
            <div key={k.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-tinta/10 px-5 py-3.5 last:border-0">
              <div>
                <div className="font-medium">{k.nama}</div>
                <div className="font-mono text-[12px] text-tinta-abu">{k.noHp} · {k.email}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-[12px] text-tinta-abu">{jemputKurir(k.id)} penjemputan selesai</span>
                <Button varian="hantu" ukuran="sm" onClick={() => setForm({ role: 'KURIR', email: k.email, nama: k.nama, noHp: k.noHp, baru: false })}>Ubah</Button>
              </div>
            </div>
          ))}
        </Kertas>
      </section>

      <Modal buka={!!form} tutup={() => setForm(null)} judul={form ? `${form.baru ? 'Tambah' : 'Ubah'} ${form.role === 'MITRA' ? 'mitra' : 'kurir'}` : ''} className="sm:max-w-xl">
        {form && (
          <form onSubmit={simpan} className="space-y-5">
            <Bidang label="Email akun">
              <Input type="email" required value={form.email} disabled={!form.baru} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Bidang>
            <Bidang label={form.role === 'MITRA' ? 'Nama pemilik / penanggung jawab' : 'Nama kurir'}>
              <Input required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
            </Bidang>
            {form.role === 'MITRA' ? (
              <>
                <Bidang label="Nama usaha">
                  <Input required value={form.namaUsaha} onChange={(e) => setForm({ ...form, namaUsaha: e.target.value })} />
                </Bidang>
                <Bidang label="Alamat">
                  <Input required value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
                </Bidang>
                <PemilihLokasi lat={form.lat} lng={form.lng} onChange={(lat, lng) => setForm({ ...form, lat, lng })} className="h-52" />
              </>
            ) : (
              <Bidang label="No. HP">
                <Input required value={form.noHp} onChange={(e) => setForm({ ...form, noHp: e.target.value })} className="font-mono" />
              </Bidang>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" varian="hantu" onClick={() => setForm(null)}>Batal</Button>
              <Button type="submit" memuat={memuat}>Simpan</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
