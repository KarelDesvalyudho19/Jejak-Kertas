import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_PENGATURAN } from '@/lib/constants';
import type {
  AnyUser,
  BundelKertas,
  Dokumen,
  Pengaturan,
  PermintaanJemput,
  PesananCetak,
  Role,
  StokEcoPaper,
  Tarif,
  TransaksiPoin,
} from '@/lib/types';
import { RepoError, type DataSet, type Repo } from './repo';
import { AKUN_DEMO } from './seed';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const mapPesanan = (r: Row): PesananCetak => ({
  id: r.id,
  mahasiswaId: r.mahasiswa_id,
  mitraId: r.mitra_id,
  dokumenId: r.dokumen_id,
  jenisKertas: r.jenis_kertas,
  warna: r.warna,
  jilid: r.jilid,
  salinan: r.salinan,
  totalHarga: r.total_harga,
  poinDipakai: r.poin_dipakai,
  status: r.status,
  createdAt: r.created_at,
});
const mapJemput = (r: Row): PermintaanJemput => ({
  id: r.id,
  mahasiswaId: r.mahasiswa_id,
  kurirId: r.kurir_id,
  estimasiLembar: r.estimasi_lembar,
  kategori: r.kategori,
  jadwal: r.jadwal,
  status: r.status,
  kodeQR: r.kode_qr,
  fotoUrl: r.foto_url,
  createdAt: r.created_at,
});
const mapBundel = (r: Row): BundelKertas => ({
  id: r.id,
  permintaanJemputId: r.permintaan_jemput_id,
  mitraId: r.mitra_id,
  lembarLayak: r.lembar_layak,
  lembarDicacah: r.lembar_dicacah,
  tanggalSortir: r.tanggal_sortir,
});
const mapDok = (r: Row): Dokumen => ({ id: r.id, namaFile: r.nama_file, url: r.url, jumlahHalaman: r.jumlah_halaman });
const mapTx = (r: Row): TransaksiPoin => ({ id: r.id, mahasiswaId: r.mahasiswa_id, jenis: r.jenis, jumlah: r.jumlah, keterangan: r.keterangan, tanggal: r.tanggal });
const mapStok = (r: Row): StokEcoPaper => ({ mitraId: r.mitra_id, jumlahLembar: r.jumlah_lembar });
const mapTarif = (r: Row): Tarif => ({ jenisKertas: r.jenis_kertas, warna: r.warna, hargaPerLembar: r.harga_per_lembar });
const mapCfg = (r: Row | null): Pengaturan =>
  r
    ? {
        gramPerLembar: Number(r.gram_per_lembar),
        lembarPerPohon: r.lembar_per_pohon,
        poinPerLembar: r.poin_per_lembar,
        nilaiPoinRupiah: r.nilai_poin_rupiah,
        maksPotonganPersen: r.maks_potongan_persen,
        biayaJilid: { ...DEFAULT_PENGATURAN.biayaJilid, ...(r.biaya_jilid ?? {}) },
      }
    : DEFAULT_PENGATURAN;

function gabungUser(u: Row, mhs?: Row, mit?: Row, kur?: Row): AnyUser {
  const dasar = { id: u.id, nama: u.nama, email: u.email };
  switch (u.role as Role) {
    case 'MAHASISWA':
      return { ...dasar, role: 'MAHASISWA', npm: mhs?.npm ?? '', alamatKos: mhs?.alamat_kos ?? '', lat: mhs?.lat ?? 0, lng: mhs?.lng ?? 0, saldoPoin: mhs?.saldo_poin ?? 0 };
    case 'MITRA':
      return { ...dasar, role: 'MITRA', namaUsaha: mit?.nama_usaha ?? u.nama, alamat: mit?.alamat ?? '', lat: mit?.lat ?? 0, lng: mit?.lng ?? 0 };
    case 'KURIR':
      return { ...dasar, role: 'KURIR', noHp: kur?.no_hp ?? '' };
    default:
      return { ...dasar, role: 'ADMIN' };
  }
}

function cek<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new RepoError(res.error.message.replace(/^.*?:\s(?=[A-Z])/, ''));
  return res.data;
}

