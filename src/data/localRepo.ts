import { TRANSISI_PESANAN } from '@/lib/constants';
import { buatKodeQR, uid } from '@/lib/format';
import { hitungHarga } from '@/lib/pricing';
import type { AnyUser, BundelKertas, Mahasiswa, Role, StatusPesanan } from '@/lib/types';
import { ambilBlob, pdfContoh, simpanBlob } from './blobStore';
import { RepoError, type DataSet, type Repo } from './repo';
import { AKUN_DEMO, buatSeed, type SeedDb } from './seed';

const KUNCI_DB = 'jkz-db-v1';
const KUNCI_SESI = 'jkz-sesi-v1';

/**
 * Implementasi Repo tanpa server (mode demo).
 * Semua aturan bisnis yang di Supabase dijalankan oleh fungsi SQL (lihat supabase/migrations)
 * di sini dijalankan ulang di TypeScript agar perilaku kedua mode sama.
 */
export function buatLocalRepo(): Repo {
  let db: SeedDb = baca();

  function baca(): SeedDb {
    try {
      const raw = localStorage.getItem(KUNCI_DB);
      if (raw) return JSON.parse(raw) as SeedDb;
    } catch {
      /* data rusak → seed ulang */
    }
    const s = buatSeed();
    try {
      localStorage.setItem(KUNCI_DB, JSON.stringify(s));
    } catch {
      /* penyimpanan diblokir: tetap jalan di memori */
    }
    return s;
  }
  function tulis() {
    try {
      localStorage.setItem(KUNCI_DB, JSON.stringify(db));
    } catch {
      /* abaikan */
    }
  }
  function sesiId(): string | null {
    try {
      return localStorage.getItem(KUNCI_SESI);
    } catch {
      return null;
    }
  }
  function aku(): AnyUser {
    const id = sesiId();
    const u = db.users.find((x) => x.id === id);
    if (!u) throw new RepoError('Sesi berakhir. Silakan masuk lagi.');
    return u;
  }
  function harus(role: Role): AnyUser {
    const u = aku();
    if (u.role !== role) throw new RepoError('Aksi ini bukan untuk peran Anda.');
    return u;
  }
  function setSesi(id: string | null) {
    try {
      if (id) localStorage.setItem(KUNCI_SESI, id);
      else localStorage.removeItem(KUNCI_SESI);
    } catch {
      /* abaikan */
    }
  }
  const tunda = <T,>(v: T) => new Promise<T>((res) => setTimeout(() => res(v), 120));
  const mhs = (id: string) => db.users.find((u) => u.id === id && u.role === 'MAHASISWA') as Mahasiswa | undefined;

  function catatPoin(mid: string, jenis: 'MASUK' | 'KELUAR', jumlah: number, keterangan: string) {
    if (jumlah <= 0) return;
    const m = mhs(mid);
    if (!m) return;
    if (jenis === 'KELUAR' && m.saldoPoin < jumlah) throw new RepoError('Saldo poin tidak cukup.');
    m.saldoPoin += jenis === 'MASUK' ? jumlah : -jumlah;
    db.transaksi.push({ id: uid('tx-'), mahasiswaId: mid, jenis, jumlah, keterangan, tanggal: new Date().toISOString() });
  }
  function stokMitra(mitraId: string) {
    let s = db.stok.find((x) => x.mitraId === mitraId);
    if (!s) {
      s = { mitraId, jumlahLembar: 0 };
      db.stok.push(s);
    }
    return s;
  }

  return {
    mode: 'demo',

    async sesi() {
      const id = sesiId();
      return tunda(db.users.find((u) => u.id === id) ?? null);
    },
    async masuk(email, password) {
      const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
      if (!u || db.passwords[u.email] !== password) throw new RepoError('Email atau kata sandi tidak cocok.');
      setSesi(u.id);
      return tunda(u);
    },
    async masukDemo(role) {
      const u = db.users.find((x) => x.email === AKUN_DEMO[role].email);
      if (!u) throw new RepoError('Akun demo tidak ditemukan. Coba reset data demo.');
      setSesi(u.id);
      return tunda(u);
    },
    async daftar(input) {
      if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) throw new RepoError('Email ini sudah terdaftar.');
      if (input.password.length < 8) throw new RepoError('Kata sandi minimal 8 karakter.');
      const u: Mahasiswa = {
        id: uid('u-'),
        role: 'MAHASISWA',
        nama: input.nama.trim(),
        email: input.email.trim(),
        npm: input.npm.trim().toUpperCase(),
        alamatKos: input.alamatKos.trim(),
        lat: input.lat,
        lng: input.lng,
        saldoPoin: 0,
      };
      db.users.push(u);
      db.passwords[u.email] = input.password;
      catatPoin(u.id, 'MASUK', 50, 'Bonus sambutan akun baru');
      tulis();
      setSesi(u.id);
      return tunda(u);
    },
    async keluar() {
      setSesi(null);
    },
    async perbaruiProfil(patch) {
      const me = aku();
      if (me.id !== patch.id && me.role !== 'ADMIN') throw new RepoError('Tidak boleh mengubah profil orang lain.');
      const u = db.users.find((x) => x.id === patch.id);
      if (!u) throw new RepoError('Pengguna tidak ditemukan.');
      const { role: _r, saldoPoin: _s, email: _e, ...aman } = patch as Partial<Mahasiswa>;
      void _r; void _s; void _e;
      Object.assign(u, aman);
      tulis();
    },

    async muat(): Promise<DataSet> {
      const { passwords: _p, ...rest } = db;
      void _p;
      return tunda(structuredClone(rest));
    },

    async ringkasanPublik() {
      const sudah = db.bundel.filter((b) => b.tanggalSortir);
      const dok = new Map(db.dokumen.map((d) => [d.id, d.jumlahHalaman]));
      return tunda({
        lembarLayak: sudah.reduce((a, b) => a + b.lembarLayak, 0),
        lembarDicacah: sudah.reduce((a, b) => a + b.lembarDicacah, 0),
        lembarEco: db.pesanan.filter((p) => p.jenisKertas === 'ECO' && p.status !== 'DIBATALKAN').reduce((a, p) => a + (dok.get(p.dokumenId) ?? 0) * p.salinan, 0),
        mahasiswa: db.users.filter((u) => u.role === 'MAHASISWA').length,
        mitra: db.users.filter((u) => u.role === 'MITRA').length,
        gramPerLembar: db.pengaturan.gramPerLembar,
        lembarPerPohon: db.pengaturan.lembarPerPohon,
        poinPerLembar: db.pengaturan.poinPerLembar,
        nilaiPoinRupiah: db.pengaturan.nilaiPoinRupiah,
        tarif: db.tarif,
      });
    },

    async unggahDokumen(file, jumlahHalaman) {
      harus('MAHASISWA');
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new RepoError('Hanya berkas PDF yang diterima.');
      const id = uid('dok-');
      await simpanBlob(id, file);
      const d = { id, namaFile: file.name, url: `idb://${id}`, jumlahHalaman };
      db.dokumen.push(d);
      tulis();
      return d;
    },

    async buatPesanan(input) {
      const me = harus('MAHASISWA') as Mahasiswa;
      const m = mhs(me.id)!;
      const dok = db.dokumen.find((d) => d.id === input.dokumenId);
      if (!dok) throw new RepoError('Dokumen belum terunggah.');
      if (!db.users.some((u) => u.id === input.mitraId && u.role === 'MITRA')) throw new RepoError('Mitra tidak valid.');
      if (input.salinan < 1 || input.salinan > 50) throw new RepoError('Jumlah salinan 1–50.');
      const h = hitungHarga({ ...input, jumlahHalaman: dok.jumlahHalaman }, db.tarif, db.pengaturan, m.saldoPoin);
      if (input.jenisKertas === 'ECO') {
        const s = stokMitra(input.mitraId);
        if (s.jumlahLembar < h.lembar) throw new RepoError(`Stok Eco-Paper mitra ini tinggal ${s.jumlahLembar} lembar.`);
        s.jumlahLembar -= h.lembar;
      }
      const p = {
        id: uid('pc-'),
        mahasiswaId: me.id,
        mitraId: input.mitraId,
        dokumenId: dok.id,
        jenisKertas: input.jenisKertas,
        warna: input.warna,
        jilid: input.jilid,
        salinan: input.salinan,
        totalHarga: h.total,
        poinDipakai: h.poinDipakai,
        status: 'DIAJUKAN' as const,
        createdAt: new Date().toISOString(),
      };
      catatPoin(me.id, 'KELUAR', h.poinDipakai, `Potongan cetak #${p.id.slice(3, 11).toUpperCase()} — ${dok.namaFile}`);
      db.pesanan.push(p);
      tulis();
      return tunda(p);
    },

    async ajukanJemput(input) {
      const me = harus('MAHASISWA');
      if (input.estimasiLembar < 10) throw new RepoError('Minimal 10 lembar agar kurir berangkat.');
      if (new Date(input.jadwal).getTime() < Date.now() - 60 * 60 * 1000) throw new RepoError('Slot jadwal sudah lewat.');
      const id = uid('pj-');
      let fotoUrl: string | null = null;
      if (input.foto) {
        await simpanBlob(`foto-${id}`, input.foto);
        fotoUrl = `idb://foto-${id}`;
      }
      const j = {
        id,
        mahasiswaId: me.id,
        kurirId: null,
        estimasiLembar: Math.round(input.estimasiLembar),
        kategori: input.kategori,
        jadwal: input.jadwal,
        status: 'DIAJUKAN' as const,
        kodeQR: buatKodeQR(),
        fotoUrl,
        createdAt: new Date().toISOString(),
      };
      db.jemput.push(j);
      tulis();
      return tunda(j);
    },

    async batalkanJemput(id) {
      const me = aku();
      const j = db.jemput.find((x) => x.id === id);
      if (!j) throw new RepoError('Permintaan tidak ditemukan.');
      if (me.role === 'MAHASISWA' && j.mahasiswaId !== me.id) throw new RepoError('Bukan permintaan Anda.');
      if (!['DIAJUKAN', 'DIPROSES'].includes(j.status)) throw new RepoError('Permintaan yang sudah dijemput tidak bisa dibatalkan.');
      j.status = 'DIBATALKAN';
      tulis();
    },

    async ubahStatusPesanan(id, status: StatusPesanan) {
      const me = aku();
      const p = db.pesanan.find((x) => x.id === id);
      if (!p) throw new RepoError('Pesanan tidak ditemukan.');
      const bolehMahasiswaBatal = me.role === 'MAHASISWA' && p.mahasiswaId === me.id && status === 'DIBATALKAN';
      if (!(me.role === 'MITRA' && p.mitraId === me.id) && !bolehMahasiswaBatal && me.role !== 'ADMIN') throw new RepoError('Anda tidak berhak mengubah pesanan ini.');
      if (!TRANSISI_PESANAN[p.status].includes(status)) throw new RepoError(`Status tidak bisa berpindah dari ${p.status} ke ${status}.`);
      if (status === 'DIBATALKAN') {
        catatPoin(p.mahasiswaId, 'MASUK', p.poinDipakai, `Pengembalian poin — pesanan #${p.id.slice(3, 11).toUpperCase()} dibatalkan`);
        if (p.jenisKertas === 'ECO') {
          const dok = db.dokumen.find((d) => d.id === p.dokumenId);
          stokMitra(p.mitraId).jumlahLembar += (dok?.jumlahHalaman ?? 0) * p.salinan;
        }
      }
      p.status = status;
      tulis();
    },

    async urlDokumen(dokumenId) {
      const d = db.dokumen.find((x) => x.id === dokumenId);
      if (!d) throw new RepoError('Dokumen tidak ditemukan.');
      const blob = d.url.startsWith('idb://') ? await ambilBlob(d.url.slice(6)) : pdfContoh(d.namaFile);
      if (!blob) throw new RepoError('Berkas tidak tersedia di peramban ini.');
      return URL.createObjectURL(blob);
    },

    async terimaBundel(kodeQR) {
      const me = harus('MITRA');
      const kode = kodeQR.trim().toUpperCase();
      const j = db.jemput.find((x) => x.kodeQR === kode);
      if (!j) throw new RepoError('Kode QR tidak dikenal.');
      if (j.status !== 'DIJEMPUT') throw new RepoError('Bundel ini belum dijemput kurir atau sudah diproses.');
      if (db.bundel.some((b) => b.permintaanJemputId === j.id)) throw new RepoError('Bundel ini sudah dikonfirmasi diterima.');
      const b: BundelKertas = { id: uid('bk-'), permintaanJemputId: j.id, mitraId: me.id, lembarLayak: 0, lembarDicacah: 0, tanggalSortir: null };
      db.bundel.push(b);
      tulis();
      return tunda(b);
    },

    async simpanSortir(bundelId, layak, cacah) {
      const me = harus('MITRA');
      const b = db.bundel.find((x) => x.id === bundelId && x.mitraId === me.id);
      if (!b) throw new RepoError('Bundel tidak ditemukan.');
      if (b.tanggalSortir) throw new RepoError('Bundel ini sudah disortir.');
      const j = db.jemput.find((x) => x.id === b.permintaanJemputId)!;
      if (layak < 0 || cacah < 0 || layak + cacah === 0) throw new RepoError('Isi jumlah lembar hasil sortir.');
      if (j.kategori === 'RAHASIA' && layak > 0) throw new RepoError('Bundel berisi data pribadi wajib dicacah seluruhnya.');
      b.lembarLayak = Math.round(layak);
      b.lembarDicacah = Math.round(cacah);
      b.tanggalSortir = new Date().toISOString();
      j.status = 'DISORTIR';
      const poin = (b.lembarLayak + b.lembarDicacah) * db.pengaturan.poinPerLembar;
      catatPoin(j.mahasiswaId, 'MASUK', poin, `Setoran kertas #${j.id.slice(3, 11).toUpperCase()} — ${b.lembarLayak + b.lembarDicacah} lembar`);
      tulis();
    },

    async selesaikanBundel(bundelId) {
      const me = harus('MITRA');
      const b = db.bundel.find((x) => x.id === bundelId && x.mitraId === me.id);
      if (!b || !b.tanggalSortir) throw new RepoError('Bundel belum disortir.');
      const j = db.jemput.find((x) => x.id === b.permintaanJemputId)!;
      if (j.status !== 'DISORTIR') throw new RepoError('Bundel sudah diselesaikan.');
      if (j.kategori === 'AMAN') {
        stokMitra(me.id).jumlahLembar += b.lembarLayak;
        j.status = 'DIPAKAI_ULANG';
      } else {
        j.status = 'DICACAH';
      }
      tulis();
    },

    async aturStok(jumlah) {
      const me = harus('MITRA');
      if (jumlah < 0) throw new RepoError('Stok tidak boleh negatif.');
      stokMitra(me.id).jumlahLembar = Math.round(jumlah);
      tulis();
    },

    async ambilTugas(id) {
      const me = harus('KURIR');
      const j = db.jemput.find((x) => x.id === id);
      if (!j || j.status !== 'DIAJUKAN') throw new RepoError('Tugas ini sudah diambil kurir lain.');
      j.kurirId = me.id;
      j.status = 'DIPROSES';
      tulis();
    },

    async tandaiDijemput(id, kode) {
      const me = harus('KURIR');
      const j = db.jemput.find((x) => x.id === id);
      if (!j || j.kurirId !== me.id) throw new RepoError('Tugas ini bukan milik Anda.');
      if (j.status !== 'DIPROSES') throw new RepoError('Status tugas tidak sesuai.');
      if (j.kodeQR !== kode.trim().toUpperCase()) throw new RepoError('Kode QR tidak cocok dengan bundel ini.');
      j.status = 'DIJEMPUT';
      tulis();
    },

    async simpanTarif(tarif) {
      harus('ADMIN');
      if (tarif.some((t) => !(t.hargaPerLembar >= 0))) throw new RepoError('Tarif tidak valid.');
      db.tarif = tarif;
      tulis();
    },
    async simpanPengaturan(p) {
      harus('ADMIN');
      if (p.lembarPerPohon <= 0 || p.gramPerLembar <= 0 || p.nilaiPoinRupiah <= 0) throw new RepoError('Faktor konversi harus lebih dari nol.');
      db.pengaturan = p;
      tulis();
    },
    async tetapkanPeran({ email, nama, role, detail }) {
      harus('ADMIN');
      const e = email.trim().toLowerCase();
      const i = db.users.findIndex((u) => u.email.toLowerCase() === e);
      const lama = i >= 0 ? db.users[i] : null;
      const id = lama?.id ?? uid('u-');
      const dasar = { id, email: lama?.email ?? email.trim(), nama: nama.trim() || lama?.nama || email };
      let baru: AnyUser;
      if (role === 'MITRA')
        baru = { ...dasar, role, namaUsaha: String(detail.namaUsaha ?? ''), alamat: String(detail.alamat ?? ''), lat: Number(detail.lat ?? -3.7589), lng: Number(detail.lng ?? 102.2724) };
      else if (role === 'KURIR') baru = { ...dasar, role, noHp: String(detail.noHp ?? '') };
      else if (role === 'MAHASISWA')
        baru = {
          ...dasar,
          role,
          npm: String(detail.npm ?? (lama as Mahasiswa)?.npm ?? ''),
          alamatKos: String(detail.alamatKos ?? (lama as Mahasiswa)?.alamatKos ?? ''),
          lat: Number(detail.lat ?? (lama as Mahasiswa)?.lat ?? -3.7589),
          lng: Number(detail.lng ?? (lama as Mahasiswa)?.lng ?? 102.2724),
          saldoPoin: (lama as Mahasiswa)?.saldoPoin ?? 0,
        };
      else baru = { ...dasar, role: 'ADMIN' };
      if (i >= 0) db.users[i] = baru;
      else {
        db.users.push(baru);
        db.passwords[baru.email] = 'demo12345';
      }
      if (role === 'MITRA') stokMitra(id);
      tulis();
    },
  };
}

export function resetDemo() {
  try {
    localStorage.removeItem(KUNCI_DB);
    localStorage.removeItem(KUNCI_SESI);
  } catch {
    /* abaikan */
  }
}
