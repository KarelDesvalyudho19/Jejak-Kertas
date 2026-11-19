import type { Jilid, JenisKertas, Pengaturan, Tarif, Warna } from './types';

export interface InputHarga {
  jumlahHalaman: number;
  salinan: number;
  jenisKertas: JenisKertas;
  warna: Warna;
  jilid: Jilid;
  poinDipakai: number;
}

export interface RincianHarga {
  lembar: number;
  hargaPerLembar: number;
  biayaCetak: number;
  biayaJilid: number;
  subtotal: number;
  maksPoin: number;
  poinDipakai: number;
  potongan: number;
  total: number;
}

export function cariTarif(tarif: Tarif[], jenis: JenisKertas, warna: Warna): number {
  return tarif.find((t) => t.jenisKertas === jenis && t.warna === warna)?.hargaPerLembar ?? 0;
}

/**
 * Hitung harga pesanan cetak. Dicetak satu sisi (Eco-Paper memang hanya punya satu sisi kosong),
 * jadi jumlah lembar = halaman × salinan.
 */
export function hitungHarga(input: InputHarga, tarif: Tarif[], p: Pengaturan, saldoPoin: number): RincianHarga {
  const lembar = Math.max(0, input.jumlahHalaman) * Math.max(1, input.salinan);
  const hargaPerLembar = cariTarif(tarif, input.jenisKertas, input.warna);
  const biayaCetak = lembar * hargaPerLembar;
  const biayaJilid = lembar > 0 ? (p.biayaJilid[input.jilid] ?? 0) * Math.max(1, input.salinan) : 0;
  const subtotal = biayaCetak + biayaJilid;
  const batasRupiah = Math.floor((subtotal * p.maksPotonganPersen) / 100);
  const maksPoin = Math.max(0, Math.min(saldoPoin, Math.floor(batasRupiah / p.nilaiPoinRupiah)));
  const poinDipakai = Math.max(0, Math.min(Math.floor(input.poinDipakai), maksPoin));
  const potongan = poinDipakai * p.nilaiPoinRupiah;
  return {
    lembar,
    hargaPerLembar,
    biayaCetak,
    biayaJilid,
    subtotal,
    maksPoin,
    poinDipakai,
    potongan,
    total: subtotal - potongan,
  };
}
