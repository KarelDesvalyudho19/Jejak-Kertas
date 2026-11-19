import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell, LayarMuat } from '@/components/layout/AppShell';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { useApp } from '@/context/AppContext';
import { berandaPeran } from '@/lib/navigasi';
import LandingPage from '@/features/landing/LandingPage';

const MasukPage = lazy(() => import('@/features/auth/MasukPage'));
const DaftarPage = lazy(() => import('@/features/auth/DaftarPage'));

const BerandaMhs = lazy(() => import('@/features/mahasiswa/BerandaMahasiswa'));
const PesanCetak = lazy(() => import('@/features/mahasiswa/PesanCetak'));
const AjukanJemput = lazy(() => import('@/features/mahasiswa/AjukanJemput'));
const Lacak = lazy(() => import('@/features/mahasiswa/Lacak'));
const DetailPesanan = lazy(() => import('@/features/mahasiswa/DetailPesanan'));
const DetailJemput = lazy(() => import('@/features/mahasiswa/DetailJemput'));
const DompetPoin = lazy(() => import('@/features/mahasiswa/DompetPoin'));
const Profil = lazy(() => import('@/features/mahasiswa/Profil'));

const AntreanMitra = lazy(() => import('@/features/mitra/AntreanCetak'));
const BundelMitra = lazy(() => import('@/features/mitra/BundelSortir'));
const StokMitra = lazy(() => import('@/features/mitra/StokEco'));

const TugasKurir = lazy(() => import('@/features/kurir/TugasJemput'));

const LaporanDampak = lazy(() => import('@/features/admin/LaporanDampak'));
const TarifAturan = lazy(() => import('@/features/admin/TarifAturan'));
const MitraKurir = lazy(() => import('@/features/admin/MitraKurir'));
const Pengguna = lazy(() => import('@/features/admin/Pengguna'));

function GulirAtas() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function ArahkanPanel() {
  const { user, memuatSesi } = useApp();
  if (memuatSesi) return <LayarMuat />;
  return <Navigate to={user ? berandaPeran(user.role) : '/masuk'} replace />;
}

export default function App() {
  return (
    <>
      <GulirAtas />
      <Suspense fallback={<LayarMuat />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="masuk" element={<MasukPage />} />
            <Route path="daftar" element={<DaftarPage />} />
          </Route>
          <Route path="panel" element={<ArahkanPanel />} />

          <Route path="mhs" element={<AppShell peran="MAHASISWA" />}>
            <Route index element={<BerandaMhs />} />
            <Route path="cetak" element={<PesanCetak />} />
            <Route path="jemput" element={<AjukanJemput />} />
            <Route path="lacak" element={<Lacak />} />
            <Route path="lacak/pesanan/:id" element={<DetailPesanan />} />
            <Route path="lacak/jemput/:id" element={<DetailJemput />} />
            <Route path="poin" element={<DompetPoin />} />
            <Route path="profil" element={<Profil />} />
          </Route>

          <Route path="mitra" element={<AppShell peran="MITRA" />}>
            <Route index element={<AntreanMitra />} />
            <Route path="bundel" element={<BundelMitra />} />
            <Route path="stok" element={<StokMitra />} />
          </Route>

          <Route path="kurir" element={<AppShell peran="KURIR" />}>
            <Route index element={<TugasKurir />} />
          </Route>

          <Route path="admin" element={<AppShell peran="ADMIN" />}>
            <Route index element={<LaporanDampak />} />
            <Route path="tarif" element={<TarifAturan />} />
            <Route path="mitra-kurir" element={<MitraKurir />} />
            <Route path="pengguna" element={<Pengguna />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
