import { buatLocalRepo } from './localRepo';
import type { Repo } from './repo';
import { buatSupabaseRepo } from './supabaseRepo';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Supabase dipakai bila kedua variabel lingkungan diisi; selain itu mode demo lokal. */
export const repo: Repo = url && key ? buatSupabaseRepo(url, key) : buatLocalRepo();

export type { Repo, DataSet } from './repo';
export { RepoError } from './repo';
