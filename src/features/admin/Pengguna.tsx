import { useMemo, useState } from 'react';
import { repo } from '@/data';
import { Chip, Input, Select } from '@/components/ui/Field';
import { JudulHalaman } from '@/components/ui/Paper';
import { Badge } from '@/components/ui/StatusBadge';
import { useApp, useData } from '@/context/AppContext';
import { ROLE_LABEL } from '@/lib/constants';
import { angka } from '@/lib/format';
import type { AnyUser, Role } from '@/lib/types';

const PERAN: Role[] = ['MAHASISWA', 'MITRA', 'KURIR', 'ADMIN'];

function detailDefault(u: AnyUser, ke: Role): Record<string, string | number> {
  if (ke === 'MITRA') return { namaUsaha: u.role === 'MITRA' ? u.namaUsaha : `Usaha ${u.nama}`, alamat: u.role === 'MITRA' ? u.alamat : '', lat: -3.7589, lng: 102.2724 };
  if (ke === 'KURIR') return { noHp: u.role === 'KURIR' ? u.noHp : '' };
  return {};
}

export default function Pengguna() {
  const { data, user } = useData();
  const { aksi } = useApp();
  const [cari, setCari] = useState('');
  const [peran, setPeran] = useState<Role | 'SEMUA'>('SEMUA');

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return data.users
      .filter((u) => peran === 'SEMUA' || u.role === peran)
      .filter((u) => !q || [u.nama, u.email, u.role === 'MAHASISWA' ? u.npm : '', u.role === 'MITRA' ? u.namaUsaha : ''].some((s) => s.toLowerCase().includes(q)))
      .sort((a, b) => a.role.localeCompare(b.role) || a.nama.localeCompare(b.nama));
  }, [data.users, cari, peran]);

  return (
    <>
      <JudulHalaman nomor="A4 — Pengguna" judul="Semua akun." deskripsi="Cari, saring, dan ubah peran. Peran menentukan menu yang dilihat setiap orang." />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama, email, NPM…" className="w-64" />
        <div className="flex flex-wrap gap-2">
          <Chip aktif={peran === 'SEMUA'} onClick={() => setPeran('SEMUA')} jumlah={data.users.length}>Semua</Chip>
          {PERAN.map((r) => (
            <Chip key={r} aktif={peran === r} onClick={() => setPeran(r)} jumlah={data.users.filter((u) => u.role === r).length}>
              {ROLE_LABEL[r]}
            </Chip>
          ))}
        </div>
      </div>
      <div className="kartu overflow-x-auto">
        <table className="w-full min-w-[720px] text-[14px]">
          <thead>
            <tr className="border-b border-tinta/20 text-left">
              {['Nama', 'Email', 'Detail', 'Peran', 'Ubah peran'].map((h) => (
                <th key={h} className="label-mono px-4 py-3 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {daftar.map((u) => (
              <tr key={u.id} className="border-b border-tinta/[0.07] last:border-0">
                <td className="px-4 py-2.5 font-medium">{u.nama}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-tinta-abu">{u.email}</td>
                <td className="px-4 py-2.5 text-[13px] text-tinta-abu">
                  {u.role === 'MAHASISWA' && <><span className="font-mono">{u.npm}</span> · {angka(u.saldoPoin)} poin</>}
                  {u.role === 'MITRA' && u.namaUsaha}
                  {u.role === 'KURIR' && <span className="font-mono">{u.noHp}</span>}
                </td>
                <td className="px-4 py-2.5">
                  <Badge label={ROLE_LABEL[u.role]} t={u.role === 'ADMIN' ? 'sukses' : u.role === 'MITRA' ? 'proses' : u.role === 'KURIR' ? 'kraft' : 'netral'} />
                </td>
                <td className="px-4 py-2.5">
                  <Select
                    value={u.role}
                    disabled={u.id === user.id}
                    onChange={(e) => {
                      const ke = e.target.value as Role;
                      if (!confirm(`Ubah peran ${u.nama} menjadi ${ROLE_LABEL[ke]}?`)) return;
                      aksi(() => repo.tetapkanPeran({ email: u.email, nama: u.nama, role: ke, detail: detailDefault(u, ke) }), 'Peran diperbarui.');
                    }}
                    className="w-40 text-[13px]"
                    aria-label={`Peran ${u.nama}`}
                  >
                    {PERAN.map((r) => (
                      <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                    ))}
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
