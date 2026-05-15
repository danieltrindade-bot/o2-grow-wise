
-- =========================================================
-- DIAGNOSTIC TABLES
-- =========================================================
create table public.diagnostic_questions (
  id uuid primary key default gen_random_uuid(),
  dimension text not null,
  question_key text not null,
  global_order int not null,
  question_text text not null,
  option_green text not null,
  option_yellow text not null,
  option_red text not null,
  created_at timestamptz not null default now(),
  unique (dimension, question_key)
);

create table public.cost_parameters (
  id uuid primary key default gen_random_uuid(),
  dimension text not null,
  question_key text not null,
  trigger_color text not null,
  label text not null,
  pct_min numeric(6,4),
  pct_max numeric(6,4),
  qualitative boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.product_recommendations (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  name text not null,
  tagline text not null,
  price numeric(10,2),
  score_min int not null,
  score_max int not null,
  created_at timestamptz not null default now()
);

create table public.outcome_texts (
  id uuid primary key default gen_random_uuid(),
  dimension text not null,
  question_key text not null,
  current_text text not null,
  future_text text not null,
  check_red boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.maturity_levels (
  id uuid primary key default gen_random_uuid(),
  level_key text not null unique,
  label text not null,
  description text not null,
  color text not null,
  score_min int not null,
  score_max int not null,
  sort_order int not null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- BPO
-- =========================================================
create table public.bpo_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_tier_1 numeric(10,2) not null,
  price_tier_2 numeric(10,2) not null,
  price_tier_3 numeric(10,2) not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.bpo_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  created_at timestamptz not null default now()
);

create table public.bpo_setup_module (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  is_mandatory boolean not null default true,
  installments int not null,
  installment_value numeric(10,2) not null,
  add_to_monthly boolean not null default true,
  created_at timestamptz not null default now()
);

-- =========================================================
-- CFO
-- =========================================================
create table public.cfo_base_rules (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  min_revenue numeric not null,
  max_revenue numeric,
  base_price numeric(10,2) not null,
  sort_order int not null,
  created_at timestamptz not null default now()
);

create table public.cfo_cnpj_rules (
  id uuid primary key default gen_random_uuid(),
  cnpj_count int not null unique,
  multiplier numeric(3,1) not null,
  created_at timestamptz not null default now()
);

create table public.cfo_complexity_rules (
  id uuid primary key default gen_random_uuid(),
  level text not null unique,
  min_score int not null,
  max_score int not null,
  factor numeric(4,2) not null,
  created_at timestamptz not null default now()
);

create table public.cfo_segment_rules (
  id uuid primary key default gen_random_uuid(),
  segment_type text not null unique,
  adjustment numeric(5,2) not null,
  created_at timestamptz not null default now()
);

create table public.cfo_governance_rules (
  id uuid primary key default gen_random_uuid(),
  governance_type text not null unique,
  fee numeric(10,2) not null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- SETUP / OXY / COORDENADOR (shared) and ASSESSORIA
-- =========================================================
create table public.setup_pricing_rules (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  min_revenue numeric not null,
  max_revenue numeric,
  price_standard numeric(10,2) not null,
  price_complex numeric(10,2) not null,
  sort_order int not null,
  created_at timestamptz not null default now()
);

create table public.assessoria_pricing_rules (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  min_revenue numeric not null,
  max_revenue numeric,
  base_price numeric(10,2) not null,
  sort_order int not null,
  created_at timestamptz not null default now()
);

create table public.assessoria_settings (
  id uuid primary key default gen_random_uuid(),
  cnpj_adjustment numeric(10,2) not null default 500,
  min_price numeric(10,2) not null default 4170,
  max_price numeric(10,2) not null default 8570,
  created_at timestamptz not null default now()
);

-- =========================================================
-- AUTH & AUDIT
-- =========================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id)
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid,
  table_name text,
  action text,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================
-- SECURITY DEFINER FUNCTIONS
-- =========================================================
create or replace function public.has_admin_role(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = 'admin'
  )
$$;

-- Called by the client right after signup. Reads the user's email from
-- auth.users via security-definer privileges and assigns admin if the
-- domain matches @o2inc.com.br, otherwise 'user'.
create or replace function public.assign_role_on_signup()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_role text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then
    raise exception 'User not found';
  end if;

  if lower(v_email) like '%@o2inc.com.br' then
    v_role := 'admin';
  else
    v_role := 'user';
  end if;

  insert into public.user_roles (user_id, role)
  values (auth.uid(), v_role)
  on conflict (user_id) do update set role = excluded.role;

  return v_role;
end;
$$;

-- =========================================================
-- ENABLE RLS ON EVERYTHING
-- =========================================================
alter table public.diagnostic_questions enable row level security;
alter table public.cost_parameters enable row level security;
alter table public.product_recommendations enable row level security;
alter table public.outcome_texts enable row level security;
alter table public.maturity_levels enable row level security;
alter table public.bpo_packages enable row level security;
alter table public.bpo_settings enable row level security;
alter table public.bpo_setup_module enable row level security;
alter table public.cfo_base_rules enable row level security;
alter table public.cfo_cnpj_rules enable row level security;
alter table public.cfo_complexity_rules enable row level security;
alter table public.cfo_segment_rules enable row level security;
alter table public.cfo_governance_rules enable row level security;
alter table public.setup_pricing_rules enable row level security;
alter table public.assessoria_pricing_rules enable row level security;
alter table public.assessoria_settings enable row level security;
alter table public.user_roles enable row level security;
alter table public.admin_audit_logs enable row level security;

-- =========================================================
-- POLICIES — config tables: read for authenticated, write for admin
-- =========================================================
do $$
declare
  t text;
  config_tables text[] := array[
    'diagnostic_questions','cost_parameters','product_recommendations',
    'outcome_texts','maturity_levels','bpo_packages','bpo_settings',
    'bpo_setup_module','cfo_base_rules','cfo_cnpj_rules','cfo_complexity_rules',
    'cfo_segment_rules','cfo_governance_rules','setup_pricing_rules',
    'assessoria_pricing_rules','assessoria_settings'
  ];
begin
  foreach t in array config_tables loop
    execute format('create policy %I on public.%I for select to authenticated using (true)',
                   t || '_select_auth', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_admin_role(auth.uid()))',
                   t || '_insert_admin', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.has_admin_role(auth.uid())) with check (public.has_admin_role(auth.uid()))',
                   t || '_update_admin', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.has_admin_role(auth.uid()))',
                   t || '_delete_admin', t);
  end loop;
end $$;

-- user_roles: user can see own row, admin can see/manage all
create policy user_roles_select_own on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.has_admin_role(auth.uid()));

create policy user_roles_admin_insert on public.user_roles
  for insert to authenticated
  with check (public.has_admin_role(auth.uid()));

create policy user_roles_admin_update on public.user_roles
  for update to authenticated
  using (public.has_admin_role(auth.uid()))
  with check (public.has_admin_role(auth.uid()));

create policy user_roles_admin_delete on public.user_roles
  for delete to authenticated
  using (public.has_admin_role(auth.uid()));

-- admin_audit_logs: admin only
create policy admin_audit_select on public.admin_audit_logs
  for select to authenticated
  using (public.has_admin_role(auth.uid()));

create policy admin_audit_insert on public.admin_audit_logs
  for insert to authenticated
  with check (public.has_admin_role(auth.uid()));
