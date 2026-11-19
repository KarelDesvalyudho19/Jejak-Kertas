import type {
  AnyUser,
  BundelKertas,
  Dokumen,
  Jilid,
  JenisKertas,
  KategoriKerahasiaan,
  Pengaturan,
  PermintaanJemput,
  PesananCetak,
  Role,
  StatusPesanan,
  StokEcoPaper,
  Tarif,
  TransaksiPoin,
  Warna,
} from '@/lib/types';

/** Semua data yang boleh dilihat pengguna aktif (di Supabase disaring oleh Row Level Security). */
export interface DataSet {
  users: AnyUser[];
  dokumen: Dokumen[];
  pesanan: PesananCetak[];
  jemput: PermintaanJemput[];
  bundel: BundelKertas[];
  stok: StokEcoPaper[];
  transaksi: TransaksiPoin[];
  tarif: Tarif[];
  pengaturan: Pengaturan;
}

export interface InputDaftar {
  nama: string;
  email: string;
  password: string;
  npm: string;
  alamatKos: string;
  lat: number;
  lng: number;
}

export interface InputPesanan {
  mitraId: string;
  dokumenId: string;
  jenisKertas: JenisKertas;
  warna: Warna;
  jilid: Jilid;
  salinan: number;
  poinDipakai: number;
}

export interface InputJemput {
  estimasiLembar: number;
  kategori: KategoriKerahasiaan;
  jadwal: string;
  foto?: File | null;
}

export interface InputPeran {
  email: string;
  nama: string;
  role: Role;
  detail: Record<string, string | number>;
}

/**
 * Kontrak lapisan data. Ada dua implementasi:
 *  - localRepo   : mode demo, tanpa server, data di localStorage + IndexedDB.
 *  - supabaseRepo: Supabase Auth + Postgres (RPC) + Storage.
 * Aturan bisnis (validasi transisi status, poin, stok) dijaga di kedua sisi.
 */
export interface Repo {
  readonly mode: 'demo' | 'supabase';

  // — Autentikasi
  sesi(): Promise<AnyUser | null>;
  masuk(email: string, password: string): Promise<AnyUser>;
  masukDemo(role: Role): Promise<AnyUser>;
  daftar(input: InputDaftar): Promise<AnyUser>;
  keluar(): Promise<void>;
  perbaruiProfil(patch: Partial<AnyUser> & { id: string }): Promise<void>;

  // — Baca
  muat(): Promise<DataSet>;
  /** Angka agregat untuk halaman publik (boleh tanpa login, tanpa data pribadi). */
  ringkasanPublik(): Promise<RingkasanPublik>;

  // — Mahasiswa
  unggahDokumen(file: File, jumlahHalaman: number): Promise<Dokumen>;
  buatPesanan(input: InputPesanan): Promise<PesananCetak>;
  ajukanJemput(input: InputJemput): Promise<PermintaanJemput>;
  batalkanJemput(id: string): Promise<void>;

  // — Mitra
  ubahStatusPesanan(id: string, status: StatusPesanan): Promise<void>;
  urlDokumen(dokumenId: string): Promise<string>;
  terimaBundel(kodeQR: string): Promise<BundelKertas>;
  simpanSortir(bundelId: string, lembarLayak: number, lembarDicacah: number): Promise<void>;
  selesaikanBundel(bundelId: string): Promise<void>;
  aturStok(jumlahLembar: number): Promise<void>;

  // — Kurir
  ambilTugas(jemputId: string): Promise<void>;
  tandaiDijemput(jemputId: string, kodeQR: string): Promise<void>;

  // — Admin
  simpanTarif(tarif: Tarif[]): Promise<void>;
  simpanPengaturan(p: Pengaturan): Promise<void>;
  tetapkanPeran(input: InputPeran): Promise<void>;
}

export interface RingkasanPublik {
  lembarLayak: number;
  lembarDicacah: number;
  lembarEco: number;
  mahasiswa: number;
  mitra: number;
  gramPerLembar: number;
  lembarPerPohon: number;
  poinPerLembar: number;
  nilaiPoinRupiah: number;
  tarif: Tarif[];
}

export class RepoError extends Error {}
