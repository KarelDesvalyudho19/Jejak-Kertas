-- =====================================================================
-- JejakKertas-Zero — skema database (Supabase / Postgres 15+)
-- Struktur mengikuti Class Diagram:
--   User ← Mahasiswa | Mitra | Kurir | Admin (Admin = users.role 'ADMIN')
--   Dokumen, PesananCetak, PermintaanJemput, BundelKertas,
--   StokEcoPaper, TransaksiPoin, Tarif (+ Pengaturan sistem)
-- Semua perubahan yang menyentuh poin/stok/status dilakukan lewat fungsi
-- SECURITY DEFINER agar aturan bisnis tidak bisa dilewati dari klien.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Enum (sama persis dengan src/lib/types.ts) ----------
create type peran as enum ('MAHASISWA', 'MITRA', 'KURIR', 'ADMIN');
create type jenis_kertas as enum ('BARU', 'ECO');
create type warna_cetak as enum ('HITAM_PUTIH', 'WARNA');
create type jenis_jilid as enum ('TANPA', 'STAPLES', 'LAKBAN', 'SPIRAL');
create type status_pesanan as enum ('DIAJUKAN', 'DIPROSES', 'SIAP_DIAMBIL', 'SELESAI', 'DIBATALKAN');
create type kategori_kerahasiaan as enum ('AMAN', 'RAHASIA');
create type status_jemput as enum ('DIAJUKAN', 'DIPROSES', 'DIJEMPUT', 'DISORTIR', 'DIPAKAI_ULANG', 'DICACAH', 'DIBATALKAN');
create type jenis_transaksi as enum ('MASUK', 'KELUAR');

-- ---------- Tabel ----------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  nama text not null,
  email text not null unique,
  role peran not null default 'MAHASISWA',
  created_at timestamptz not null default now()
);

create table public.mahasiswa (
  user_id uuid primary key references public.users (id) on delete cascade,
  npm text not null default '',
  alamat_kos text not null default '',
  lat double precision,
  lng double precision,
  saldo_poin integer not null default 0 check (saldo_poin >= 0)
);

create table public.mitra (
  user_id uuid primary key references public.users (id) on delete cascade,
  nama_usaha text not null,
  alamat text not null default '',
  lat double precision,
  lng double precision
);

create table public.kurir (
  user_id uuid primary key references public.users (id) on delete cascade,
  no_hp text not null default ''
);

create table public.dokumen (
  id uuid primary key default gen_random_uuid(),
  pemilik_id uuid not null references public.users (id) on delete cascade,
  nama_file text not null,
  url text not null, -- path di bucket storage 'dokumen'
  jumlah_halaman integer not null check (jumlah_halaman > 0),
  created_at timestamptz not null default now()
);

create table public.pesanan_cetak (
  id uuid primary key default gen_random_uuid(),
  mahasiswa_id uuid not null references public.mahasiswa (user_id),
  mitra_id uuid not null references public.mitra (user_id),
  dokumen_id uuid not null references public.dokumen (id),
  jenis_kertas jenis_kertas not null,
  warna warna_cetak not null,
  jilid jenis_jilid not null default 'TANPA',
  salinan integer not null check (salinan between 1 and 50),
  total_harga integer not null check (total_harga >= 0),
  poin_dipakai integer not null default 0 check (poin_dipakai >= 0),
  status status_pesanan not null default 'DIAJUKAN',
  created_at timestamptz not null default now()
);
create index on public.pesanan_cetak (mitra_id, status);
create index on public.pesanan_cetak (mahasiswa_id);

create table public.permintaan_jemput (
  id uuid primary key default gen_random_uuid(),
  mahasiswa_id uuid not null references public.mahasiswa (user_id),
  kurir_id uuid references public.kurir (user_id),
  estimasi_lembar integer not null check (estimasi_lembar >= 10),
  kategori kategori_kerahasiaan not null,
  jadwal timestamptz not null,
  status status_jemput not null default 'DIAJUKAN',
  kode_qr text not null unique,
  foto_url text,
  created_at timestamptz not null default now()
);
create index on public.permintaan_jemput (jadwal);
create index on public.permintaan_jemput (mahasiswa_id);

