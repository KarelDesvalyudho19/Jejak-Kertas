# JejakKertas-Zero

Platform print-on-demand ramah lingkungan dan penjemputan kertas bekas revisi untuk mahasiswa di sekitar Universitas Bengkulu (Kandang Limun, Jl. W.R. Supratman, Bumi Ayu). Dibuat sebagai Tugas Besar mata kuliah Rekayasa Perangkat Lunak.

- **Eco-Paper**: draf dicetak di sisi kosong kertas bekas yang sudah disortir, untuk draf dan bahan bimbingan, bukan berkas final.
- **Jemput dari kos**: mahasiswa mengajukan penjemputan, kurir memverifikasi label QR, lalu mitra menyortir.
- **Kerahasiaan**: bundel bertanda *berisi data pribadi* wajib dicacah seluruhnya. Aturan ini dijaga di frontend, repository lokal, dan fungsi SQL.
- **Poin**: setiap lembar yang tersortir menjadi poin potongan cetak, dengan riwayat bergaya buku tabungan.
- **Dampak**: jumlah lembar, kg yang tidak masuk TPA Air Sebakul, dan estimasi pohon. Faktor konversinya bisa diatur admin dan datanya bisa diekspor ke CSV.

## Menjalankan

```bash
npm install
npm run dev
```

Tanpa `.env`, aplikasi berjalan dalam **mode demo**. Data contoh dibuat otomatis dan disimpan di peramban (localStorage untuk data, IndexedDB untuk PDF/foto). Di halaman **Masuk**, pilih salah satu kartu akun demo:

| Peran | Email | Kata sandi |
|---|---|---|
| Mahasiswa | rani@demo.jejakkertas.id | demo12345 |
| Mitra Percetakan | cetakkilat@demo.jejakkertas.id | demo12345 |
| Kurir | yogi@demo.jejakkertas.id | demo12345 |
| Admin | admin@demo.jejakkertas.id | demo12345 |

Tombol **Reset data demo** di halaman Masuk mengembalikan data contoh ke kondisi awal.

## Memakai Supabase

