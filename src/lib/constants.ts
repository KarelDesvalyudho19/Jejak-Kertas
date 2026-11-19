import type {
  Jilid,
  JenisKertas,
  KategoriKerahasiaan,
  Pengaturan,
  Role,
  StatusJemput,
  StatusPesanan,
  Warna,
} from './types';

export const ROLE_LABEL: Record<Role, string> = {
  MAHASISWA: 'Mahasiswa',
  MITRA: 'Mitra Percetakan',
  KURIR: 'Kurir Jemput',
  ADMIN: 'Admin',
};

export const JENIS_KERTAS_LABEL: Record<JenisKertas, string> = {
  BARU: 'Kertas Baru',
  ECO: 'Eco-Paper',
};

export const WARNA_LABEL: Record<Warna, string> = {
  HITAM_PUTIH: 'Hitam-putih',
  WARNA: 'Berwarna',
};

export const JILID_LABEL: Record<Jilid, string> = {
  TANPA: 'Tanpa jilid',
  STAPLES: 'Staples pojok',
  LAKBAN: 'Lakban + mika',
  SPIRAL: 'Spiral kawat',
};

export const KATEGORI_LABEL: Record<KategoriKerahasiaan, string> = {
  AMAN: 'Aman dipakai ulang',
  RAHASIA: 'Berisi data pribadi → dicacah',
};

export type Tone = 'netral' | 'proses' | 'siap' | 'sukses' | 'bahaya' | 'kraft';

export const STATUS_PESANAN: Record<StatusPesanan, { label: string; tone: Tone }> = {
  DIAJUKAN: { label: 'Diajukan', tone: 'netral' },
  DIPROSES: { label: 'Diproses', tone: 'proses' },
  SIAP_DIAMBIL: { label: 'Siap Diambil', tone: 'siap' },
  SELESAI: { label: 'Selesai', tone: 'sukses' },
  DIBATALKAN: { label: 'Dibatalkan', tone: 'bahaya' },
};

export const STATUS_JEMPUT: Record<StatusJemput, { label: string; tone: Tone }> = {
  DIAJUKAN: { label: 'Diajukan', tone: 'netral' },
  DIPROSES: { label: 'Diproses', tone: 'proses' },
  DIJEMPUT: { label: 'Dijemput', tone: 'siap' },
  DISORTIR: { label: 'Disortir', tone: 'kraft' },
  DIPAKAI_ULANG: { label: 'Dipakai Ulang', tone: 'sukses' },
  DICACAH: { label: 'Dicacah', tone: 'sukses' },
  DIBATALKAN: { label: 'Dibatalkan', tone: 'bahaya' },
};

/** Urutan alur (untuk timeline). Langkah terakhir jemput tergantung kategori. */
export const ALUR_PESANAN: StatusPesanan[] = ['DIAJUKAN', 'DIPROSES', 'SIAP_DIAMBIL', 'SELESAI'];

export function alurJemput(kategori: KategoriKerahasiaan): StatusJemput[] {
  return ['DIAJUKAN', 'DIPROSES', 'DIJEMPUT', 'DISORTIR', kategori === 'RAHASIA' ? 'DICACAH' : 'DIPAKAI_ULANG'];
}

/** Transisi status yang sah — dijaga di repository maupun di fungsi SQL. */
export const TRANSISI_PESANAN: Record<StatusPesanan, StatusPesanan[]> = {
  DIAJUKAN: ['DIPROSES', 'DIBATALKAN'],
  DIPROSES: ['SIAP_DIAMBIL'],
  SIAP_DIAMBIL: ['SELESAI'],
  SELESAI: [],
  DIBATALKAN: [],
};

export const DEFAULT_PENGATURAN: Pengaturan = {
  gramPerLembar: 5,
  lembarPerPohon: 8333,
  poinPerLembar: 1,
  nilaiPoinRupiah: 10,
  maksPotonganPersen: 50,
  biayaJilid: { TANPA: 0, STAPLES: 500, LAKBAN: 4000, SPIRAL: 10000 },
};

/** Pusat peta: kawasan Kandang Limun, depan kampus UNIB. */
export const PUSAT_UNIB: [number, number] = [-3.7589, 102.2724];
