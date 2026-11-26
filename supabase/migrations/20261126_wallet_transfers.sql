-- Niell Finance: transfer antar dompet
create table if not exists public.wallet_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_wallet_id uuid not null references public.wallets(id) on delete restrict,
  to_wallet_id uuid not null references public.wallets(id) on delete restrict,
  amount numeric(18,2) not null check (amount > 0),
  transfer_date date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  constraint wallet_transfers_different_wallets check (from_wallet_id <> to_wallet_id)
);

alter table public.wallet_transfers enable row level security;

drop policy if exists "Users can view own wallet transfers" on public.wallet_transfers;
create policy "Users can view own wallet transfers"
on public.wallet_transfers for select
to authenticated
using (auth.uid() = user_id);

grant select on public.wallet_transfers to authenticated;

create or replace function public.transfer_between_wallets(
  p_from_wallet_id uuid,
  p_to_wallet_id uuid,
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
  v_from_balance numeric;
  v_transfer_id uuid;
begin
  if v_user_id is null then
    raise exception 'Silakan masuk terlebih dahulu.';
  end if;
  if p_from_wallet_id = p_to_wallet_id then
    raise exception 'Dompet asal dan tujuan harus berbeda.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Nominal transfer harus lebih dari nol.';
  end if;
  if p_date is null then
    raise exception 'Tanggal transfer wajib diisi.';
  end if;

  perform 1
  from public.wallets
  where user_id = v_user_id
    and id in (p_from_wallet_id, p_to_wallet_id)
  order by id
  for update;

  if (select count(*) from public.wallets
      where user_id = v_user_id
        and id in (p_from_wallet_id, p_to_wallet_id)) <> 2 then
    raise exception 'Dompet asal atau tujuan tidak ditemukan.';
  end if;

  select balance into v_from_balance
  from public.wallets
  where id = p_from_wallet_id and user_id = v_user_id;

  if coalesce(v_from_balance, 0) < p_amount then
    raise exception 'Saldo dompet asal tidak mencukupi.';
  end if;

  update public.wallets
  set balance = balance - p_amount
  where id = p_from_wallet_id and user_id = v_user_id;

  update public.wallets
  set balance = balance + p_amount
  where id = p_to_wallet_id and user_id = v_user_id;

  insert into public.wallet_transfers
    (user_id, from_wallet_id, to_wallet_id, amount, transfer_date, note)
  values
    (v_user_id, p_from_wallet_id, p_to_wallet_id, p_amount, p_date, nullif(trim(p_note), ''))
  returning id into v_transfer_id;

  return v_transfer_id;
end;
$$;

revoke all on function public.transfer_between_wallets(uuid, uuid, numeric, date, text) from public;
grant execute on function public.transfer_between_wallets(uuid, uuid, numeric, date, text) to authenticated;
