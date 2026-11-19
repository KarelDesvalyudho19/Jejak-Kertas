#!/usr/bin/env node
/**
 * Isi proyek Supabase dengan data contoh yang SAMA dengan mode demo (src/data/seed.ts),
 * termasuk 4 akun demo (kata sandi: demo12345).
 *
 * Pakai:
 *   1. Jalankan migrasi supabase/migrations/*.sql (SQL editor atau `supabase db push`).
 *   2. Isi VITE_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env
 *   3. npm run seed:supabase            (tambah --force untuk mengisi walau tabel sudah berisi)
 *
 * Service role key melewati RLS — jangan pernah dipakai di frontend.
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'vite';

if (existsSync('.env')) {
  for (const baris of readFileSync('.env', 'utf8').split('\n')) {
    const m = baris.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
const URL_SB = process.env.VITE_SUPABASE_URL;
const KUNCI = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_SB || !KUNCI) {
  console.error('Isi VITE_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env terlebih dahulu.');
  process.exit(1);
}
const sb = createClient(URL_SB, KUNCI, { auth: { persistSession: false, autoRefreshToken: false } });
const cek = (r, apa) => {
  if (r.error) throw new Error(`${apa}: ${r.error.message}`);
  return r.data;
};

// Muat generator seed TypeScript lewat Vite (alias @/ ikut terbaca)
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] } });
const { buatSeed } = await vite.ssrLoadModule('/src/data/seed.ts');
await vite.close();
const s = buatSeed(new Date());

const { count } = await sb.from('pesanan_cetak').select('id', { count: 'exact', head: true });
if (count && !process.argv.includes('--force')) {
  console.error(`Tabel pesanan_cetak sudah berisi ${count} baris. Jalankan dengan --force bila tetap ingin menambah.`);
  process.exit(1);
}

// 1. Akun Auth
console.log('• Membuat akun…');
const idMap = new Map();
let semua = [];
for (let page = 1; ; page++) {
  const { data } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
  semua = semua.concat(data?.users ?? []);
  if (!data || data.users.length < 1000) break;
}
for (const u of s.users) {
  const lama = semua.find((x) => x.email?.toLowerCase() === u.email.toLowerCase());
  if (lama) {
    idMap.set(u.id, lama.id);
    continue;
  }
  const meta = u.role === 'MAHASISWA' ? { nama: u.nama, npm: u.npm, alamatKos: u.alamatKos, lat: u.lat, lng: u.lng } : { nama: u.nama };
  const r = cek(await sb.auth.admin.createUser({ email: u.email, password: 'demo12345', email_confirm: true, user_metadata: meta }), `akun ${u.email}`);
  idMap.set(u.id, r.user.id);
}
const uid = (id) => idMap.get(id);

// 2. Peran & profil
console.log('• Menetapkan peran…');
for (const u of s.users) {
  const id = uid(u.id);
  cek(await sb.from('users').update({ role: u.role, nama: u.nama }).eq('id', id), 'peran');
  if (u.role === 'MAHASISWA') {
    cek(await sb.from('transaksi_poin').delete().eq('mahasiswa_id', id), 'hapus bonus otomatis');
    cek(await sb.from('mahasiswa').update({ npm: u.npm, alamat_kos: u.alamatKos, lat: u.lat, lng: u.lng, saldo_poin: u.saldoPoin }).eq('user_id', id), 'mahasiswa');
  } else {
    cek(await sb.from('mahasiswa').delete().eq('user_id', id), 'hapus baris mahasiswa staf');
    if (u.role === 'MITRA') cek(await sb.from('mitra').upsert({ user_id: id, nama_usaha: u.namaUsaha, alamat: u.alamat, lat: u.lat, lng: u.lng }), 'mitra');
    if (u.role === 'KURIR') cek(await sb.from('kurir').upsert({ user_id: id, no_hp: u.noHp }), 'kurir');
  }
}
cek(await sb.from('stok_eco_paper').upsert(s.stok.map((x) => ({ mitra_id: uid(x.mitraId), jumlah_lembar: x.jumlahLembar }))), 'stok');
cek(await sb.from('tarif').upsert(s.tarif.map((t) => ({ jenis_kertas: t.jenisKertas, warna: t.warna, harga_per_lembar: t.hargaPerLembar }))), 'tarif');

// 3. Dokumen + berkas PDF contoh
console.log('• Mengunggah dokumen contoh…');
const pdf = (judul) => {
  const st = `BT /F1 14 Tf 60 760 Td (Dokumen contoh JejakKertas-Zero: ${judul.replace(/[()\\]/g, '')}) Tj ET`;
  const o = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>', `<< /Length ${st.length} >>\nstream\n${st}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>'];
  let out = '%PDF-1.4\n';
  const off = [];
  o.forEach((x, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${x}\nendobj\n`; });
  const xr = out.length;
  out += `xref\n0 ${o.length + 1}\n0000000000 65535 f \n` + off.map((n) => `${String(n).padStart(10, '0')} 00000 n \n`).join('') + `trailer\n<< /Size ${o.length + 1} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`;
  return Buffer.from(out);
};
const dokMap = new Map();
for (const p of s.pesanan) {
  const d = s.dokumen.find((x) => x.id === p.dokumenId);
  const id = randomUUID();
  const path = `${uid(p.mahasiswaId)}/seed-${id.slice(0, 8)}-${d.namaFile}`;
  cek(await sb.storage.from('dokumen').upload(path, pdf(d.namaFile), { contentType: 'application/pdf' }), 'unggah');
  cek(await sb.from('dokumen').insert({ id, pemilik_id: uid(p.mahasiswaId), nama_file: d.namaFile, url: path, jumlah_halaman: d.jumlahHalaman }), 'dokumen');
  dokMap.set(d.id, id);
}

// 4. Transaksi bisnis
console.log('• Mengisi pesanan, penjemputan, bundel, poin…');
const pesanan = s.pesanan.map((p) => ({ id: randomUUID(), mahasiswa_id: uid(p.mahasiswaId), mitra_id: uid(p.mitraId), dokumen_id: dokMap.get(p.dokumenId), jenis_kertas: p.jenisKertas, warna: p.warna, jilid: p.jilid, salinan: p.salinan, total_harga: p.totalHarga, poin_dipakai: p.poinDipakai, status: p.status, created_at: p.createdAt }));
cek(await sb.from('pesanan_cetak').insert(pesanan), 'pesanan');
const jMap = new Map(s.jemput.map((j) => [j.id, randomUUID()]));
cek(await sb.from('permintaan_jemput').insert(s.jemput.map((j) => ({ id: jMap.get(j.id), mahasiswa_id: uid(j.mahasiswaId), kurir_id: j.kurirId ? uid(j.kurirId) : null, estimasi_lembar: j.estimasiLembar, kategori: j.kategori, jadwal: j.jadwal, status: j.status, kode_qr: j.kodeQR, created_at: j.createdAt }))), 'jemput');
cek(await sb.from('bundel_kertas').insert(s.bundel.map((b) => ({ permintaan_jemput_id: jMap.get(b.permintaanJemputId), mitra_id: uid(b.mitraId), lembar_layak: b.lembarLayak, lembar_dicacah: b.lembarDicacah, tanggal_sortir: b.tanggalSortir }))), 'bundel');
cek(await sb.from('transaksi_poin').insert(s.transaksi.map((t) => ({ mahasiswa_id: uid(t.mahasiswaId), jenis: t.jenis, jumlah: t.jumlah, keterangan: t.keterangan, tanggal: t.tanggal }))), 'transaksi');

console.log(`✓ Selesai: ${s.users.length} akun, ${pesanan.length} pesanan, ${s.jemput.length} penjemputan, ${s.bundel.length} bundel.`);
console.log('  Akun demo: rani@ / cetakkilat@ / yogi@ / admin@demo.jejakkertas.id — kata sandi demo12345');
