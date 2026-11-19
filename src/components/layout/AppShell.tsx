import { AnimatePresence, motion } from 'framer-motion';
import { Suspense } from 'react';
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { repo } from '@/data';
import { useApp } from '@/context/AppContext';
import { ROLE_LABEL } from '@/lib/constants';
import { angka, cn } from '@/lib/format';
import { NAV, berandaPeran } from '@/lib/navigasi';
import type { Role } from '@/lib/types';
import { Putar } from '@/components/ui/Button';
import { Ikon } from './Ikon';
import { Logo } from './Logo';

/** Kerangka panel: sidebar (desktop) + navigasi bawah (mobile). */
export function AppShell({ peran }: { peran: Role }) {
  const { user, memuatSesi, data, keluar } = useApp();
  const lokasi = useLocation();
  const nav = useNavigate();

  if (memuatSesi) return <LayarMuat />;
  if (!user) return <Navigate to="/masuk" replace state={{ dari: lokasi.pathname }} />;
  if (user.role !== peran) return <Navigate to={berandaPeran(user.role)} replace />;

  const items = NAV[peran];
  const saldo = user.role === 'MAHASISWA' ? user.saldoPoin : null;

  return (
    <div className="min-h-screen md:grid md:grid-cols-[232px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-tinta/10 bg-kertas-gelap/60 md:flex">
        <div className="px-4 pb-4 pt-5">
          <Logo ke={berandaPeran(peran)} kecil />
        </div>
        <div className="px-4">
          <div className="label-mono">{ROLE_LABEL[peran]}</div>
        </div>
        <nav className="mt-3 flex flex-1 flex-col gap-1 px-3">
          {items.map((it) => (
            <NavLink
              key={it.ke}
              to={it.ke}
              end={it.akhir}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 border px-3 py-2 text-[14px] transition-all',
                  isActive
                    ? 'border-tinta/10 bg-[#FEFEFC] font-medium text-tinta shadow-kertas'
                    : 'border-transparent text-tinta-abu hover:bg-kertas-terang/70 hover:text-tinta',
                )
              }
            >
              <Ikon nama={it.ikon} />
              <span className="truncate">{it.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-tinta/10 p-4">
          {saldo !== null && (
            <NavLink to="/mhs/poin" className="mb-3 flex items-center justify-between border border-dashed border-kraft px-3 py-2">
              <span className="label-mono">Saldo poin</span>
              <span className="font-mono text-sm font-semibold">{angka(saldo)}</span>
            </NavLink>
          )}
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center border border-tinta bg-kertas font-serif text-sm font-semibold">
              {user.nama.split(' ').map((s) => s[0]).slice(0, 2).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{user.role === 'MITRA' ? user.namaUsaha : user.nama}</div>
              <div className="truncate font-mono text-[11px] text-tinta-abu">{user.email}</div>
            </div>
            <button
              onClick={async () => {
                await keluar();
                nav('/masuk');
              }}
              className="grid h-8 w-8 place-items-center text-tinta-abu hover:text-revisi"
              aria-label="Keluar"
              title="Keluar"
            >
              <Ikon nama="keluar" />
            </button>
          </div>
          {repo.mode === 'demo' && <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-tinta-pudar">Mode demo · data lokal</div>}
        </div>
      </aside>

      {/* Bilah atas mobile */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-tinta/10 bg-kertas/95 px-4 md:hidden">
        <Logo ke={berandaPeran(peran)} className="scale-90 origin-left" />
        <div className="flex items-center gap-2">
          {saldo !== null && <span className="border border-dashed border-kraft px-2 py-0.5 font-mono text-xs">{angka(saldo)} poin</span>}
          <button
            onClick={async () => {
              await keluar();
              nav('/masuk');
            }}
            className="grid h-9 w-9 place-items-center text-tinta-abu"
            aria-label="Keluar"
          >
            <Ikon nama="keluar" />
          </button>
        </div>
      </div>

      <main className="min-w-0 pb-24 md:pb-0">
        <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {!data ? (
            <LayarMuat dalam />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={lokasi.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <Suspense fallback={<LayarMuat dalam />}>
                  <Outlet />
                </Suspense>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Navigasi bawah mobile */}
      {items.length > 1 && (
        <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-tinta/15 bg-kertas-terang md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {items.slice(0, 5).map((it) => (
            <NavLink
              key={it.ke}
              to={it.ke}
              end={it.akhir}
              className={({ isActive }) => cn('flex flex-1 flex-col items-center gap-0.5 py-2 text-[10.5px]', isActive ? 'text-revisi' : 'text-tinta-abu')}
            >
              <Ikon nama={it.ikon} className="h-5 w-5" />
              <span className="leading-tight">{it.label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

export function LayarMuat({ dalam }: { dalam?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 text-tinta-abu', dalam ? 'py-32' : 'min-h-screen')}>
      <Putar className="h-5 w-5 text-revisi" />
      <span className="label-mono">Membuka berkas…</span>
    </div>
  );
}
