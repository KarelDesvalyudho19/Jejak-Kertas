import { useState, type FormEvent } from 'react';
import { repo } from '@/data';
import { PemilihLokasi } from '@/components/map/Peta';
import { Button } from '@/components/ui/Button';
import { Bidang, Input } from '@/components/ui/Field';
import { JudulHalaman } from '@/components/ui/Paper';
import { useApp, useData } from '@/context/AppContext';
import type { Mahasiswa } from '@/lib/types';

export default function Profil() {
  const { user } = useData();
  const me = user as Mahasiswa;
  const { aksi } = useApp();
  const [f, setF] = useState({ nama: me.nama, npm: me.npm, alamatKos: me.alamatKos, lat: me.lat, lng: me.lng });
  const [memuat, setMemuat] = useState(false);

  async function simpan(e: FormEvent) {
    e.preventDefault();
    setMemuat(true);
    await aksi(() => repo.perbaruiProfil({ id: me.id, ...f }), 'Profil disimpan.');
    setMemuat(false);
  }

  return (
    <>
      <JudulHalaman nomor="05 — Profil" judul="Data diri & alamat kos." deskripsi="Alamat dan titik peta dipakai kurir untuk menemukan kosmu." />
      <form onSubmit={simpan} className="grid gap-6 lg:grid-cols-2">
        <div className="kartu space-y-5 p-5">
          <Bidang label="Nama lengkap">
            <Input value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} required />
          </Bidang>
          <Bidang label="NPM">
            <Input value={f.npm} onChange={(e) => setF({ ...f, npm: e.target.value.toUpperCase() })} className="font-mono" required />
          </Bidang>
          <Bidang label="Email" petunjuk="tidak bisa diubah">
            <Input value={me.email} disabled className="text-tinta-abu" />
          </Bidang>
          <Bidang label="Alamat kos">
            <Input value={f.alamatKos} onChange={(e) => setF({ ...f, alamatKos: e.target.value })} required />
          </Bidang>
          <Button type="submit" memuat={memuat}>
            Simpan perubahan
          </Button>
        </div>
        <Bidang label="Titik kos" petunjuk="klik atau geser pin" className="kartu p-5">
          <PemilihLokasi lat={f.lat} lng={f.lng} onChange={(lat, lng) => setF((x) => ({ ...x, lat, lng }))} className="mt-2 h-[380px]" />
        </Bidang>
      </form>
    </>
  );
}
