import { DEFAULT_PENGATURAN } from '@/lib/constants';
import { hitungHarga } from '@/lib/pricing';
import type {
  Admin,
  BundelKertas,
  Dokumen,
  Jilid,
  JenisKertas,
  Kurir,
  Mahasiswa,
  Mitra,
  PermintaanJemput,
  PesananCetak,
  Role,
  StatusPesanan,
  Tarif,
  TransaksiPoin,
  Warna,
} from '@/lib/types';
import type { DataSet } from './repo';

/** Akun demo — satu per peran. Password sama untuk mode Supabase (lihat scripts/seed-supabase.mjs). */
export const AKUN_DEMO: Record<Role, { email: string; password: string; nama: string; ket: string }> = {
  MAHASISWA: { email: 'rani@demo.jejakkertas.id', password: 'demo12345', nama: 'Rani Oktaviani', ket: 'Informatika ’22 · kos di Gg. Mawar' },
  MITRA: { email: 'cetakkilat@demo.jejakkertas.id', password: 'demo12345', nama: 'Cetak Kilat Supratman', ket: 'Jl. W.R. Supratman No. 41' },
  KURIR: { email: 'yogi@demo.jejakkertas.id', password: 'demo12345', nama: 'Yogi Saputra', ket: 'Rute Kandang Limun – Bumi Ayu' },
  ADMIN: { email: 'admin@demo.jejakkertas.id', password: 'demo12345', nama: 'Admin JejakKertas', ket: 'Pengelola tarif & laporan' },
};

export const TARIF_AWAL: Tarif[] = [
  { jenisKertas: 'BARU', warna: 'HITAM_PUTIH', hargaPerLembar: 500 },
  { jenisKertas: 'BARU', warna: 'WARNA', hargaPerLembar: 1500 },
  { jenisKertas: 'ECO', warna: 'HITAM_PUTIH', hargaPerLembar: 250 },
  { jenisKertas: 'ECO', warna: 'WARNA', hargaPerLembar: 1000 },
];

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SeedDb extends DataSet {
  passwords: Record<string, string>;
}

