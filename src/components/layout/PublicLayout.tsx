import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { TombolTautan } from '@/components/ui/Button';
import { berandaPeran } from '@/lib/navigasi';
import { Logo } from './Logo';

export function PublicLayout() {
  const { user } = useApp();
  const { pathname } = useLocation();
  // Masuk & Daftar: satu layar penuh tanpa scroll di layar lebar (header 1px border ikut dihitung lewat min-h-0).
  const kunci = ['/masuk', '/daftar'].includes(pathname);
  return (
    <div className={`flex min-h-screen flex-col ${kunci ? 'lg:h-dvh lg:overflow-hidden' : ''}`}>
      <header className="sticky top-0 z-40 border-b border-tinta/10 bg-kertas/90 backdrop-blur-[2px]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-[14px] md:flex">
            <a href="/#cara-kerja" className="tautan no-underline">Cara kerja</a>
            <a href="/#eco-paper" className="tautan no-underline">Eco-Paper</a>
            <a href="/#kerahasiaan" className="tautan no-underline">Kerahasiaan</a>
            <a href="/#dampak" className="tautan no-underline">Dampak</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <TombolTautan to={berandaPeran(user.role)} ukuran="sm" varian="lipat">Buka panel</TombolTautan>
            ) : (
              <>
                <NavLink to="/masuk" className="hidden px-3 text-sm sm:inline-block tautan no-underline">Masuk</NavLink>
                <TombolTautan to="/daftar" ukuran="sm" varian="lipat">Daftar gratis</TombolTautan>
              </>
            )}
          </div>
        </div>
      </header>
      <main className={`flex-1 ${kunci ? 'lg:min-h-0 lg:overflow-hidden' : ''}`}>
        <Outlet />
      </main>
      {!kunci && (
      <footer className="border-t border-tinta/15 bg-kertas-terang">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-tinta-abu">
              Cetak draf di sisi kosong kertas bekas, setor tumpukan revisi dari kos, dan pantau berapa banyak yang tidak berakhir di TPA Air Sebakul.
            </p>
          </div>
          <div className="text-sm">
            <div className="label-mono mb-3">Layanan</div>
            <ul className="space-y-1.5">
              <li><Link className="tautan no-underline" to="/masuk">Pesan cetak</Link></li>
              <li><Link className="tautan no-underline" to="/masuk">Ajukan jemput</Link></li>
              <li><a className="tautan no-underline" href="/#dampak">Laporan dampak</a></li>
            </ul>
          </div>
          <div className="text-sm">
            <div className="label-mono mb-3">Wilayah layanan</div>
            <p className="text-tinta-abu">Kandang Limun, Jl. W.R. Supratman, sekitar Universitas Bengkulu, Kota Bengkulu.</p>
          </div>
        </div>
        <div className="border-t border-tinta/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 font-mono text-[11px] text-tinta-abu sm:flex-row sm:justify-between sm:px-6">
            <span>© {new Date().getFullYear()} JejakKertas-Zero · Tugas Besar Rekayasa Perangkat Lunak</span>
            <span>Peta © kontributor OpenStreetMap</span>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}
