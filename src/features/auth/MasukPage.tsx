import { motion } from 'framer-motion';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { repo } from '@/data';
import { resetDemo } from '@/data/localRepo';
import { AKUN_DEMO } from '@/data/seed';
import { Button, Putar } from '@/components/ui/Button';
import { Bidang, Input } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useApp } from '@/context/AppContext';
import { ROLE_LABEL } from '@/lib/constants';
import { cn } from '@/lib/format';
import { berandaPeran } from '@/lib/navigasi';
import type { Role } from '@/lib/types';

const URUTAN: Role[] = ['MAHASISWA', 'MITRA', 'KURIR', 'ADMIN'];
const WARNA_TALI: Record<Role, string> = { MAHASISWA: '#D33A2C', MITRA: '#161513', KURIR: '#C49A6C', ADMIN: '#2F5D50' };

export default function MasukPage() {
  const { masuk, masukDemo } = useApp();
  const toast = useToast();
  const nav = useNavigate();
  const lokasi = useLocation();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [memuatDemo, setMemuatDemo] = useState<Role | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  const lanjut = (r: Role) => {
    const dari = (lokasi.state as { dari?: string } | null)?.dari;
    nav(dari && dari.startsWith(berandaPeran(r).split('/').slice(0, 2).join('/')) ? dari : berandaPeran(r), { replace: true });
  };

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setGalat(null);
    setMemuat(true);
    try {
      const u = await masuk(email, pw);
      lanjut(u.role);
    } catch (er) {
      setGalat((er as Error).message);
    } finally {
      setMemuat(false);
    }
  }

  async function demo(r: Role) {
    setMemuatDemo(r);
    try {
      const u = await masukDemo(r);
      toast(`Masuk sebagai ${u.nama} (${ROLE_LABEL[r]}).`, 'info');
      lanjut(u.role);
    } catch (er) {
      toast((er as Error).message, 'galat');
    } finally {
      setMemuatDemo(null);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
      <section>
        <div className="label-mono mb-3">Masuk</div>
        <h1 className="text-[44px] font-semibold leading-none">Selamat datang kembali.</h1>
        <p className="mt-3 text-tinta-abu">Masuk dengan akun JejakKertas-Zero untuk memesan cetak, menjadwalkan jemput, atau mengelola antrean.</p>
        <form onSubmit={kirim} className="mt-10 space-y-6">
          <Bidang label="Email">
            <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@contoh.ac.id" />
          </Bidang>
          <Bidang label="Kata sandi" galat={galat}>
            <Input type="password" autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
          </Bidang>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button type="submit" varian="tinta" ukuran="lg" memuat={memuat}>
              Masuk
            </Button>
            <span className="text-sm text-tinta-abu">
              Belum punya akun?{' '}
              <Link to="/daftar" className="tautan text-tinta">
                Daftar sebagai mahasiswa
              </Link>
            </span>
          </div>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <div className="label-mono">Akun demo</div>
            <p className="mt-1 text-sm text-tinta-abu">Pilih satu kartu untuk mencoba alur tiap aktor.</p>
          </div>
          {repo.mode === 'demo' && (
            <button
              className="font-mono text-[11px] uppercase tracking-widest text-tinta-abu hover:text-revisi"
              onClick={() => {
                if (!confirm('Kembalikan semua data demo ke kondisi awal?')) return;
                resetDemo();
                location.reload();
              }}
            >
              Reset data demo
            </button>
          )}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {URUTAN.map((r, i) => (
            <motion.button
              key={r}
              type="button"
              onClick={() => demo(r)}
              disabled={!!memuatDemo}
              initial={{ opacity: 0, y: 16, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: [-1.4, 1, -0.6, 1.2][i] }}
              whileHover={{ y: -6, rotate: 0 }}
              transition={{ delay: 0.06 * i }}
              className={cn('kartu group relative overflow-hidden pt-7 text-left disabled:opacity-60')}
            >
              {/* lubang tali kartu */}
              <span className="absolute left-1/2 top-2.5 h-2 w-10 -translate-x-1/2 rounded-full border border-tinta/25 bg-kertas" />
              <span className="absolute inset-x-0 top-0 h-1" style={{ background: WARNA_TALI[r] }} />
              <div className="px-5 pb-5">
                <div className="flex items-start justify-between">
                  <span className="label-mono" style={{ color: WARNA_TALI[r] }}>
                    {ROLE_LABEL[r]}
                  </span>
                  {memuatDemo === r ? <Putar /> : <span className="font-mono text-[10px] text-tinta-pudar">ID-{String(i + 1).padStart(3, '0')}</span>}
                </div>
                <div className="mt-6 flex items-end gap-3">
                  <div className="grid h-12 w-10 place-items-center border border-tinta/30 bg-kertas font-serif text-lg font-semibold">
                    {AKUN_DEMO[r].nama.split(' ').map((s) => s[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-serif text-[19px] font-semibold leading-tight">{AKUN_DEMO[r].nama}</div>
                    <div className="truncate text-[13px] text-tinta-abu">{AKUN_DEMO[r].ket}</div>
                  </div>
                </div>
                <div className="garis-putus mt-5" />
                <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-tinta-abu">
                  <span className="truncate">{AKUN_DEMO[r].email}</span>
                  <span className="text-tinta transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
        <p className="mt-6 font-mono text-[11px] leading-relaxed text-tinta-abu">
          {repo.mode === 'demo'
            ? 'Mode demo: data tersimpan di peramban ini saja (localStorage). Kata sandi semua akun demo: demo12345.'
            : 'Terhubung ke Supabase. Kata sandi akun demo: demo12345.'}
        </p>
      </section>
    </div>
  );
}
