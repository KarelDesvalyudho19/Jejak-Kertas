import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { repo, type DataSet } from '@/data';
import type { InputDaftar } from '@/data/repo';
import { useToast } from '@/components/ui/Toast';
import type { AnyUser, Mahasiswa, Mitra, Role } from '@/lib/types';

interface AppCtx {
  user: AnyUser | null;
  memuatSesi: boolean;
  data: DataSet | null;
  memuatData: boolean;
  segarkan: () => Promise<void>;
  masuk: (email: string, pw: string) => Promise<AnyUser>;
  masukDemo: (r: Role) => Promise<AnyUser>;
  daftar: (i: InputDaftar) => Promise<AnyUser>;
  keluar: () => Promise<void>;
  /** Jalankan aksi tulis → tampilkan toast → muat ulang data. Mengembalikan hasil atau null bila gagal. */
  aksi: <T>(fn: () => Promise<T>, sukses?: string) => Promise<T | null>;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [user, setUser] = useState<AnyUser | null>(null);
  const [memuatSesi, setMemuatSesi] = useState(true);
  const [data, setData] = useState<DataSet | null>(null);
  const [memuatData, setMemuatData] = useState(false);

  useEffect(() => {
    repo
      .sesi()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setMemuatSesi(false));
  }, []);

  const segarkan = useCallback(async () => {
    if (!user) return;
    setMemuatData(true);
    try {
      const d = await repo.muat();
      setData(d);
      // perbarui salinan profil (mis. saldo poin) dari data terbaru
      const baru = d.users.find((u) => u.id === user.id);
      if (baru && JSON.stringify(baru) !== JSON.stringify(user)) setUser(baru);
    } catch (e) {
      toast((e as Error).message, 'galat');
    } finally {
      setMemuatData(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) void segarkan();
    else setData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const nilai = useMemo<AppCtx>(
    () => ({
      user,
      memuatSesi,
      data,
      memuatData,
      segarkan,
      masuk: async (e, p) => {
        const u = await repo.masuk(e, p);
        setUser(u);
        return u;
      },
      masukDemo: async (r) => {
        const u = await repo.masukDemo(r);
        setUser(u);
        return u;
      },
      daftar: async (i) => {
        const u = await repo.daftar(i);
        setUser(u);
        return u;
      },
      keluar: async () => {
        await repo.keluar();
        setUser(null);
        setData(null);
      },
      aksi: async (fn, sukses) => {
        try {
          const h = await fn();
          if (sukses) toast(sukses, 'sukses');
          await segarkan();
          return h;
        } catch (e) {
          toast((e as Error).message || 'Terjadi kesalahan.', 'galat');
          return null;
        }
      },
    }),
    [user, memuatSesi, data, memuatData, segarkan, toast],
  );

  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>;
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp di luar AppProvider');
  return c;
}

/** Data siap pakai (halaman di dalam AppShell hanya dirender setelah data termuat). */
export function useData() {
  const { data, user } = useApp();
  if (!data || !user) throw new Error('Data belum siap');
  return { data, user };
}

export function useLookup() {
  const { data } = useData();
  return useMemo(() => {
    const users = new Map(data.users.map((u) => [u.id, u]));
    const dok = new Map(data.dokumen.map((d) => [d.id, d]));
    const bundelByJemput = new Map(data.bundel.map((b) => [b.permintaanJemputId, b]));
    const stok = new Map(data.stok.map((s) => [s.mitraId, s.jumlahLembar]));
    const mitra = data.users.filter((u): u is Mitra => u.role === 'MITRA');
    const mahasiswa = data.users.filter((u): u is Mahasiswa => u.role === 'MAHASISWA');
    return { users, dok, bundelByJemput, stok, mitra, mahasiswa };
  }, [data]);
}
