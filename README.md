# JejakKertas-Zero

Aplikasi untuk mahasiswa di sekitar Universitas Bengkulu (Kandang Limun, Jl. W.R. Supratman). Tujuannya sederhana: kertas yang masih punya sisi kosong dipakai lagi, dan kertas yang sudah tidak bisa dipakai didaur ulang.

Dibuat sebagai Tugas Besar mata kuliah Proyek Rekayasa Perangkat Lunak.

## Apa yang bisa dilakukan

- **Cetak di kertas bekas (Eco-Paper).** Draf, bahan bimbingan, dan latihan bisa dicetak di sisi kosong kertas bekas yang sudah disortir. Untuk berkas final, tetap pakai kertas baru.
- **Kertas dijemput dari kos.** Mahasiswa mengajukan jemput, kurir datang dan memindai kode QR, lalu kertas dibawa ke mitra percetakan untuk disortir.
- **Data pribadi dicacah.** Kertas yang berisi data pribadi (KRS, KHS, KTP, slip UKT, dan sejenisnya) harus dicacah sampai habis dan tidak boleh masuk stok lagi. Aturan ini dijaga di tampilan, di penyimpanan lokal, dan di database.
- **Poin.** Setiap lembar yang berhasil disortir menjadi poin. Poin bisa dipakai untuk potongan harga cetak, dan riwayatnya tercatat seperti buku tabungan.
- **Dampak yang bisa dihitung.** Aplikasi menunjukkan berapa lembar yang diselamatkan, berapa kilogram sampah yang tidak masuk TPA Air Sebakul, dan perkiraan pohon yang tidak perlu ditebang. Admin bisa mengubah angka konversinya dan mengunduh datanya sebagai CSV.

### Siapa yang memakai

| Peran | Untuk apa |
|---|---|
| Mahasiswa | Pesan cetak, ajukan jemput kertas, lacak pesanan, lihat poin |
| Mitra percetakan | Atur antrean cetak, terima bundel kertas, sortir, kelola stok Eco-Paper |
| Kurir | Lihat tugas jemput hari ini, lihat peta rute, pindai QR |
| Admin | Lihat laporan dampak, atur tarif dan aturan poin, kelola mitra, kurir, dan pengguna |

## Menjalankan di komputer sendiri

Pastikan Node.js sudah terpasang. Lalu di folder proyek, jalankan:

```bash
npm install
npm run dev
```

Buka alamat yang muncul di terminal (biasanya `http://localhost:5173`).

Kalau Supabase belum diatur (lihat bagian berikutnya), aplikasi berjalan dalam **mode demo**. Data contoh dibuat otomatis dan disimpan di peramban. Di halaman **Masuk**, pilih salah satu akun demo:

| Peran | Email | Kata sandi |
|---|---|---|
| Mahasiswa | rani@demo.jejakkertas.id | demo12345 |
| Mitra Percetakan | cetakkilat@demo.jejakkertas.id | demo12345 |
| Kurir | yogi@demo.jejakkertas.id | demo12345 |
| Admin | admin@demo.jejakkertas.id | demo12345 |

Tombol **Reset data demo** di halaman Masuk mengembalikan data contoh ke kondisi awal. Data demo hanya ada di peramban yang dipakai, jadi tidak ikut ke komputer lain.

## Memakai Supabase (database online)

Supabase adalah layanan database dan login online. Bagian ini untuk orang yang mengurus database bersama.

