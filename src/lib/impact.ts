import type { BundelKertas, PesananCetak, Dokumen, Pengaturan } from './types';

/**
 * Cara menghitung dampak (ditampilkan juga di halaman Laporan agar transparan):
 * - Lembar diselamatkan dari TPA = lembar layak pakai + lembar dicacah (keduanya tidak dibuang ke TPA Air Sebakul).
 * - Kg = lembar × gramPerLembar / 1000 (default 5 g per lembar A4 80gsm).
 * - Pohon = lembar kertas baru yang tidak perlu diproduksi (lembar cetak Eco-Paper) ÷ lembarPerPohon.
 */
export interface Dampak {
  lembarDiselamatkan: number;
  lembarLayak: number;
  lembarDicacah: number;
  lembarEcoDicetak: number;
  kg: number;
  pohon: number;
}

export function lembarPesanan(p: PesananCetak, dok?: Dokumen) {
  return (dok?.jumlahHalaman ?? 0) * p.salinan;
}

export function hitungDampak(
  bundel: BundelKertas[],
  pesanan: PesananCetak[],
  dokumen: Dokumen[],
  p: Pengaturan,
): Dampak {
  const sudah = bundel.filter((b) => b.tanggalSortir);
  const lembarLayak = sudah.reduce((s, b) => s + b.lembarLayak, 0);
  const lembarDicacah = sudah.reduce((s, b) => s + b.lembarDicacah, 0);
  const dokMap = new Map(dokumen.map((d) => [d.id, d]));
  const lembarEcoDicetak = pesanan
    .filter((x) => x.jenisKertas === 'ECO' && x.status !== 'DIBATALKAN')
    .reduce((s, x) => s + lembarPesanan(x, dokMap.get(x.dokumenId)), 0);
  const lembarDiselamatkan = lembarLayak + lembarDicacah;
  return {
    lembarDiselamatkan,
    lembarLayak,
    lembarDicacah,
    lembarEcoDicetak,
    kg: (lembarDiselamatkan * p.gramPerLembar) / 1000,
    pohon: lembarEcoDicetak / Math.max(1, p.lembarPerPohon),
  };
}

export interface BarisBulan {
  kunci: string;
  bulan: string;
  layak: number;
  dicacah: number;
  eco: number;
  kg: number;
}

export function dampakPerBulan(
  bundel: BundelKertas[],
  pesanan: PesananCetak[],
  dokumen: Dokumen[],
  p: Pengaturan,
  jumlahBulan = 6,
  now = new Date(),
): BarisBulan[] {
  const rows: BarisBulan[] = [];
  for (let i = jumlahBulan - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    rows.push({
      kunci: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      bulan: d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
      layak: 0,
      dicacah: 0,
      eco: 0,
      kg: 0,
    });
  }
  const idx = new Map(rows.map((r) => [r.kunci, r]));
  const key = (iso: string) => iso.slice(0, 7);
  for (const b of bundel) {
    if (!b.tanggalSortir) continue;
    const r = idx.get(key(b.tanggalSortir));
    if (!r) continue;
    r.layak += b.lembarLayak;
    r.dicacah += b.lembarDicacah;
  }
  const dokMap = new Map(dokumen.map((d) => [d.id, d]));
  for (const x of pesanan) {
    if (x.jenisKertas !== 'ECO' || x.status === 'DIBATALKAN') continue;
    const r = idx.get(key(x.createdAt));
    if (r) r.eco += lembarPesanan(x, dokMap.get(x.dokumenId));
  }
  for (const r of rows) r.kg = Math.round(((r.layak + r.dicacah) * p.gramPerLembar) / 100) / 10;
  return rows;
}

export function keCSV(rows: Record<string, string | number>[]): string {
  if (!rows.length) return '';
  const head = Object.keys(rows[0]);
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [head.join(','), ...rows.map((r) => head.map((h) => esc(r[h])).join(','))].join('\n');
}

export function unduhFile(nama: string, isi: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['﻿' + isi], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nama;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