export function buatSeed(now = new Date()): SeedDb {
  const r = rng(20240917);
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const int = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  const hariLalu = (h: number, jam = 10) => {
    const d = new Date(now);
    d.setDate(d.getDate() - h);
    d.setHours(jam, int(0, 59), 0, 0);
    return d.toISOString();
  };
  const hariIniJam = (jam: number) => {
    const d = new Date(now);
    d.setHours(jam, 0, 0, 0);
    return d.toISOString();
  };

  const admin: Admin = { id: 'u-admin', nama: 'Admin JejakKertas', email: AKUN_DEMO.ADMIN.email, role: 'ADMIN' };

  const mitra: Mitra[] = [
    { id: 'u-mitra-1', role: 'MITRA', nama: 'Darmawan Effendi', email: AKUN_DEMO.MITRA.email, namaUsaha: 'Cetak Kilat Supratman', alamat: 'Jl. W.R. Supratman No. 41, Kandang Limun', lat: -3.7598, lng: 102.2706 },
    { id: 'u-mitra-2', role: 'MITRA', nama: 'Yuliani Sari', email: 'sinarlimun@demo.jejakkertas.id', namaUsaha: 'Fotokopi Sinar Limun', alamat: 'Gg. Kenanga II No. 7, Kandang Limun', lat: -3.7563, lng: 102.2761 },
    { id: 'u-mitra-3', role: 'MITRA', nama: 'Hendra Gunawan', email: 'rafflesia@demo.jejakkertas.id', namaUsaha: 'Rafflesia Print & Jilid', alamat: 'Jl. Raya Bumi Ayu No. 12, Bumi Ayu', lat: -3.7641, lng: 102.2783 },
  ];

  const kurir: Kurir[] = [
    { id: 'u-kurir-1', role: 'KURIR', nama: 'Yogi Saputra', email: AKUN_DEMO.KURIR.email, noHp: '0812-7345-1190' },
    { id: 'u-kurir-2', role: 'KURIR', nama: 'Siti Rahmawati', email: 'siti.kurir@demo.jejakkertas.id', noHp: '0813-6720-4471' },
  ];

  const mhsRaw: [string, string, string, number, number][] = [
    ['Rani Oktaviani', 'G1A022045', 'Kos Putri Melati, Gg. Mawar No. 3, Kandang Limun', -3.7571, 102.2742],
    ['Bagas Pratama', 'G1D021118', 'Kos Pak Usman, Jl. W.R. Supratman Gg. Durian', -3.7582, 102.2689],
    ['Dewi Lestari', 'A1C022071', 'Wisma Anggrek, Jl. Kalimantan, Kandang Limun', -3.7555, 102.2719],
    ['Fajar Ramadhan', 'D1A021034', 'Kos Hijau Gg. Sepakat, Kandang Limun', -3.7549, 102.2770],
    ['Nurul Hidayah', 'E1A022090', 'Kos Muslimah Az-Zahra, Gg. Flamboyan', -3.7593, 102.2752],
    ['Rizky Aditya', 'G1C021055', 'Kos Bu Ratna, Jl. W.R. Supratman No. 88', -3.7610, 102.2694],
    ['Anisa Febriyanti', 'C1B022013', 'Pondok Mahasiswi Kenanga, Gg. Kenanga I', -3.7566, 102.2779],
    ['Muhammad Ilham', 'F1A021087', 'Kos Putra Barokah, Jl. Raya Bumi Ayu', -3.7634, 102.2767],
  ];
  const mahasiswa: Mahasiswa[] = mhsRaw.map(([nama, npm, alamatKos, lat, lng], i) => ({
    id: `u-mhs-${i + 1}`,
    role: 'MAHASISWA',
    nama,
    npm,
    email: i === 0 ? AKUN_DEMO.MAHASISWA.email : `${nama.split(' ')[0].toLowerCase()}.${npm.toLowerCase()}@demo.jejakkertas.id`,
    alamatKos,
    lat,
    lng,
    saldoPoin: 0,
  }));

  const namaDok = [
    ['Laporan_Praktikum_Basis_Data_rev3.pdf', 24],
    ['Draf_Skripsi_Bab1-3_bimbingan.pdf', 62],
    ['Proposal_PKM-K_v2.pdf', 18],
    ['SRS_Tugas_Besar_RPL_draft.pdf', 31],
    ['Makalah_Kewirausahaan_revisi.pdf', 14],
    ['Laporan_KP_PT_Pelindo_draft2.pdf', 47],
    ['Jurnal_Review_Metodologi.pdf', 9],
    ['Laporan_Praktikum_Fisika_Dasar.pdf', 16],
    ['Draf_Skripsi_Bab4_revisi_dosen.pdf', 38],
    ['Rangkuman_UTS_Statistika.pdf', 12],
    ['Skripsi_Final_Sidang.pdf', 96],
    ['Poster_Seminar_Hasil.pdf', 1],
  ] as const;

  const dokumen: Dokumen[] = [];
  const pesanan: PesananCetak[] = [];
  const transaksi: TransaksiPoin[] = [];
  const jemput: PermintaanJemput[] = [];
  const bundel: BundelKertas[] = [];
  const saldo = new Map<string, number>(mahasiswa.map((m) => [m.id, 0]));
  const p = DEFAULT_PENGATURAN;

  type Ev = { t: string; run: () => void };
  const events: Ev[] = [];

  // Bonus sambutan
  mahasiswa.forEach((m, i) => {
    const t = hariLalu(175 - i * 3, 9);
    events.push({ t, run: () => tx(m.id, 'MASUK', 50, 'Bonus sambutan akun baru', t) });
  });

  let txN = 0;
  function tx(mid: string, jenis: 'MASUK' | 'KELUAR', jumlah: number, ket: string, t: string) {
    if (jumlah <= 0) return;
    saldo.set(mid, (saldo.get(mid) ?? 0) + (jenis === 'MASUK' ? jumlah : -jumlah));
    transaksi.push({ id: `tx-${++txN}`, mahasiswaId: mid, jenis, jumlah, keterangan: ket, tanggal: t });
  }

  // — Riwayat pesanan cetak (6 bulan terakhir)
  let pN = 0;
  function pesan(mIdx: number, hari: number, status: StatusPesanan, opts?: Partial<{ dok: number; jenis: JenisKertas; warna: Warna; jilid: Jilid; salinan: number; mitra: number; jam: number; pakaiPoin: boolean }>) {
    const m = mahasiswa[mIdx];
    const di = opts?.dok ?? int(0, namaDok.length - 1);
    const [nf, hal] = namaDok[di];
    const id = `pc-${++pN}`;
    const d: Dokumen = { id: `dok-${pN}`, namaFile: nf, url: `seed://${nf}`, jumlahHalaman: hal };
    const jenis = opts?.jenis ?? (nf.includes('Final') || nf.includes('Poster') ? 'BARU' : r() < 0.72 ? 'ECO' : 'BARU');
    const warna = opts?.warna ?? (nf.includes('Poster') ? 'WARNA' : r() < 0.12 ? 'WARNA' : 'HITAM_PUTIH');
    const jilid = opts?.jilid ?? (hal > 40 ? pick<Jilid>(['LAKBAN', 'SPIRAL']) : hal > 10 ? pick<Jilid>(['STAPLES', 'TANPA', 'STAPLES']) : 'TANPA');
    const salinan = opts?.salinan ?? (r() < 0.8 ? 1 : 2);
    const t = hariLalu(hari, opts?.jam ?? int(8, 20));
    events.push({
      t,
      run: () => {
        const sp = saldo.get(m.id) ?? 0;
        const ingin = opts?.pakaiPoin === false ? 0 : r() < 0.35 ? Math.floor(sp * 0.4) : 0;
        const h = hitungHarga({ jumlahHalaman: hal, salinan, jenisKertas: jenis, warna, jilid, poinDipakai: ingin }, TARIF_AWAL, p, sp);
        dokumen.push(d);
        pesanan.push({
          id,
          mahasiswaId: m.id,
          mitraId: mitra[opts?.mitra ?? (r() < 0.55 ? 0 : r() < 0.6 ? 1 : 2)].id,
          dokumenId: d.id,
          jenisKertas: jenis,
          warna,
          jilid,
          salinan,
          totalHarga: h.total,
          poinDipakai: h.poinDipakai,
          status,
          createdAt: t,
        });
        tx(m.id, 'KELUAR', h.poinDipakai, `Potongan cetak #${id.toUpperCase()} — ${nf}`, t);
      },
    });
  }

  for (let i = 0; i < 34; i++) {
    const hari = int(3, 170);
    pesan(int(0, mahasiswa.length - 1), hari, r() < 0.06 ? 'DIBATALKAN' : 'SELESAI');
  }
  // Pesanan aktif — untuk demo mahasiswa & antrean mitra
  pesan(0, 0, 'DIAJUKAN', { dok: 0, mitra: 0, jenis: 'ECO', jilid: 'STAPLES', pakaiPoin: false, jam: Math.max(7, now.getHours() - 1) });
  pesan(0, 1, 'DIPROSES', { dok: 1, mitra: 0, jenis: 'ECO', jilid: 'LAKBAN', pakaiPoin: false });
  pesan(0, 2, 'SIAP_DIAMBIL', { dok: 3, mitra: 1, jenis: 'ECO', jilid: 'STAPLES', pakaiPoin: false });
  pesan(2, 0, 'DIAJUKAN', { dok: 4, mitra: 0, jam: Math.max(7, now.getHours() - 2) });
  pesan(3, 0, 'DIAJUKAN', { dok: 10, mitra: 0, jenis: 'BARU', jilid: 'SPIRAL', jam: Math.max(7, now.getHours() - 3), pakaiPoin: false });
  pesan(5, 1, 'DIPROSES', { dok: 5, mitra: 0, jenis: 'ECO', jilid: 'LAKBAN' });
  pesan(6, 1, 'SIAP_DIAMBIL', { dok: 11, mitra: 0, jenis: 'BARU', warna: 'WARNA', pakaiPoin: false });
  pesan(4, 0, 'DIAJUKAN', { dok: 7, mitra: 1 });

  // — Penjemputan kertas bekas
  let jN = 0;
  let bN = 0;
  const kode = () => {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const b = () => Array.from({ length: 4 }, () => abc[Math.floor(r() * abc.length)]).join('');
    return `JKZ-${b()}-${b()}`;
  };
  function jemputSelesai(mIdx: number, hari: number, kategori: 'AMAN' | 'RAHASIA') {
    const m = mahasiswa[mIdx];
    const est = pick([40, 60, 80, 120, 150, 200, 250, 300]);
    const id = `pj-${++jN}`;
    const tAju = hariLalu(hari + 2, int(8, 21));
    const tJadwal = hariLalu(hari, pick([8, 13, 16]));
    const tSortir = hariLalu(Math.max(0, hari - 1), 15);
    const mi = r() < 0.5 ? 0 : r() < 0.6 ? 1 : 2;
    const layak = kategori === 'RAHASIA' ? 0 : Math.round(est * (0.7 + r() * 0.25));
    const cacah = kategori === 'RAHASIA' ? Math.round(est * (0.9 + r() * 0.15)) : Math.round(est * (0.04 + r() * 0.1));
    events.push({
      t: tSortir,
      run: () => {
        jemput.push({ id, mahasiswaId: m.id, kurirId: kurir[r() < 0.6 ? 0 : 1].id, estimasiLembar: est, kategori, jadwal: tJadwal, status: kategori === 'RAHASIA' ? 'DICACAH' : 'DIPAKAI_ULANG', kodeQR: kode(), createdAt: tAju });
        bundel.push({ id: `bk-${++bN}`, permintaanJemputId: id, mitraId: mitra[mi].id, lembarLayak: layak, lembarDicacah: cacah, tanggalSortir: tSortir });
        tx(m.id, 'MASUK', (layak + cacah) * p.poinPerLembar, `Setoran kertas ${kategori === 'RAHASIA' ? '(dicacah)' : ''} #${id.toUpperCase()} — ${layak + cacah} lembar`.replace('  ', ' '), tSortir);
      },
    });
  }
  for (let i = 0; i < 30; i++) jemputSelesai(int(0, mahasiswa.length - 1), int(3, 172), r() < 0.25 ? 'RAHASIA' : 'AMAN');
  jemputSelesai(0, 12, 'AMAN');
  jemputSelesai(0, 40, 'RAHASIA');

  // Jemput aktif hari ini (untuk kurir & mitra)
  const aktif: [number, number, 'AMAN' | 'RAHASIA', PermintaanJemput['status'], string | null, number][] = [
    [0, 80, 'AMAN', 'DIAJUKAN', null, 13],
    [1, 150, 'AMAN', 'DIAJUKAN', null, 13],
    [3, 60, 'RAHASIA', 'DIAJUKAN', null, 16],
    [4, 200, 'AMAN', 'DIPROSES', kurir[0].id, 8],
    [6, 120, 'AMAN', 'DIJEMPUT', kurir[0].id, 8],
    [2, 90, 'RAHASIA', 'DIPROSES', kurir[1].id, 16],
  ];
  for (const [mi, est, kat, st, kid, jam] of aktif) {
    const id = `pj-${++jN}`;
    const t = hariLalu(1, 20);
    events.push({ t, run: () => jemput.push({ id, mahasiswaId: mahasiswa[mi].id, kurirId: kid, estimasiLembar: est, kategori: kat, jadwal: hariIniJam(jam), status: st, kodeQR: kode(), createdAt: t }) });
  }
  // Satu bundel sudah diterima mitra 1 tapi belum disortir, satu lagi sudah disortir menunggu diselesaikan
  {
    const id = `pj-${++jN}`;
    const t = hariLalu(2, 19);
    events.push({ t, run: () => {
      jemput.push({ id, mahasiswaId: mahasiswa[5].id, kurirId: kurir[0].id, estimasiLembar: 140, kategori: 'AMAN', jadwal: hariLalu(1, 13), status: 'DIJEMPUT', kodeQR: kode(), createdAt: t });
      bundel.push({ id: `bk-${++bN}`, permintaanJemputId: id, mitraId: mitra[0].id, lembarLayak: 0, lembarDicacah: 0, tanggalSortir: null });
    } });
    const id2 = `pj-${++jN}`;
    const t2 = hariLalu(3, 18);
    events.push({ t: t2, run: () => {
      jemput.push({ id: id2, mahasiswaId: mahasiswa[7].id, kurirId: kurir[1].id, estimasiLembar: 100, kategori: 'AMAN', jadwal: hariLalu(2, 8), status: 'DISORTIR', kodeQR: kode(), createdAt: t2 });
      const ts = hariLalu(1, 11);
      bundel.push({ id: `bk-${++bN}`, permintaanJemputId: id2, mitraId: mitra[0].id, lembarLayak: 88, lembarDicacah: 9, tanggalSortir: ts });
      tx(mahasiswa[7].id, 'MASUK', 97 * p.poinPerLembar, `Setoran kertas #${id2.toUpperCase()} — 97 lembar`, ts);
    } });
  }
  // Rani: satu permintaan diproses kurir (agar timeline terlihat bergerak)
  {
    const id = `pj-${++jN}`;
    const t = hariLalu(0, Math.max(7, now.getHours() - 1));
    const jd = new Date(now);
    jd.setDate(jd.getDate() + 1);
    jd.setHours(8, 0, 0, 0);
    events.push({ t, run: () => jemput.push({ id, mahasiswaId: mahasiswa[0].id, kurirId: null, estimasiLembar: 45, kategori: 'RAHASIA', jadwal: jd.toISOString(), status: 'DIAJUKAN', kodeQR: kode(), createdAt: t }) });
  }

  events.sort((a, b) => a.t.localeCompare(b.t)).forEach((e) => e.run());
  for (const m of mahasiswa) m.saldoPoin = saldo.get(m.id) ?? 0;

  const passwords: Record<string, string> = {};
  for (const u of [admin, ...mitra, ...kurir, ...mahasiswa]) passwords[u.email] = 'demo12345';

  return {
    users: [admin, ...mitra, ...kurir, ...mahasiswa],
    dokumen,
    pesanan,
    jemput,
    bundel,
    stok: [
      { mitraId: mitra[0].id, jumlahLembar: 1240 },
      { mitraId: mitra[1].id, jumlahLembar: 860 },
      { mitraId: mitra[2].id, jumlahLembar: 410 },
    ],
    transaksi,
    tarif: TARIF_AWAL,
    pengaturan: DEFAULT_PENGATURAN,
    passwords,
  };
}
