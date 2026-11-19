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
    <div className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center lg:h-[calc(100dvh-4rem)] lg:overflow-hidden">
      <div className="grid-milimeter pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <form onSubmit={kirim} className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-6">
        <section>
          <div className="mb-5 inline-block -rotate-1 drop-shadow-[0_2px_3px_rgba(22,21,19,0.18)]">
            <p className="sudut-lipat bg-[#FEFEFC] py-1.5 pl-4 pr-8 text-[14px] text-tinta">Daftar ke JejakKertas-Zero</p>
          </div>
          <h1 className="text-[44px] font-medium leading-[0.98] lg:text-[48px]">
            Buat akun, mulai dari kos<span className="text-revisi">.</span>
          </h1>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-tinta-abu">Alamat dan titik kos dipakai kurir saat menjemput kertas bekasmu. Akun mitra dan kurir dibuat oleh admin.</p>
          <div className="mt-6 grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Bidang label="Nama lengkap">
              <Input required value={f.nama} onChange={ubah('nama')} placeholder="sesuai KTM" />
            </Bidang>
            <Bidang label="NPM" petunjuk="contoh: G1A022045">
              <Input required value={f.npm} onChange={ubah('npm')} className="font-mono uppercase" />
            </Bidang>
            <Bidang label="Email">
              <Input required type="email" value={f.email} onChange={ubah('email')} autoComplete="email" placeholder="nama@contoh.ac.id" />
            </Bidang>
            <Bidang label="Kata sandi" petunjuk="minimal 8 karakter">
              <Input required type="password" minLength={8} value={f.password} onChange={ubah('password')} autoComplete="new-password" placeholder="••••••••" />
            </Bidang>
            <Bidang label="Alamat kos" className="sm:col-span-2">
              <Input required value={f.alamatKos} onChange={ubah('alamatKos')} placeholder="Kos Melati, Gg. Mawar No. 3, Kandang Limun" />
            </Bidang>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button type="submit" varian="lipat" ukuran="lg" memuat={memuat}>
              Daftar & dapatkan 50 poin
            </Button>
            <span className="text-sm text-tinta-abu">
              Sudah punya akun?{' '}
              <Link to="/masuk" className="tautan text-tinta">
                Masuk
              </Link>
            </span>
          </div>
        </section>

        <section>
          <Bidang label="Titik kos di peta" petunjuk="klik atau geser pin" galat={galat}>
            <PemilihLokasi lat={f.lat} lng={f.lng} onChange={(lat, lng) => setF((x) => ({ ...x, lat, lng }))} className="mt-2 h-[340px] lg:h-[min(460px,calc(100dvh-12rem))]" />
          </Bidang>
        </section>
      </form>
    </div>
  );
}
