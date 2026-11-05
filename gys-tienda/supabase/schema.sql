-- =====================================================================
-- GYS · Esquema de base de datos para Supabase
-- Pégalo completo en Supabase > SQL Editor > New query > Run
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Tablas ----------

-- Equipo que entra al panel: admin (gerencia) o agent (agente de pagos)
create table if not exists public.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','agent')),
  name text not null default 'Equipo GYS'
);

-- Ajustes de la tienda (una sola fila)
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  banco text default '',
  telefono text default '',
  documento text default '',
  titular text default '',
  tasa numeric(12,2) default 0,
  whatsapp text default '',
  entregador text default '',
  updated_at timestamptz default now()
);
insert into public.settings (id) values (1) on conflict do nothing;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  price numeric(12,2) not null check (price >= 0),
  category text default '',
  stock int check (stock is null or stock >= 0),   -- null = sin límite
  vendor text not null default 'GYS',
  visible boolean not null default true,
  image_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  customer_name text not null,
  phone text not null,
  address text not null,
  notes text default '',
  reference text not null,
  total_usd numeric(12,2) not null,
  tasa numeric(12,2) default 0,
  total_bs numeric(14,2),
  status text not null default 'por_verificar'
    check (status in ('por_verificar','pago_confirmado','preparando','en_camino','entregado','rechazado')),
  confirmed_by uuid references auth.users(id),
  confirmed_at timestamptz
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  vendor text not null,
  price numeric(12,2) not null,
  qty int not null check (qty > 0)
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- ---------- Funciones de apoyo ----------

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid())
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and role = 'admin')
$$;

-- ---------- Seguridad por filas (RLS) ----------

alter table public.staff enable row level security;
alter table public.settings enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists staff_select on public.staff;
create policy staff_select on public.staff for select
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists settings_select on public.settings;
create policy settings_select on public.settings for select using (true);
drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists products_select on public.products;
create policy products_select on public.products for select
  using (visible or public.is_admin());
drop policy if exists products_write on public.products;
create policy products_write on public.products for all
  using (public.is_admin()) with check (public.is_admin());

-- Los pedidos solo los ve el equipo. Los clientes crean pedidos con create_order().
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select using (public.is_staff());
drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items for select using (public.is_staff());

-- ---------- Funciones que usa la tienda ----------

-- El cliente crea su pedido. Los precios se leen aquí, nunca del navegador.
create or replace function public.create_order(
  p_name text, p_phone text, p_address text, p_notes text, p_reference text, p_items jsonb
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_number text;
  v_total numeric(12,2) := 0;
  v_tasa numeric(12,2);
  v_id uuid;
  it jsonb;
  pr public.products%rowtype;
  q int;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  if length(trim(coalesce(p_name,''))) < 2
     or length(trim(coalesce(p_address,''))) < 5
     or length(regexp_replace(coalesce(p_phone,''), '\D', '', 'g')) < 7
     or length(trim(coalesce(p_reference,''))) < 4 then
    raise exception 'datos_invalidos';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'carrito_invalido';
  end if;

  select tasa into v_tasa from public.settings where id = 1;

  loop
    v_number := 'GYS-';
    for i in 1..6 loop
      v_number := v_number || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.orders where number = v_number);
  end loop;

  insert into public.orders (number, customer_name, phone, address, notes, reference, total_usd, tasa)
  values (v_number, trim(p_name), trim(p_phone), trim(p_address), left(coalesce(p_notes,''), 300), trim(p_reference), 0, v_tasa)
  returning id into v_id;

  for it in select * from jsonb_array_elements(p_items) loop
    q := (it->>'qty')::int;
    select * into pr from public.products where id = (it->>'id')::uuid and visible;
    if not found or q is null or q < 1 or q > 99 then
      raise exception 'producto_invalido';
    end if;
    if pr.stock is not null and pr.stock < q then
      raise exception 'sin_stock:%', pr.name;
    end if;
    insert into public.order_items (order_id, product_id, name, vendor, price, qty)
    values (v_id, pr.id, pr.name, pr.vendor, pr.price, q);
    v_total := v_total + pr.price * q;
  end loop;

  update public.orders
     set total_usd = v_total,
         total_bs = case when coalesce(v_tasa,0) > 0 then round(v_total * v_tasa, 2) end
   where id = v_id;

  return v_number;
end $$;

-- El cliente consulta solo el estado de su pedido, con su número.
create or replace function public.track_order(p_number text)
returns table (status text, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select o.status, o.updated_at from public.orders o where o.number = upper(trim(p_number))
$$;

-- El equipo confirma un pago (luz verde): descuenta stock y registra quién y cuándo.
create or replace function public.confirm_payment(p_number text) returns void
language plpgsql security definer set search_path = public as $$
declare
  o public.orders%rowtype;
  it record;
begin
  if not public.is_staff() then raise exception 'no_autorizado'; end if;
  select * into o from public.orders where number = p_number for update;
  if not found then raise exception 'no_existe'; end if;
  if o.status <> 'por_verificar' then raise exception 'estado_invalido'; end if;
  update public.orders
     set status = 'pago_confirmado', confirmed_by = auth.uid(), confirmed_at = now(), updated_at = now()
   where id = o.id;
  for it in select product_id, qty from public.order_items where order_id = o.id loop
    update public.products set stock = greatest(0, stock - it.qty)
     where id = it.product_id and stock is not null;
  end loop;
end $$;

-- El equipo mueve el pedido: preparando, en camino, entregado, rechazado o reabrir.
create or replace function public.set_status(p_number text, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'no_autorizado'; end if;
  if p_status not in ('por_verificar','preparando','en_camino','entregado','rechazado') then
    raise exception 'estado_invalido';
  end if;
  update public.orders set status = p_status, updated_at = now() where number = p_number;
end $$;

grant execute on function public.create_order(text,text,text,text,text,jsonb) to anon, authenticated;
grant execute on function public.track_order(text) to anon, authenticated;
grant execute on function public.confirm_payment(text) to authenticated;
grant execute on function public.set_status(text,text) to authenticated;

-- ---------- Fotos de productos ----------

insert into storage.buckets (id, name, public) values ('productos', 'productos', true)
on conflict (id) do nothing;

drop policy if exists fotos_lectura on storage.objects;
create policy fotos_lectura on storage.objects for select using (bucket_id = 'productos');
drop policy if exists fotos_subir on storage.objects;
create policy fotos_subir on storage.objects for insert
  with check (bucket_id = 'productos' and public.is_admin());
drop policy if exists fotos_editar on storage.objects;
create policy fotos_editar on storage.objects for update
  using (bucket_id = 'productos' and public.is_admin());
drop policy if exists fotos_borrar on storage.objects;
create policy fotos_borrar on storage.objects for delete
  using (bucket_id = 'productos' and public.is_admin());

-- =====================================================================
-- DESPUÉS de crear tu usuario en Supabase > Authentication > Users,
-- conviértelo en gerencia con esto (cambia el correo):
--
--   insert into public.staff (user_id, role, name)
--   select id, 'admin', 'Gerencia GYS' from auth.users where email = 'tu@correo.com';
--
-- Para el agente de pagos (rol agent: solo ve Pagos y Pedidos):
--
--   insert into public.staff (user_id, role, name)
--   select id, 'agent', 'Agente de pagos' from auth.users where email = 'agente@correo.com';
-- =====================================================================
