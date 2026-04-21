# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Playback Timer (Checkpoints) - Supabase Setup

This project records “checkpoints” of the whiteboard while you edit in `/collab/:roomId`, and you can replay them in `/playback/:roomId`.

### 1) Create checkpoints table
Run this SQL in Supabase (SQL Editor):

```sql
create table if not exists public.whiteboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  created_at timestamptz not null default now(),
  title text,
  json jsonb not null
);

create index if not exists whiteboard_snapshots_room_created_idx
  on public.whiteboard_snapshots (room_id, created_at);
```

If you already created the table before, run this too:

```sql
alter table public.whiteboard_snapshots
add column if not exists title text;
```

### 2) Enable RLS (recommended) + allow anon for demo
RLS is **server-side security**. Even if you have a public key on the frontend, Supabase will still allow/deny actions based on RLS policies.

If you are not using authentication (this app uses only `VITE_SUPABASE_KEY`), set policies for role `anon` so the frontend can insert/select (demo mode):

```sql
alter table public.whiteboard_snapshots enable row level security;

drop policy if exists "anon select snapshots" on public.whiteboard_snapshots;
create policy "anon select snapshots"
  on public.whiteboard_snapshots
  for select
  to anon
  using (true);

drop policy if exists "anon insert snapshots" on public.whiteboard_snapshots;
create policy "anon insert snapshots"
  on public.whiteboard_snapshots
  for insert
  to anon
  with check (true);
```

For real production use, replace the `using (true)` / `with check (true)` parts with room-based rules.

### 3) Also check RLS for the `whiteboard` table
Your `/collab/:roomId` page still uses the older `public.whiteboard` table to support **Save Data**.
If you enable RLS on `whiteboard`, you must also add matching `anon` (or user-based) policies there, otherwise **Save Data** may fail even if playback works.