create table public.bundel_kertas (
  id uuid primary key default gen_random_uuid(),
  permintaan_jemput_id uuid not null unique references public.permintaan_jemput (id),
  mitra_id uuid not null references public.mitra (user_id),
  lembar_layak integer not null default 0 check (lembar_layak >= 0),
  lembar_dicacah integer not null default 0 check (lembar_dicacah >= 0),
  tanggal_sortir timestamptz
);

create table public.stok_eco_paper (
  mitra_id uuid primary key references public.mitra (user_id) on delete cascade,
  jumlah_lembar integer not null default 0 check (jumlah_lembar >= 0)
);

create table public.transaksi_poin (
  id uuid primary key default gen_random_uuid(),
  mahasiswa_id uuid not null references public.mahasiswa (user_id) on delete cascade,
  jenis jenis_transaksi not null,
  jumlah integer not null check (jumlah > 0),
  keterangan text not null,
  tanggal timestamptz not null default now()
);
create index on public.transaksi_poin (mahasiswa_id, tanggal desc);

create table public.tarif (
  jenis_kertas jenis_kertas not null,
  warna warna_cetak not null,
  harga_per_lembar integer not null check (harga_per_lembar >= 0),
  primary key (jenis_kertas, warna)
);

create table public.pengaturan (
  id smallint primary key default 1 check (id = 1),
  gram_per_lembar numeric not null default 5 check (gram_per_lembar > 0),
  lembar_per_pohon integer not null default 8333 check (lembar_per_pohon > 0),
  poin_per_lembar integer not null default 1 check (poin_per_lembar >= 0),
  nilai_poin_rupiah integer not null default 10 check (nilai_poin_rupiah > 0),
  maks_potongan_persen integer not null default 50 check (maks_potongan_persen between 0 and 100),
  biaya_jilid jsonb not null default '{"TANPA":0,"STAPLES":500,"LAKBAN":4000,"SPIRAL":10000}'
);

insert into public.tarif values
  ('BARU', 'HITAM_PUTIH', 500), ('BARU', 'WARNA', 1500),
  ('ECO', 'HITAM_PUTIH', 250), ('ECO', 'WARNA', 1000);
insert into public.pengaturan (id) values (1);

-- ---------- Fungsi bantu ----------
create or replace function public.peran_saya() returns peran
language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.gen_kode_qr() returns text
language plpgsql volatile as $$
declare abc text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; k text; i int;
begin
  loop
    k := 'JKZ-';
    for i in 1..8 loop
      k := k || substr(abc, 1 + floor(random() * 32)::int, 1);
      if i = 4 then k := k || '-'; end if;
    end loop;
    exit when not exists (select 1 from public.permintaan_jemput where kode_qr = k);
  end loop;
  return k;
end $$;

