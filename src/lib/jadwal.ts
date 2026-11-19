import type { SlotJadwal } from './types';

export const JAM_SLOT = [
  { jam: 8, label: '08.00–10.00' },
  { jam: 13, label: '13.00–15.00' },
  { jam: 16, label: '16.00–18.00' },
];

/** Slot jemput 4 hari ke depan (Minggu libur), melewati slot yang sudah lewat/kurang dari 1 jam lagi. */
export function slotTersedia(now = new Date(), hari = 4): { tanggal: Date; slot: (SlotJadwal & { habis: boolean })[] }[] {
  const out: { tanggal: Date; slot: (SlotJadwal & { habis: boolean })[] }[] = [];
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  while (out.length < hari) {
    if (d.getDay() !== 0) {
      const slot = JAM_SLOT.map((s) => {
        const m = new Date(d);
        m.setHours(s.jam, 0, 0, 0);
        return { mulai: m.toISOString(), label: s.label, habis: m.getTime() - now.getTime() < 60 * 60 * 1000 };
      });
      out.push({ tanggal: new Date(d), slot });
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function labelSlot(iso: string) {
  const d = new Date(iso);
  const s = JAM_SLOT.find((x) => x.jam === d.getHours());
  const tgl = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
  return `${tgl}, ${s?.label ?? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
}