1. Buat proyek baru di Supabase, lalu jalankan isi file `supabase/migrations/20261118000000_skema_awal.sql` di SQL Editor (atau pakai `supabase db push`). File ini membuat tabel, aturan akses (RLS), fungsi RPC, dan dua bucket Storage: `dokumen` dan `foto-jemput`.
2. Salin `.env.example` menjadi `.env`, lalu isi:
   - `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari pengaturan API proyek.
   - `SUPABASE_SERVICE_ROLE_KEY`, khusus untuk mengisi data contoh. Kunci ini sangat rahasia: jangan dibagikan dan jangan di-commit.
3. Isi data contoh beserta 4 akun demo:
   ```bash
   npm run seed:supabase
   ```
4. Jalankan `npm run dev`. Aplikasi otomatis memakai Supabase kalau kedua variabel `VITE_` sudah terisi.

Di mode Supabase, pendaftaran publik hanya untuk mahasiswa. Mitra dan kurir mendaftar dulu, lalu admin menetapkan perannya lewat **Admin → Mitra & Kurir** atau **Admin → Pengguna**.

## Deploy ke Vercel

Impor repositori ini di Vercel dengan framework **Vite**. Build command `npm run build`, output `dist`.

Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di Environment Variables. Kalau ingin deploy mode demo, biarkan kosong. File `vercel.json` sudah berisi aturan rewrite untuk aplikasi satu halaman (SPA).

## Cara menghitung dampak

- **Lembar diselamatkan** = lembar layak + lembar dicacah dari bundel yang sudah disortir.
- **Kg tidak ke TPA** = lembar × gram per lembar ÷ 1.000. Default: 5 gram per lembar (A4 80 gsm).
- **Estimasi pohon** = lembar Eco-Paper yang dicetak ÷ lembar per pohon. Default: 8.333 lembar per pohon. Angka ini adalah kertas baru yang tidak perlu diproduksi.

## Untuk pengembang: keterlacakan ke desain UML

**Class diagram ke kode**

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

Enum status (`StatusPesanan`, `StatusJemput`, `KategoriKerahasiaan`, dan lainnya) sama persis di TypeScript dan Postgres. Label dan warna badge didefinisikan di `src/lib/constants.ts`.

**Use case ke halaman**

| Aktor | Use case | Rute | Berkas |
|---|---|---|---|
| Mahasiswa | Daftar / Masuk / Profil | `/daftar`, `/masuk`, `/mhs/profil` | `features/auth/*`, `features/mahasiswa/Profil.tsx` |
| | Pesan cetak (pdf.js, harga langsung, poin) | `/mhs/cetak` | `features/mahasiswa/PesanCetak.tsx` |
| | Ajukan jemput (slot, foto, kerahasiaan, QR) | `/mhs/jemput` | `features/mahasiswa/AjukanJemput.tsx` |
| | Lacak status (timeline) | `/mhs/lacak`, `/mhs/lacak/*/:id` | `Lacak.tsx`, `DetailPesanan.tsx`, `DetailJemput.tsx` |
| | Dompet poin & kartu dampak | `/mhs/poin`, `/mhs` | `DompetPoin.tsx`, `BerandaMahasiswa.tsx` |
| Mitra | Antrean pesanan, ubah status, unduh dokumen | `/mitra` | `features/mitra/AntreanCetak.tsx` |
| | Terima bundel (QR), input sortir, salurkan | `/mitra/bundel` | `features/mitra/BundelSortir.tsx` |
| | Kelola stok Eco-Paper | `/mitra/stok` | `features/mitra/StokEco.tsx` |
| Kurir | Tugas hari ini, peta rute, pindai/ketik QR | `/kurir` | `features/kurir/TugasJemput.tsx` |
| Admin | Laporan dampak, grafik, CSV | `/admin` | `features/admin/LaporanDampak.tsx` |
| | Kelola tarif & aturan poin | `/admin/tarif` | `features/admin/TarifAturan.tsx` |
| | Kelola mitra & kurir | `/admin/mitra-kurir` | `features/admin/MitraKurir.tsx` |
| | Kelola pengguna | `/admin/pengguna` | `features/admin/Pengguna.tsx` |

**Alur status (activity/state diagram)**

- Pesanan: `DIAJUKAN → DIPROSES → SIAP_DIAMBIL → SELESAI`. Jika `DIAJUKAN → DIBATALKAN`, poin dan stok Eco dikembalikan.
- Jemput: `DIAJUKAN → DIPROSES` (kurir mengambil tugas) `→ DIJEMPUT` (QR cocok) `→` mitra menerima bundel `→ DISORTIR` (poin masuk) `→ DIPAKAI_ULANG` (lembar layak masuk stok) atau `DICACAH` (kategori rahasia).

## Struktur folder

```
src/
  lib/          model domain, enum, harga, dampak, format, jadwal, pdf
  data/         Repo (kontrak) + localRepo (demo) + supabaseRepo + seed
  context/      AppContext: sesi, data, aksi, dan toast
  components/   ui/ (tombol, stempel, struk, timeline, coretan), layout/, map/ (Leaflet), three/ (adegan hero R3F)
  features/     landing, auth, mahasiswa, mitra, kurir, admin, shared
supabase/migrations/   skema, RLS, fungsi RPC, storage
scripts/seed-supabase.mjs
```
