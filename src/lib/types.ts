/**
 * Model domain JejakKertas-Zero.
 * Nama kelas & atribut sengaja disamakan 1:1 dengan Class Diagram (UML) tugas besar RPL.
 * Di database (Postgres/Supabase) nama kolom memakai snake_case; pemetaan ada di data/supabaseRepo.ts.
 */

export type Role = 'MAHASISWA' | 'MITRA' | 'KURIR' | 'ADMIN';

/** Kelas induk User. */
export interface User {
  id: string;
  nama: string;
  email: string;
  role: Role;
}

/** Turunan User: Mahasiswa */
export interface Mahasiswa extends User {
  role: 'MAHASISWA';
  npm: string;
  alamatKos: string;
  lat: number;
  lng: number;
  saldoPoin: number;
}

/** Turunan User: Mitra Percetakan */
export interface Mitra extends User {
  role: 'MITRA';
  namaUsaha: string;
  alamat: string;
  lat: number;
  lng: number;
}

/** Turunan User: Kurir / Petugas Jemput */
export interface Kurir extends User {
  role: 'KURIR';
  noHp: string;
}

/** Turunan User: Admin */
export interface Admin extends User {
  role: 'ADMIN';
}

export type AnyUser = Mahasiswa | Mitra | Kurir | Admin;

export interface Dokumen {
  id: string;
  namaFile: string;
  url: string;
  jumlahHalaman: number;
}

export type JenisKertas = 'BARU' | 'ECO';
export type Warna = 'HITAM_PUTIH' | 'WARNA';
export type Jilid = 'TANPA' | 'STAPLES' | 'LAKBAN' | 'SPIRAL';

export type StatusPesanan = 'DIAJUKAN' | 'DIPROSES' | 'SIAP_DIAMBIL' | 'SELESAI' | 'DIBATALKAN';

export interface PesananCetak {
  id: string;
  mahasiswaId: string;
  mitraId: string;
  dokumenId: string;
  jenisKertas: JenisKertas;
  warna: Warna;
  jilid: Jilid;
  salinan: number;
  totalHarga: number;
  poinDipakai: number;
  status: StatusPesanan;
  createdAt: string;
}

export type KategoriKerahasiaan = 'AMAN' | 'RAHASIA';

export type StatusJemput =
  | 'DIAJUKAN'
  | 'DIPROSES'
  | 'DIJEMPUT'
  | 'DISORTIR'
  | 'DIPAKAI_ULANG'
  | 'DICACAH'
  | 'DIBATALKAN';

export interface PermintaanJemput {
  id: string;
  mahasiswaId: string;
  kurirId: string | null;
  estimasiLembar: number;
  kategori: KategoriKerahasiaan;
  /** ISO datetime awal slot penjemputan */
  jadwal: string;
  status: StatusJemput;
  kodeQR: string;
  /** Atribut pendukung (opsional), tidak mengubah struktur kelas utama. */
  fotoUrl?: string | null;
  createdAt: string;
}

export interface BundelKertas {
  id: string;
  permintaanJemputId: string;
  mitraId: string;
  lembarLayak: number;
  lembarDicacah: number;
  /** null = bundel sudah diterima mitra tapi belum disortir */
  tanggalSortir: string | null;
}

export interface StokEcoPaper {
  mitraId: string;
  jumlahLembar: number;
}

export type JenisTransaksi = 'MASUK' | 'KELUAR';

export interface TransaksiPoin {
  id: string;
  mahasiswaId: string;
  jenis: JenisTransaksi;
  jumlah: number;
  keterangan: string;
  tanggal: string;
}

export interface Tarif {
  jenisKertas: JenisKertas;
  warna: Warna;
  hargaPerLembar: number;
}

/** Parameter sistem yang bisa diatur Admin (faktor konversi dampak, nilai poin, biaya jilid). */
export interface Pengaturan {
  gramPerLembar: number; // 1 lembar A4 80gsm ≈ 5 gram
  lembarPerPohon: number; // estimasi lembar A4 per pohon
  poinPerLembar: number; // poin per lembar tersortir
  nilaiPoinRupiah: number; // 1 poin = Rp x potongan
  maksPotonganPersen: number; // batas potongan poin dari total harga
  biayaJilid: Record<Jilid, number>;
}

/** Baris jadwal yang ditawarkan kepada mahasiswa saat mengajukan jemput. */
export interface SlotJadwal {
  mulai: string; // ISO
  label: string;
}
