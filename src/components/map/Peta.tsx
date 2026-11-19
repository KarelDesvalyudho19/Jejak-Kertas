import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { PUSAT_UNIB } from '@/lib/constants';
import { cn } from '@/lib/format';

const TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATRIBUSI = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

type JenisPin = 'kos' | 'mitra' | 'kampus' | 'tugas' | 'selesai';

/** Pin peta bergaya label kertas — divIcon agar tidak bergantung pada gambar marker bawaan Leaflet. */
export function pin(jenis: JenisPin, teks = '') {
  const warna = { kos: '#D33A2C', mitra: '#161513', kampus: '#C49A6C', tugas: '#D33A2C', selesai: '#2F5D50' }[jenis];
  const isi =
    jenis === 'mitra'
      ? `<svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="5" width="10" height="6" fill="none" stroke="#FBFAF6" stroke-width="1.4"/><rect x="4" y="2" width="6" height="3" fill="#FBFAF6"/></svg>`
      : jenis === 'kampus'
        ? `<svg width="14" height="14" viewBox="0 0 14 14"><path d="M1 6 7 2l6 4-6 4z" fill="#161513"/><path d="M3 8v3h8V8" fill="none" stroke="#161513" stroke-width="1.3"/></svg>`
        : `<span style="font:600 11px 'IBM Plex Mono',monospace;color:#FBFAF6">${teks}</span>`;
  return L.divIcon({
    className: 'pin-jkz',
    iconSize: [30, 40],
    iconAnchor: [15, 38],
    popupAnchor: [0, -34],
    html: `<div style="position:relative;width:30px;height:40px">
      <div style="position:absolute;left:3px;top:0;width:24px;height:24px;background:${warna};border:1.5px solid #161513;display:grid;place-items:center;box-shadow:2px 2px 0 rgba(22,21,19,.35);transform:rotate(-3deg)">${isi}</div>
      <div style="position:absolute;left:14px;top:24px;width:1.5px;height:14px;background:#161513"></div>
      <div style="position:absolute;left:11px;top:35px;width:8px;height:3px;border-radius:50%;background:rgba(22,21,19,.3)"></div>
    </div>`,
  });
}

function KlikPeta({ onPilih }: { onPilih: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPilih(e.latlng.lat, e.latlng.lng) });
  return null;
}

function SesuaikanBatas({ titik }: { titik: [number, number][] }) {
  const map = useMap();
  const kunci = JSON.stringify(titik);
  useEffect(() => {
    if (titik.length > 1) map.fitBounds(L.latLngBounds(titik), { padding: [36, 36], maxZoom: 16 });
    else if (titik.length === 1) map.setView(titik[0], 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunci]);
  return null;
}

/** Pemilih titik lokasi kos — klik peta atau geser pin. */
export function PemilihLokasi({ lat, lng, onChange, className }: { lat?: number; lng?: number; onChange: (lat: number, lng: number) => void; className?: string }) {
  const ada = typeof lat === 'number' && typeof lng === 'number' && !(lat === 0 && lng === 0);
  const pos: [number, number] = ada ? [lat!, lng!] : PUSAT_UNIB;
  const ikon = useMemo(() => pin('kos', '●'), []);
  return (
    <div className={cn('relative overflow-hidden border border-tinta/20', className)}>
      <MapContainer center={pos} zoom={16} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer url={TILE} attribution={ATRIBUSI} />
        <KlikPeta onPilih={onChange} />
        <Marker
          position={pos}
          icon={ikon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = (e.target as L.Marker).getLatLng();
              onChange(p.lat, p.lng);
            },
          }}
        />
        <Marker position={PUSAT_UNIB} icon={pin('kampus')}>
          <Tooltip direction="top" offset={[0, -32]}>Gerbang UNIB</Tooltip>
        </Marker>
      </MapContainer>
      <div className="pointer-events-none absolute bottom-2 left-2 z-[400] bg-kertas-terang/90 px-2 py-1 font-mono text-[10.5px] text-tinta-abu">
        {ada ? `${lat!.toFixed(5)}, ${lng!.toFixed(5)}` : 'Klik peta untuk menandai kos'}
      </div>
    </div>
  );
}

export interface TitikRute {
  id: string;
  lat: number;
  lng: number;
  judul: string;
  isi?: string;
  jenis: JenisPin;
  nomor?: number;
}

/** Peta rute kurir: titik berurutan dihubungkan garis putus-putus. */
export function PetaRute({ titik, garis, className, onPilih }: { titik: TitikRute[]; garis: [number, number][]; className?: string; onPilih?: (id: string) => void }) {
  const semua = titik.map((t) => [t.lat, t.lng] as [number, number]);
  return (
    <div className={cn('relative overflow-hidden border border-tinta/20', className)}>
      <MapContainer center={PUSAT_UNIB} zoom={15} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer url={TILE} attribution={ATRIBUSI} />
        <SesuaikanBatas titik={semua} />
        {garis.length > 1 && (
          <>
            <Polyline positions={garis} pathOptions={{ color: '#FBFAF6', weight: 7, opacity: 0.9 }} />
            <Polyline positions={garis} pathOptions={{ color: '#D33A2C', weight: 3, dashArray: '2 8', lineCap: 'round' }} />
          </>
        )}
        {titik.map((t) => (
          <Marker key={t.id} position={[t.lat, t.lng]} icon={pin(t.jenis, t.nomor ? String(t.nomor) : '?')} eventHandlers={{ click: () => onPilih?.(t.id) }}>
            <Popup>
              <div className="font-sans">
                <div className="font-semibold">{t.judul}</div>
                {t.isi && <div className="text-xs text-tinta-abu">{t.isi}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

/** Jarak garis lurus (km), cukup untuk mengurutkan rute di area kecil. */
export function jarakKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Urutan rute tetangga terdekat dari titik awal. */
export function urutkanRute<T extends { lat: number; lng: number }>(awal: [number, number], daftar: T[]): T[] {
  const sisa = [...daftar];
  const hasil: T[] = [];
  let kini = awal;
  while (sisa.length) {
    let iMin = 0;
    let dMin = Infinity;
    sisa.forEach((t, i) => {
      const d = jarakKm(kini, [t.lat, t.lng]);
      if (d < dMin) {
        dMin = d;
        iMin = i;
      }
    });
    const [t] = sisa.splice(iMin, 1);
    hasil.push(t);
    kini = [t.lat, t.lng];
  }
  return hasil;
}