1. Buat proyek di Supabase, lalu jalankan `supabase/migrations/20261118000000_skema_awal.sql` lewat SQL Editor (atau `supabase db push`). Migrasi ini membuat tabel, enum, RLS, fungsi RPC, dan bucket Storage `dokumen` serta `foto-jemput`.
2. Salin `.env.example` menjadi `.env`, lalu isi `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, dan (khusus untuk seeding) `SUPABASE_SERVICE_ROLE_KEY`.
3. Isi data contoh beserta 4 akun demo:
   ```bash
   npm run seed:supabase
   ```
4. Jalankan `npm run dev`. Aplikasi otomatis memakai Supabase bila kedua variabel `VITE_` terisi.

Di mode Supabase, pendaftaran publik hanya untuk mahasiswa. Mitra dan kurir mendaftar dulu, lalu admin menetapkan perannya di **Admin → Mitra & Kurir** atau **Pengguna**.

## Deploy ke Vercel

Impor repositori di Vercel (framework: Vite). Build command `npm run build`, output `dist`. Tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di Environment Variables, atau kosongkan untuk deploy mode demo. `vercel.json` sudah berisi rewrite SPA.

## Keterlacakan ke desain UML

**Class Diagram → kode**

| Kelas | TypeScript (`src/lib/types.ts`) | Tabel Postgres |
|---|---|---|
| User (+ Mahasiswa, Mitra, Kurir, Admin) | `User`, `Mahasiswa`, `Mitra`, `Kurir`, `Admin` | `users` (+ `mahasiswa`, `mitra`, `kurir`; Admin = `users.role`) |
| Dokumen | `Dokumen` | `dokumen` |
| PesananCetak | `PesananCetak` | `pesanan_cetak` |
| PermintaanJemput | `PermintaanJemput` | `permintaan_jemput` |
| BundelKertas | `BundelKertas` | `bundel_kertas` |
| StokEcoPaper | `StokEcoPaper` | `stok_eco_paper` |
| TransaksiPoin | `TransaksiPoin` | `transaksi_poin` |
| Tarif | `Tarif` | `tarif` |
| (parameter sistem) | `Pengaturan` | `pengaturan` |

Enum status (`StatusPesanan`, `StatusJemput`, `KategoriKerahasiaan`, dll.) sama persis di TypeScript dan Postgres. Label dan warna badge-nya didefinisikan di `src/lib/constants.ts`.

**Use Case → halaman**

| Aktor | Use case | Rute | Berkas |
|---|---|---|---|
| Mahasiswa | Daftar / Masuk / Profil | `/daftar`, `/masuk`, `/mhs/profil` | `features/auth/*`, `features/mahasiswa/Profil.tsx` |
| | Pesan Cetak (pdf.js, harga langsung, poin) | `/mhs/cetak` | `features/mahasiswa/PesanCetak.tsx` |
| | Ajukan Jemput (slot, foto, kerahasiaan, QR) | `/mhs/jemput` | `features/mahasiswa/AjukanJemput.tsx` |
| | Lacak status (timeline) | `/mhs/lacak`, `/mhs/lacak/*/:id` | `Lacak.tsx`, `DetailPesanan.tsx`, `DetailJemput.tsx` |
| | Dompet Poin & kartu dampak | `/mhs/poin`, `/mhs` | `DompetPoin.tsx`, `BerandaMahasiswa.tsx` |
| Mitra | Antrean pesanan, ubah status, unduh dokumen | `/mitra` | `features/mitra/AntreanCetak.tsx` |
| | Terima bundel (QR), input sortir, salurkan | `/mitra/bundel` | `features/mitra/BundelSortir.tsx` |
| | Kelola stok Eco-Paper | `/mitra/stok` | `features/mitra/StokEco.tsx` |
| Kurir | Tugas hari ini, peta rute, scan/ketik QR | `/kurir` | `features/kurir/TugasJemput.tsx` |
| Admin | Laporan dampak + grafik + CSV | `/admin` | `features/admin/LaporanDampak.tsx` |
| | Kelola tarif & aturan poin | `/admin/tarif` | `features/admin/TarifAturan.tsx` |
| | Kelola mitra & kurir | `/admin/mitra-kurir` | `features/admin/MitraKurir.tsx` |
| | Kelola pengguna | `/admin/pengguna` | `features/admin/Pengguna.tsx` |

**Alur status (Activity/State Diagram)**

- Pesanan: `DIAJUKAN → DIPROSES → SIAP_DIAMBIL → SELESAI` (`DIAJUKAN → DIBATALKAN` mengembalikan poin dan stok Eco).
- Jemput: `DIAJUKAN → DIPROSES` (kurir ambil tugas) `→ DIJEMPUT` (QR cocok) `→` mitra terima bundel `→ DISORTIR` (poin masuk) `→ DIPAKAI_ULANG` (lembar layak masuk stok) atau `DICACAH` (kategori rahasia).

## Struktur

```
src/
  lib/          model domain, enum, harga, dampak, format, jadwal, pdf
  data/         Repo (kontrak) + localRepo (demo) + supabaseRepo + seed
  context/      AppContext: sesi, data, aksi + toast
  components/   ui/ (tombol, badge stempel, struk, timeline, coretan), layout/, map/ (Leaflet), three/ (adegan hero R3F)
  features/     landing, auth, mahasiswa, mitra, kurir, admin, shared
supabase/migrations/   skema, RLS, fungsi RPC, storage
scripts/seed-supabase.mjs
```

## Cara menghitung dampak

- Lembar diselamatkan = lembar layak + lembar dicacah dari bundel yang sudah disortir.
- Kg tidak ke TPA = lembar × gram per lembar ÷ 1.000 (default 5 g, A4 80 gsm).
- Estimasi pohon = lembar Eco-Paper yang dicetak ÷ lembar per pohon (default 8.333). Angka ini adalah kertas baru yang tidak perlu diproduksi.
