-- ---------------------------------------------------------------------------
-- 0007: post-order website feedback
--
-- Stores the "rate your experience" survey shown on the order-confirmation
-- page: a 1–5 star rating for the website plus an optional improvements note.
-- Customers may only write and read their own feedback (RLS).
-- ---------------------------------------------------------------------------

create table if not exists public.site_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  improvements text,
  created_at timestamptz not null default now()
);

create index if not exists site_feedback_created_at_idx on public.site_feedback (created_at);

alter table public.site_feedback enable row level security;

drop policy if exists "site_feedback_select_own" on public.site_feedback;
create policy "site_feedback_select_own" on public.site_feedback
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "site_feedback_insert_own" on public.site_feedback;
create policy "site_feedback_insert_own" on public.site_feedback
  for insert to authenticated
  with check (user_id = auth.uid());
