import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PemilihLokasi } from '@/components/map/Peta';
import { Button } from '@/components/ui/Button';
import { Bidang, Input } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useApp } from '@/context/AppContext';

export default function DaftarPage() {
  const { daftar } = useApp();
  const toast = useToast();
  const nav = useNavigate();
  const [f, setF] = useState({ nama: '', npm: '', email: '', password: '', alamatKos: '', lat: 0, lng: 0 });
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const ubah = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setGalat(null);
    if (!/^[A-Za-z]\d[A-Za-z]\d{6}$/.test(f.npm.trim())) return setGalat('Format NPM UNIB: huruf-angka-huruf diikuti 6 angka, mis. G1A022045.');
    if (!f.lat) return setGalat('Tandai titik kos di peta supaya kurir bisa menemukanmu.');
    setMemuat(true);
    try {
      await daftar(f);
      toast('Akun dibuat. Bonus 50 poin sudah masuk dompet.', 'sukses');
      nav('/mhs', { replace: true });
    } catch (er) {
      setGalat((er as Error).message);
    } finally {
      setMemuat(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="label-mono mb-3">Daftar · Mahasiswa</div>
      <h1 className="text-[44px] font-semibold leading-none">Buat akun, mulai dari kos.</h1>
      <p className="mt-3 max-w-xl text-tinta-abu">Alamat dan titik kos dipakai kurir saat menjemput kertas bekasmu. Akun mitra percetakan dan kurir dibuat oleh admin.</p>
      <form onSubmit={kirim} className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <Bidang label="Nama lengkap">
            <Input required value={f.nama} onChange={ubah('nama')} placeholder="sesuai KTM" />
          </Bidang>
          <Bidang label="NPM" petunjuk="contoh: G1A022045">
            <Input required value={f.npm} onChange={ubah('npm')} className="font-mono uppercase" />
          </Bidang>
          <Bidang label="Email">
            <Input required type="email" value={f.email} onChange={ubah('email')} autoComplete="email" />
          </Bidang>
          <Bidang label="Kata sandi" petunjuk="minimal 8 karakter">
            <Input required type="password" minLength={8} value={f.password} onChange={ubah('password')} autoComplete="new-password" />
          </Bidang>
          <Bidang label="Alamat kos">
            <Input required value={f.alamatKos} onChange={ubah('alamatKos')} placeholder="Kos Melati, Gg. Mawar No. 3, Kandang Limun" />
          </Bidang>
        </div>
        <div>
          <Bidang label="Titik kos di peta" petunjuk="klik atau geser pin" galat={galat}>
            <PemilihLokasi lat={f.lat} lng={f.lng} onChange={(lat, lng) => setF((x) => ({ ...x, lat, lng }))} className="mt-2 h-[340px]" />
          </Bidang>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button type="submit" varian="revisi" ukuran="lg" memuat={memuat}>
              Daftar & dapatkan 50 poin
            </Button>
            <Link to="/masuk" className="tautan text-sm">
              Sudah punya akun
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