export function buatSupabaseRepo(url: string, anonKey: string): Repo {
  const sb: SupabaseClient = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } });

  async function uidSaya(): Promise<string> {
    const { data } = await sb.auth.getUser();
    if (!data.user) throw new RepoError('Sesi berakhir. Silakan masuk lagi.');
    return data.user.id;
  }

  async function profil(id: string): Promise<AnyUser | null> {
    const u = cek(await sb.from('users').select('*').eq('id', id).maybeSingle());
    if (!u) return null;
    const [m, mi, k] = await Promise.all([
      sb.from('mahasiswa').select('*').eq('user_id', id).maybeSingle(),
      sb.from('mitra').select('*').eq('user_id', id).maybeSingle(),
      sb.from('kurir').select('*').eq('user_id', id).maybeSingle(),
    ]);
    return gabungUser(u, m.data ?? undefined, mi.data ?? undefined, k.data ?? undefined);
  }

  async function unggah(bucket: string, file: File): Promise<string> {
    const id = await uidSaya();
    const aman = file.name.replace(/[^\w.\-]+/g, '_');
    const path = `${id}/${Date.now()}-${aman}`;
    cek(await sb.storage.from(bucket).upload(path, file, { contentType: file.type || undefined, upsert: false }));
    return path;
  }

  return {
    mode: 'supabase',

    async sesi() {
      const { data } = await sb.auth.getSession();
      return data.session ? profil(data.session.user.id) : null;
    },
    async masuk(email, password) {
      const res = await sb.auth.signInWithPassword({ email, password });
      if (res.error) throw new RepoError(res.error.message === 'Invalid login credentials' ? 'Email atau kata sandi tidak cocok.' : res.error.message);
      const p = await profil(res.data.user.id);
      if (!p) throw new RepoError('Profil belum dibuat. Hubungi admin.');
      return p;
    },
    async masukDemo(role) {
      return this.masuk(AKUN_DEMO[role].email, AKUN_DEMO[role].password);
    },
    async daftar(input) {
      const res = await sb.auth.signUp({
        email: input.email,
        password: input.password,
        options: { data: { nama: input.nama, npm: input.npm, alamatKos: input.alamatKos, lat: input.lat, lng: input.lng } },
      });
      if (res.error) throw new RepoError(res.error.message);
      if (!res.data.session) throw new RepoError('Pendaftaran berhasil. Cek email Anda untuk konfirmasi, lalu masuk.');
      const p = await profil(res.data.user!.id);
      if (!p) throw new RepoError('Profil gagal dibuat.');
      return p;
    },
    async keluar() {
      await sb.auth.signOut();
    },
    async perbaruiProfil(patch) {
      const x = patch as Row;
      if (x.nama !== undefined) cek(await sb.from('users').update({ nama: x.nama }).eq('id', patch.id));
      if (x.npm !== undefined || x.alamatKos !== undefined || x.lat !== undefined)
        cek(await sb.from('mahasiswa').update({ npm: x.npm, alamat_kos: x.alamatKos, lat: x.lat, lng: x.lng }).eq('user_id', patch.id));
      if (x.namaUsaha !== undefined) cek(await sb.from('mitra').update({ nama_usaha: x.namaUsaha, alamat: x.alamat, lat: x.lat, lng: x.lng }).eq('user_id', patch.id));
      if (x.noHp !== undefined) cek(await sb.from('kurir').update({ no_hp: x.noHp }).eq('user_id', patch.id));
    },

    async muat(): Promise<DataSet> {
      const [u, m, mi, k, d, p, j, b, s, t, tr, c] = await Promise.all([
        sb.from('users').select('*'),
        sb.from('mahasiswa').select('*'),
        sb.from('mitra').select('*'),
        sb.from('kurir').select('*'),
        sb.from('dokumen').select('*'),
        sb.from('pesanan_cetak').select('*').order('created_at', { ascending: false }),
        sb.from('permintaan_jemput').select('*').order('jadwal', { ascending: false }),
        sb.from('bundel_kertas').select('*'),
        sb.from('stok_eco_paper').select('*'),
        sb.from('transaksi_poin').select('*').order('tanggal', { ascending: false }),
        sb.from('tarif').select('*'),
        sb.from('pengaturan').select('*').eq('id', 1).maybeSingle(),
      ]);
      const by = (rows: Row[] | null) => new Map((rows ?? []).map((r) => [r.user_id, r]));
      const mm = by(cek(m));
      const mim = by(cek(mi));
      const km = by(cek(k));
      return {
        users: (cek(u) ?? []).map((r: Row) => gabungUser(r, mm.get(r.id), mim.get(r.id), km.get(r.id))),
        dokumen: (cek(d) ?? []).map(mapDok),
        pesanan: (cek(p) ?? []).map(mapPesanan),
        jemput: (cek(j) ?? []).map(mapJemput),
        bundel: (cek(b) ?? []).map(mapBundel),
        stok: (cek(s) ?? []).map(mapStok),
        transaksi: (cek(t) ?? []).map(mapTx),
        tarif: (cek(tr) ?? []).map(mapTarif),
        pengaturan: mapCfg(cek(c)),
      };
    },

    async ringkasanPublik() {
      const [res, tr, cfg] = await Promise.all([sb.rpc('ringkasan_dampak'), sb.from('tarif').select('*'), sb.from('pengaturan').select('*').eq('id', 1).maybeSingle()]);
      const r = cek(res) as Row;
      const p = mapCfg(cek(cfg));
      return {
        poinPerLembar: p.poinPerLembar,
        nilaiPoinRupiah: p.nilaiPoinRupiah,
        tarif: (cek(tr) ?? []).map(mapTarif),
        lembarLayak: Number(r.lembarLayak),
        lembarDicacah: Number(r.lembarDicacah),
        lembarEco: Number(r.lembarEco),
        mahasiswa: Number(r.mahasiswa),
        mitra: Number(r.mitra),
        gramPerLembar: Number(r.gramPerLembar),
        lembarPerPohon: Number(r.lembarPerPohon),
      };
    },

    async unggahDokumen(file, jumlahHalaman) {
      const id = await uidSaya();
      const path = await unggah('dokumen', file);
      const row = cek(await sb.from('dokumen').insert({ pemilik_id: id, nama_file: file.name, url: path, jumlah_halaman: jumlahHalaman }).select().single());
      return mapDok(row);
    },
    async buatPesanan(i) {
      const row = cek(
        await sb.rpc('buat_pesanan', {
          p_mitra: i.mitraId,
          p_dokumen: i.dokumenId,
          p_jenis: i.jenisKertas,
          p_warna: i.warna,
          p_jilid: i.jilid,
          p_salinan: i.salinan,
          p_poin: i.poinDipakai,
        }),
      );
      return mapPesanan(row as Row);
    },
    async ajukanJemput(i) {
      const foto = i.foto ? await unggah('foto-jemput', i.foto) : null;
      const row = cek(await sb.rpc('ajukan_jemput', { p_estimasi: Math.round(i.estimasiLembar), p_kategori: i.kategori, p_jadwal: i.jadwal, p_foto_url: foto }));
      return mapJemput(row as Row);
    },
    async batalkanJemput(id) {
      cek(await sb.rpc('batalkan_jemput', { p_id: id }));
    },
    async ubahStatusPesanan(id, status) {
      cek(await sb.rpc('ubah_status_pesanan', { p_id: id, p_status: status }));
    },
    async urlDokumen(dokumenId) {
      const d = cek(await sb.from('dokumen').select('url').eq('id', dokumenId).single()) as Row;
      const s = cek(await sb.storage.from('dokumen').createSignedUrl(d.url, 60 * 10));
      return (s as { signedUrl: string }).signedUrl;
    },
    async terimaBundel(kode) {
      return mapBundel(cek(await sb.rpc('terima_bundel', { p_kode: kode })) as Row);
    },
    async simpanSortir(id, layak, cacah) {
      cek(await sb.rpc('simpan_sortir', { p_bundel: id, p_layak: Math.round(layak), p_dicacah: Math.round(cacah) }));
    },
    async selesaikanBundel(id) {
      cek(await sb.rpc('selesaikan_bundel', { p_bundel: id }));
    },
    async aturStok(n) {
      cek(await sb.rpc('atur_stok', { p_jumlah: Math.round(n) }));
    },
    async ambilTugas(id) {
      cek(await sb.rpc('ambil_tugas', { p_id: id }));
    },
    async tandaiDijemput(id, kode) {
      cek(await sb.rpc('tandai_dijemput', { p_id: id, p_kode: kode }));
    },
    async simpanTarif(tarif) {
      cek(await sb.from('tarif').upsert(tarif.map((t) => ({ jenis_kertas: t.jenisKertas, warna: t.warna, harga_per_lembar: Math.round(t.hargaPerLembar) }))));
    },
    async simpanPengaturan(p) {
      cek(
        await sb
          .from('pengaturan')
          .update({
            gram_per_lembar: p.gramPerLembar,
            lembar_per_pohon: p.lembarPerPohon,
            poin_per_lembar: p.poinPerLembar,
            nilai_poin_rupiah: p.nilaiPoinRupiah,
            maks_potongan_persen: p.maksPotonganPersen,
            biaya_jilid: p.biayaJilid,
          })
          .eq('id', 1),
      );
    },
    async tetapkanPeran({ email, nama, role, detail }) {
      cek(await sb.rpc('admin_tetapkan_peran', { p_email: email, p_nama: nama, p_role: role, p_detail: detail }));
    },
  };
}
