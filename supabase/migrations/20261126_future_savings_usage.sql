-- Riwayat penggunaan Tabungan Masa Depan
create table if not exists public.future_savings_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null check (activity_type in ('use')),
  amount numeric(18,2) not null check (amount > 0),
  activity_date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

alter table public.future_savings_activity enable row level security;
drop policy if exists "Users can view own future savings activity" on public.future_savings_activity;
create policy "Users can view own future savings activity"
on public.future_savings_activity for select
to authenticated using (auth.uid() = user_id);
grant select on public.future_savings_activity to authenticated;

create or replace function public.use_future_savings(
  p_amount numeric,
  p_date date,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_total numeric;
  v_remaining numeric := p_amount;
  v_row record;
  v_take numeric;
  v_activity_id uuid;
begin
  if v_user_id is null then raise exception 'Silakan masuk terlebih dahulu.'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Nominal penggunaan harus lebih dari nol.'; end if;
  if p_date is null then raise exception 'Tanggal penggunaan wajib diisi.'; end if;

  perform 1 from public.monthly_savings_allocations
  where user_id = v_user_id
  order by month_key
  for update;

  select coalesce(sum(saved_amount),0) into v_total
  from public.monthly_savings_allocations
  where user_id = v_user_id;

  if v_total < p_amount then
    raise exception 'Saldo Tabungan Masa Depan tidak mencukupi.';
  end if;

  for v_row in
    select user_id, month_key, saved_amount
    from public.monthly_savings_allocations
    where user_id = v_user_id and saved_amount > 0
    order by month_key desc
    for update
  loop
    exit when v_remaining <= 0;
    v_take := least(v_row.saved_amount, v_remaining);
    update public.monthly_savings_allocations
    set saved_amount = saved_amount - v_take,
        updated_at = now()
    where user_id = v_user_id and month_key = v_row.month_key;
    v_remaining := v_remaining - v_take;
  end loop;

  insert into public.future_savings_activity(user_id, activity_type, amount, activity_date, note)
  values(v_user_id, 'use', p_amount, p_date, nullif(trim(p_note), ''))
  returning id into v_activity_id;

  return v_activity_id;
end;
$$;

revoke all on function public.use_future_savings(numeric, date, text) from public;
grant execute on function public.use_future_savings(numeric, date, text) to authenticated;