-- Dipakai internal oleh fungsi lain; tidak di-grant ke klien.
create or replace function public._catat_poin(p_mhs uuid, p_jenis jenis_transaksi, p_jumlah int, p_ket text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_jumlah <= 0 then return; end if;
  update public.mahasiswa
     set saldo_poin = saldo_poin + case when p_jenis = 'MASUK' then p_jumlah else -p_jumlah end
   where user_id = p_mhs;
  insert into public.transaksi_poin (mahasiswa_id, jenis, jumlah, keterangan) values (p_mhs, p_jenis, p_jumlah, p_ket);
end $$;
revoke all on function public._catat_poin(uuid, jenis_transaksi, int, text) from public;

-- Akun baru dari Supabase Auth → baris users + mahasiswa + bonus sambutan.
create or replace function public.tangani_user_baru() returns trigger
language plpgsql security definer set search_path = public as $$
declare meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.users (id, nama, email, role)
  values (new.id, coalesce(meta->>'nama', split_part(new.email, '@', 1)), new.email, 'MAHASISWA');
  insert into public.mahasiswa (user_id, npm, alamat_kos, lat, lng)
  values (new.id, upper(coalesce(meta->>'npm', '')), coalesce(meta->>'alamatKos', ''),
          nullif(meta->>'lat', '')::float8, nullif(meta->>'lng', '')::float8);
  perform public._catat_poin(new.id, 'MASUK', 50, 'Bonus sambutan akun baru');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.tangani_user_baru();

-- ---------- RPC: Mahasiswa ----------
create or replace function public.buat_pesanan(
  p_mitra uuid, p_dokumen uuid, p_jenis jenis_kertas, p_warna warna_cetak,
  p_jilid jenis_jilid, p_salinan int, p_poin int
) returns public.pesanan_cetak
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_hal int; v_nama text; v_lembar int; v_harga int; v_jilid int;
  v_sub int; v_maks int; v_poin int; v_saldo int; cfg public.pengaturan; v_row public.pesanan_cetak;
begin
  if peran_saya() is distinct from 'MAHASISWA' then raise exception 'Hanya mahasiswa yang bisa memesan cetak.'; end if;
  if p_salinan not between 1 and 50 then raise exception 'Jumlah salinan 1–50.'; end if;
  select jumlah_halaman, nama_file into v_hal, v_nama from dokumen where id = p_dokumen and pemilik_id = v_uid;
  if v_hal is null then raise exception 'Dokumen tidak ditemukan.'; end if;
  if not exists (select 1 from mitra where user_id = p_mitra) then raise exception 'Mitra tidak valid.'; end if;
  select * into cfg from pengaturan where id = 1;
  select harga_per_lembar into v_harga from tarif where jenis_kertas = p_jenis and warna = p_warna;
  v_lembar := v_hal * p_salinan;
  v_jilid := coalesce((cfg.biaya_jilid->>p_jilid::text)::int, 0) * p_salinan;
  v_sub := v_lembar * coalesce(v_harga, 0) + v_jilid;
  select saldo_poin into v_saldo from mahasiswa where user_id = v_uid for update;
  v_maks := greatest(0, least(v_saldo, floor((v_sub * cfg.maks_potongan_persen / 100.0) / cfg.nilai_poin_rupiah)::int));
  v_poin := greatest(0, least(coalesce(p_poin, 0), v_maks));
  if p_jenis = 'ECO' then
    update stok_eco_paper set jumlah_lembar = jumlah_lembar - v_lembar
     where mitra_id = p_mitra and jumlah_lembar >= v_lembar;
    if not found then raise exception 'Stok Eco-Paper mitra ini tidak mencukupi.'; end if;
  end if;
  insert into pesanan_cetak (mahasiswa_id, mitra_id, dokumen_id, jenis_kertas, warna, jilid, salinan, total_harga, poin_dipakai)
  values (v_uid, p_mitra, p_dokumen, p_jenis, p_warna, p_jilid, p_salinan, v_sub - v_poin * cfg.nilai_poin_rupiah, v_poin)
  returning * into v_row;
  perform _catat_poin(v_uid, 'KELUAR', v_poin, 'Potongan cetak #' || upper(left(v_row.id::text, 8)) || ' — ' || v_nama);
  return v_row;
end $$;

create or replace function public.ajukan_jemput(p_estimasi int, p_kategori kategori_kerahasiaan, p_jadwal timestamptz, p_foto_url text)
returns public.permintaan_jemput
language plpgsql security definer set search_path = public as $$
declare v_row public.permintaan_jemput;
begin
  if peran_saya() is distinct from 'MAHASISWA' then raise exception 'Hanya mahasiswa yang bisa mengajukan jemput.'; end if;
  if p_estimasi < 10 then raise exception 'Minimal 10 lembar agar kurir berangkat.'; end if;
  if p_jadwal < now() - interval '1 hour' then raise exception 'Slot jadwal sudah lewat.'; end if;
  insert into permintaan_jemput (mahasiswa_id, estimasi_lembar, kategori, jadwal, kode_qr, foto_url)
  values (auth.uid(), p_estimasi, p_kategori, p_jadwal, gen_kode_qr(), p_foto_url)
  returning * into v_row;
  return v_row;
end $$;

create or replace function public.batalkan_jemput(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare j public.permintaan_jemput;
begin
  select * into j from permintaan_jemput where id = p_id for update;
  if j.id is null then raise exception 'Permintaan tidak ditemukan.'; end if;
  if not (j.mahasiswa_id = auth.uid() or peran_saya() = 'ADMIN') then raise exception 'Bukan permintaan Anda.'; end if;
  if j.status not in ('DIAJUKAN', 'DIPROSES') then raise exception 'Permintaan yang sudah dijemput tidak bisa dibatalkan.'; end if;
  update permintaan_jemput set status = 'DIBATALKAN' where id = p_id;
end $$;

-- ---------- RPC: Mitra ----------
create or replace function public.ubah_status_pesanan(p_id uuid, p_status status_pesanan) returns void
language plpgsql security definer set search_path = public as $$
declare p public.pesanan_cetak; v_peran peran := peran_saya(); v_hal int;
begin
  select * into p from pesanan_cetak where id = p_id for update;
  if p.id is null then raise exception 'Pesanan tidak ditemukan.'; end if;
  if not (
    (v_peran = 'MITRA' and p.mitra_id = auth.uid())
    or (v_peran = 'MAHASISWA' and p.mahasiswa_id = auth.uid() and p_status = 'DIBATALKAN')
    or v_peran = 'ADMIN'
  ) then raise exception 'Anda tidak berhak mengubah pesanan ini.'; end if;
  if not (
    (p.status = 'DIAJUKAN' and p_status in ('DIPROSES', 'DIBATALKAN'))
    or (p.status = 'DIPROSES' and p_status = 'SIAP_DIAMBIL')
    or (p.status = 'SIAP_DIAMBIL' and p_status = 'SELESAI')
  ) then raise exception 'Status tidak bisa berpindah dari % ke %.', p.status, p_status; end if;
  if p_status = 'DIBATALKAN' then
    perform _catat_poin(p.mahasiswa_id, 'MASUK', p.poin_dipakai, 'Pengembalian poin — pesanan #' || upper(left(p.id::text, 8)) || ' dibatalkan');
    if p.jenis_kertas = 'ECO' then
      select jumlah_halaman into v_hal from dokumen where id = p.dokumen_id;
      update stok_eco_paper set jumlah_lembar = jumlah_lembar + v_hal * p.salinan where mitra_id = p.mitra_id;
    end if;
  end if;
  update pesanan_cetak set status = p_status where id = p_id;
end $$;

create or replace function public.terima_bundel(p_kode text) returns public.bundel_kertas
language plpgsql security definer set search_path = public as $$
declare j public.permintaan_jemput; v_row public.bundel_kertas;
begin
  if peran_saya() is distinct from 'MITRA' then raise exception 'Hanya mitra yang bisa menerima bundel.'; end if;
  select * into j from permintaan_jemput where kode_qr = upper(trim(p_kode)) for update;
  if j.id is null then raise exception 'Kode QR tidak dikenal.'; end if;
  if j.status <> 'DIJEMPUT' then raise exception 'Bundel ini belum dijemput kurir atau sudah diproses.'; end if;
  if exists (select 1 from bundel_kertas where permintaan_jemput_id = j.id) then raise exception 'Bundel ini sudah dikonfirmasi diterima.'; end if;
  insert into bundel_kertas (permintaan_jemput_id, mitra_id) values (j.id, auth.uid()) returning * into v_row;
  return v_row;
end $$;

create or replace function public.simpan_sortir(p_bundel uuid, p_layak int, p_dicacah int) returns void
language plpgsql security definer set search_path = public as $$
declare b public.bundel_kertas; j public.permintaan_jemput; v_ppl int;
begin
  select * into b from bundel_kertas where id = p_bundel and mitra_id = auth.uid() for update;
  if b.id is null then raise exception 'Bundel tidak ditemukan.'; end if;
  if b.tanggal_sortir is not null then raise exception 'Bundel ini sudah disortir.'; end if;
  if p_layak < 0 or p_dicacah < 0 or p_layak + p_dicacah = 0 then raise exception 'Isi jumlah lembar hasil sortir.'; end if;
  select * into j from permintaan_jemput where id = b.permintaan_jemput_id for update;
  if j.kategori = 'RAHASIA' and p_layak > 0 then raise exception 'Bundel berisi data pribadi wajib dicacah seluruhnya.'; end if;
  update bundel_kertas set lembar_layak = p_layak, lembar_dicacah = p_dicacah, tanggal_sortir = now() where id = p_bundel;
  update permintaan_jemput set status = 'DISORTIR' where id = j.id;
  select poin_per_lembar into v_ppl from pengaturan where id = 1;
  perform _catat_poin(j.mahasiswa_id, 'MASUK', (p_layak + p_dicacah) * v_ppl,
    'Setoran kertas #' || upper(left(j.id::text, 8)) || ' — ' || (p_layak + p_dicacah) || ' lembar');
end $$;

create or replace function public.selesaikan_bundel(p_bundel uuid) returns void
language plpgsql security definer set search_path = public as $$
declare b public.bundel_kertas; j public.permintaan_jemput;
begin
  select * into b from bundel_kertas where id = p_bundel and mitra_id = auth.uid() for update;
  if b.id is null or b.tanggal_sortir is null then raise exception 'Bundel belum disortir.'; end if;
  select * into j from permintaan_jemput where id = b.permintaan_jemput_id for update;
  if j.status <> 'DISORTIR' then raise exception 'Bundel sudah diselesaikan.'; end if;
  if j.kategori = 'AMAN' then
    insert into stok_eco_paper (mitra_id, jumlah_lembar) values (b.mitra_id, b.lembar_layak)
      on conflict (mitra_id) do update set jumlah_lembar = stok_eco_paper.jumlah_lembar + excluded.jumlah_lembar;
    update permintaan_jemput set status = 'DIPAKAI_ULANG' where id = j.id;
  else
    update permintaan_jemput set status = 'DICACAH' where id = j.id;
  end if;
end $$;

create or replace function public.atur_stok(p_jumlah int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if peran_saya() is distinct from 'MITRA' then raise exception 'Hanya mitra yang mengelola stok.'; end if;
  if p_jumlah < 0 then raise exception 'Stok tidak boleh negatif.'; end if;
  insert into stok_eco_paper (mitra_id, jumlah_lembar) values (auth.uid(), p_jumlah)
    on conflict (mitra_id) do update set jumlah_lembar = excluded.jumlah_lembar;
end $$;

-- ---------- RPC: Kurir ----------
create or replace function public.ambil_tugas(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if peran_saya() is distinct from 'KURIR' then raise exception 'Hanya kurir yang bisa mengambil tugas.'; end if;
  update permintaan_jemput set kurir_id = auth.uid(), status = 'DIPROSES' where id = p_id and status = 'DIAJUKAN';
  if not found then raise exception 'Tugas ini sudah diambil kurir lain.'; end if;
end $$;

create or replace function public.tandai_dijemput(p_id uuid, p_kode text) returns void
language plpgsql security definer set search_path = public as $$
declare j public.permintaan_jemput;
begin
  select * into j from permintaan_jemput where id = p_id for update;
  if j.id is null or j.kurir_id is distinct from auth.uid() then raise exception 'Tugas ini bukan milik Anda.'; end if;
  if j.status <> 'DIPROSES' then raise exception 'Status tugas tidak sesuai.'; end if;
  if j.kode_qr <> upper(trim(p_kode)) then raise exception 'Kode QR tidak cocok dengan bundel ini.'; end if;
  update permintaan_jemput set status = 'DIJEMPUT' where id = p_id;
end $$;

-- ---------- RPC: Admin ----------
create or replace function public.admin_tetapkan_peran(p_email text, p_nama text, p_role peran, p_detail jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if peran_saya() is distinct from 'ADMIN' then raise exception 'Hanya admin.'; end if;
  select id into v_id from users where lower(email) = lower(trim(p_email));
  if v_id is null then raise exception 'Email belum terdaftar. Minta yang bersangkutan mendaftar dulu, lalu tetapkan perannya di sini.'; end if;
  update users set role = p_role, nama = coalesce(nullif(trim(p_nama), ''), nama) where id = v_id;
  if p_role = 'MITRA' then
    insert into mitra (user_id, nama_usaha, alamat, lat, lng)
    values (v_id, coalesce(p_detail->>'namaUsaha', ''), coalesce(p_detail->>'alamat', ''), (p_detail->>'lat')::float8, (p_detail->>'lng')::float8)
    on conflict (user_id) do update set nama_usaha = excluded.nama_usaha, alamat = excluded.alamat, lat = excluded.lat, lng = excluded.lng;
    insert into stok_eco_paper (mitra_id) values (v_id) on conflict do nothing;
  elsif p_role = 'KURIR' then
    insert into kurir (user_id, no_hp) values (v_id, coalesce(p_detail->>'noHp', ''))
    on conflict (user_id) do update set no_hp = excluded.no_hp;
  elsif p_role = 'MAHASISWA' then
    insert into mahasiswa (user_id) values (v_id) on conflict do nothing;
  end if;
  -- Baris mahasiswa bawaan pendaftaran dihapus bila akun dijadikan staf dan belum punya riwayat.
  if p_role <> 'MAHASISWA' then
    delete from mahasiswa m where m.user_id = v_id
      and not exists (select 1 from pesanan_cetak where mahasiswa_id = v_id)
      and not exists (select 1 from permintaan_jemput where mahasiswa_id = v_id);
  end if;
end $$;

-- Ringkasan dampak untuk halaman publik (tanpa data pribadi).
create or replace function public.ringkasan_dampak() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'lembarLayak', coalesce((select sum(lembar_layak) from bundel_kertas where tanggal_sortir is not null), 0),
    'lembarDicacah', coalesce((select sum(lembar_dicacah) from bundel_kertas where tanggal_sortir is not null), 0),
    'lembarEco', coalesce((select sum(d.jumlah_halaman * p.salinan) from pesanan_cetak p join dokumen d on d.id = p.dokumen_id
                           where p.jenis_kertas = 'ECO' and p.status <> 'DIBATALKAN'), 0),
    'mahasiswa', (select count(*) from users where role = 'MAHASISWA'),
    'mitra', (select count(*) from mitra),
    'gramPerLembar', (select gram_per_lembar from pengaturan where id = 1),
    'lembarPerPohon', (select lembar_per_pohon from pengaturan where id = 1)
  )
$$;

-- ---------- Row Level Security ----------
alter table public.users enable row level security;
alter table public.mahasiswa enable row level security;
alter table public.mitra enable row level security;
alter table public.kurir enable row level security;
alter table public.dokumen enable row level security;
alter table public.pesanan_cetak enable row level security;
alter table public.permintaan_jemput enable row level security;
alter table public.bundel_kertas enable row level security;
alter table public.stok_eco_paper enable row level security;
alter table public.transaksi_poin enable row level security;
alter table public.tarif enable row level security;
alter table public.pengaturan enable row level security;

-- users: diri sendiri, admin, staf (mitra/kurir) melihat semua; semua orang melihat akun mitra/kurir
create policy users_baca on public.users for select to authenticated using (
  id = auth.uid() or peran_saya() in ('ADMIN', 'MITRA', 'KURIR') or role in ('MITRA', 'KURIR')
);
create policy users_ubah_diri on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy mhs_baca on public.mahasiswa for select to authenticated using (
  user_id = auth.uid() or peran_saya() in ('ADMIN', 'MITRA', 'KURIR')
);
create policy mhs_ubah_diri on public.mahasiswa for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy mitra_baca on public.mitra for select to authenticated using (true);
create policy mitra_ubah_diri on public.mitra for update to authenticated using (user_id = auth.uid());
create policy kurir_baca on public.kurir for select to authenticated using (true);
create policy kurir_ubah_diri on public.kurir for update to authenticated using (user_id = auth.uid());

create policy dok_baca on public.dokumen for select to authenticated using (
  pemilik_id = auth.uid() or peran_saya() = 'ADMIN'
  or exists (select 1 from public.pesanan_cetak p where p.dokumen_id = dokumen.id and p.mitra_id = auth.uid())
);
create policy dok_tambah on public.dokumen for insert to authenticated with check (pemilik_id = auth.uid());

create policy pesanan_baca on public.pesanan_cetak for select to authenticated using (
  mahasiswa_id = auth.uid() or mitra_id = auth.uid() or peran_saya() = 'ADMIN'
);

create policy jemput_baca on public.permintaan_jemput for select to authenticated using (
  mahasiswa_id = auth.uid() or peran_saya() in ('ADMIN', 'KURIR', 'MITRA')
);

create policy bundel_baca on public.bundel_kertas for select to authenticated using (
  mitra_id = auth.uid() or peran_saya() = 'ADMIN'
  or exists (select 1 from public.permintaan_jemput j where j.id = bundel_kertas.permintaan_jemput_id and j.mahasiswa_id = auth.uid())
);

create policy stok_baca on public.stok_eco_paper for select to authenticated using (true);

create policy tx_baca on public.transaksi_poin for select to authenticated using (
  mahasiswa_id = auth.uid() or peran_saya() = 'ADMIN'
);

create policy tarif_baca on public.tarif for select using (true);
create policy tarif_admin on public.tarif for all to authenticated using (peran_saya() = 'ADMIN') with check (peran_saya() = 'ADMIN');
create policy cfg_baca on public.pengaturan for select using (true);
create policy cfg_admin on public.pengaturan for update to authenticated using (peran_saya() = 'ADMIN') with check (peran_saya() = 'ADMIN');

-- Hak kolom: pengguna hanya boleh mengubah kolom profil, bukan peran/saldo poin.
revoke update on public.users, public.mahasiswa from authenticated;
grant update (nama) on public.users to authenticated;
grant update (npm, alamat_kos, lat, lng) on public.mahasiswa to authenticated;

-- Fungsi yang boleh dipanggil klien
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.peran_saya(), public.buat_pesanan(uuid, uuid, jenis_kertas, warna_cetak, jenis_jilid, int, int),
  public.ajukan_jemput(int, kategori_kerahasiaan, timestamptz, text), public.batalkan_jemput(uuid),
  public.ubah_status_pesanan(uuid, status_pesanan), public.terima_bundel(text), public.simpan_sortir(uuid, int, int),
  public.selesaikan_bundel(uuid), public.atur_stok(int), public.ambil_tugas(uuid), public.tandai_dijemput(uuid, text),
  public.admin_tetapkan_peran(text, text, peran, jsonb)
to authenticated;
grant execute on function public.ringkasan_dampak() to anon, authenticated;
grant select on public.tarif, public.pengaturan to anon, authenticated;

-- ---------- Storage ----------
insert into storage.buckets (id, name, public) values ('dokumen', 'dokumen', false), ('foto-jemput', 'foto-jemput', false)
  on conflict (id) do nothing;

create policy "unggah ke folder sendiri" on storage.objects for insert to authenticated
  with check (bucket_id in ('dokumen', 'foto-jemput') and (storage.foldername(name))[1] = auth.uid()::text);

create policy "baca dokumen sendiri atau pesanan mitra" on storage.objects for select to authenticated using (
  bucket_id = 'dokumen' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.peran_saya() = 'ADMIN'
    or exists (select 1 from public.dokumen d join public.pesanan_cetak p on p.dokumen_id = d.id
               where d.url = storage.objects.name and p.mitra_id = auth.uid())
  )
);

create policy "baca foto jemput" on storage.objects for select to authenticated using (
  bucket_id = 'foto-jemput' and (
    (storage.foldername(name))[1] = auth.uid()::text or public.peran_saya() in ('ADMIN', 'KURIR', 'MITRA')
  )
);
