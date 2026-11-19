const rp = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('id-ID');
const num1 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

export const rupiah = (n: number) => rp.format(n).replace(/ /g, ' ');
export const angka = (n: number) => num.format(n);
export const angka1 = (n: number) => num1.format(n);

export function tanggal(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Date(iso).toLocaleDateString('id-ID', opts);
}

export function tanggalJam(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function hariIni(iso: string, now = new Date()) {
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function idPendek(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function uid(prefix = '') {
  const r = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix + r;
}

/** Kode QR bundel: JKZ-XXXX-XXXX (mudah diketik ulang bila kamera tidak tersedia). */
export function buatKodeQR() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const blok = () => Array.from({ length: 4 }, () => abc[Math.floor(Math.random() * abc.length)]).join('');
  return `JKZ-${blok()}-${blok()}`;
}

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}
