import type { Role } from './types';

export interface ItemNav {
  ke: string;
  label: string;
  ikon: string; // nama ikon di components/layout/Ikon.tsx
  akhir?: boolean;
}

export const NAV: Record<Role, ItemNav[]> = {
  MAHASISWA: [
    { ke: '/mhs', label: 'Beranda', ikon: 'meja', akhir: true },
    { ke: '/mhs/cetak', label: 'Pesan Cetak', ikon: 'printer' },
    { ke: '/mhs/jemput', label: 'Ajukan Jemput', ikon: 'tumpuk' },
    { ke: '/mhs/lacak', label: 'Lacak Status', ikon: 'lacak' },
    { ke: '/mhs/poin', label: 'Dompet Poin', ikon: 'poin' },
    { ke: '/mhs/profil', label: 'Profil', ikon: 'profil' },
  ],
  MITRA: [
    { ke: '/mitra', label: 'Beranda', ikon: 'meja', akhir: true },
    { ke: '/mitra/antrean', label: 'Antrean Cetak', ikon: 'printer' },
    { ke: '/mitra/bundel', label: 'Bundel & Sortir', ikon: 'tumpuk' },
    { ke: '/mitra/stok', label: 'Stok Eco-Paper', ikon: 'stok' },
  ],
  KURIR: [{ ke: '/kurir', label: 'Beranda', ikon: 'meja', akhir: true }],
  ADMIN: [
    { ke: '/admin', label: 'Beranda', ikon: 'meja', akhir: true },
    { ke: '/admin/tarif', label: 'Tarif & Aturan', ikon: 'poin' },
    { ke: '/admin/mitra-kurir', label: 'Mitra & Kurir', ikon: 'stok' },
    { ke: '/admin/pengguna', label: 'Pengguna', ikon: 'profil' },
  ],
};

export const berandaPeran = (r: Role) => NAV[r][0].ke;
