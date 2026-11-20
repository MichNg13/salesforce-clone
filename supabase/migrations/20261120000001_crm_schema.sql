-- =====================================================================
-- Summit CRM — core schema
-- Objects: profiles, accounts, contacts, leads, opportunities, products,
--          opportunity_products (line items), cases, activities
-- Sharing model: "Public Read/Write" inside the org — any signed-in user
-- can read and edit every record; only the record owner or an admin can
-- delete. Roles live on profiles and cannot be self-escalated.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  title       text,
  avatar_url  text,
  role        text not null default 'user' check (role in ('admin', 'user')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Helpers that policies call live in a schema the API doesn't expose.
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

-- Create a profile for every new auth user. The first user becomes admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when exists (select 1 from public.profiles) then 'user' else 'admin' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------
create table public.accounts (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null check (length(trim(name)) > 0),
  type               text check (type in ('Prospect', 'Customer', 'Partner', 'Reseller', 'Competitor', 'Other')),
  industry           text,
  rating             text check (rating in ('Hot', 'Warm', 'Cold')),
  website            text,
  phone              text,
  annual_revenue     numeric(16, 2) check (annual_revenue >= 0),
  employees          integer check (employees >= 0),
  billing_street     text,
  billing_city       text,
  billing_state      text,
  billing_postal_code text,
  billing_country    text,
  description        text,
  parent_account_id  uuid references public.accounts (id) on delete set null,
  owner_id           uuid default auth.uid() references public.profiles (id) on delete set null,
  created_by         uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Contacts
-- ---------------------------------------------------------------------
create table public.contacts (
  id                 uuid primary key default gen_random_uuid(),
  salutation         text check (salutation in ('Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.')),
  first_name         text,
  last_name          text not null check (length(trim(last_name)) > 0),
  full_name          text generated always as (coalesce(first_name || ' ', '') || last_name) stored,
  account_id         uuid references public.accounts (id) on delete set null,
  title              text,
  department         text,
  email              text,
  phone              text,
  mobile             text,
  lead_source        text,
  mailing_street     text,
  mailing_city       text,
  mailing_state      text,
  mailing_postal_code text,
  mailing_country    text,
  birthdate          date,
  description        text,
  owner_id           uuid default auth.uid() references public.profiles (id) on delete set null,
  created_by         uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Opportunities
-- ---------------------------------------------------------------------
create table public.opportunities (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null check (length(trim(name)) > 0),
  account_id         uuid references public.accounts (id) on delete set null,
  contact_id         uuid references public.contacts (id) on delete set null,
  stage              text not null default 'Prospecting' check (stage in (
                       'Prospecting', 'Qualification', 'Needs Analysis', 'Proposal',
                       'Negotiation', 'Closed Won', 'Closed Lost')),
  amount             numeric(16, 2) check (amount >= 0),
  probability        integer check (probability between 0 and 100),
  close_date         date not null default (current_date + 30),
  type               text check (type in ('New Business', 'Existing Business', 'Renewal', 'Upsell')),
  lead_source        text,
  next_step          text,
  description        text,
  is_closed          boolean generated always as (stage in ('Closed Won', 'Closed Lost')) stored,
  is_won             boolean generated always as (stage = 'Closed Won') stored,
  owner_id           uuid default auth.uid() references public.profiles (id) on delete set null,
  created_by         uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Default probability from stage when it isn't set explicitly, or when the stage changes.
create or replace function public.opportunity_stage_probability()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.probability is null
     or tg_op = 'UPDATE' and new.stage is distinct from old.stage
                         and new.probability is not distinct from old.probability then
    new.probability := case new.stage
      when 'Prospecting'    then 10
      when 'Qualification'  then 20
      when 'Needs Analysis' then 40
      when 'Proposal'       then 60
      when 'Negotiation'    then 80
      when 'Closed Won'     then 100
      when 'Closed Lost'    then 0
    end;
  end if;
  return new;
end;
$$;

create trigger opportunities_stage_probability
  before insert or update on public.opportunities
  for each row execute function public.opportunity_stage_probability();

-- ---------------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------------
create table public.leads (
  id                       uuid primary key default gen_random_uuid(),
  salutation               text check (salutation in ('Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.')),
  first_name               text,
  last_name                text not null check (length(trim(last_name)) > 0),
  full_name                text generated always as (coalesce(first_name || ' ', '') || last_name) stored,
  company                  text not null check (length(trim(company)) > 0),
  title                    text,
  email                    text,
  phone                    text,
  website                  text,
  status                   text not null default 'New' check (status in (
                             'New', 'Working', 'Nurturing', 'Qualified', 'Unqualified', 'Converted')),
  rating                   text check (rating in ('Hot', 'Warm', 'Cold')),
  lead_source              text check (lead_source in (
                             'Web', 'Phone Inquiry', 'Partner Referral', 'Trade Show',
                             'Advertisement', 'Email Campaign', 'Other')),
  industry                 text,
  annual_revenue           numeric(16, 2) check (annual_revenue >= 0),
  employees                integer check (employees >= 0),
  street                   text,
  city                     text,
  state                    text,
  postal_code              text,
  country                  text,
  description              text,
  converted_at             timestamptz,
  converted_account_id     uuid references public.accounts (id) on delete set null,
  converted_contact_id     uuid references public.contacts (id) on delete set null,
  converted_opportunity_id uuid references public.opportunities (id) on delete set null,
  owner_id                 uuid default auth.uid() references public.profiles (id) on delete set null,
  created_by               uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Products & opportunity line items
-- ---------------------------------------------------------------------
create table public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (length(trim(name)) > 0),
  product_code text unique,
  family       text check (family in ('Software', 'Hardware', 'Services', 'Support', 'Training')),
  list_price   numeric(16, 2) not null default 0 check (list_price >= 0),
  is_active    boolean not null default true,
  description  text,
  owner_id     uuid default auth.uid() references public.profiles (id) on delete set null,
  created_by   uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.opportunity_products (
  id             uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  product_id     uuid not null references public.products (id) on delete restrict,
  quantity       numeric(12, 2) not null default 1 check (quantity > 0),
  unit_price     numeric(16, 2) check (unit_price >= 0),  -- defaults to product list price
  discount       numeric(5, 2) not null default 0 check (discount between 0 and 100),
  total_price    numeric(18, 2) generated always as (round(quantity * unit_price * (1 - discount / 100), 2)) stored,
  description    text,
  owner_id       uuid default auth.uid() references public.profiles (id) on delete set null,
  created_by     uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Default a line item's price from the product's list price.
create or replace function public.default_line_item_price()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.unit_price is null then
    select list_price into new.unit_price from public.products where id = new.product_id;
  end if;
  new.unit_price := coalesce(new.unit_price, 0);
  return new;
end;
$$;

create trigger opportunity_products_default_price
  before insert or update on public.opportunity_products
  for each row execute function public.default_line_item_price();

-- Keep opportunity.amount equal to the sum of its line items once it has any.
create or replace function public.recalc_opportunity_amount(p_opportunity_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.opportunities o
     set amount = (select coalesce(sum(li.total_price), 0)
                     from public.opportunity_products li
                    where li.opportunity_id = p_opportunity_id)
   where o.id = p_opportunity_id;
$$;

create or replace function public.rollup_opportunity_amount()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.recalc_opportunity_amount(new.opportunity_id);
  end if;
  if tg_op in ('UPDATE', 'DELETE') then
    if tg_op = 'DELETE' or old.opportunity_id is distinct from new.opportunity_id then
      perform public.recalc_opportunity_amount(old.opportunity_id);
    end if;
  end if;
  return null;
end;
$$;

create trigger opportunity_products_rollup
  after insert or update or delete on public.opportunity_products
  for each row execute function public.rollup_opportunity_amount();

-- ---------------------------------------------------------------------
-- Cases (customer support)
-- ---------------------------------------------------------------------
create sequence public.case_number_seq start 1001;

create table public.cases (
  id           uuid primary key default gen_random_uuid(),
  case_number  text not null unique default lpad(nextval('public.case_number_seq')::text, 8, '0'),
  subject      text not null check (length(trim(subject)) > 0),
  account_id   uuid references public.accounts (id) on delete set null,
  contact_id   uuid references public.contacts (id) on delete set null,
  status       text not null default 'New' check (status in ('New', 'Working', 'Escalated', 'On Hold', 'Closed')),
  priority     text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  origin       text check (origin in ('Email', 'Phone', 'Web', 'Chat', 'Other')),
  type         text check (type in ('Question', 'Problem', 'Feature Request', 'Other')),
  description  text,
  resolution   text,
  closed_at    timestamptz,
  owner_id     uuid default auth.uid() references public.profiles (id) on delete set null,
  created_by   uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.case_closed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'Closed' and (tg_op = 'INSERT' or old.status is distinct from 'Closed') then
    new.closed_at := now();
  elsif new.status <> 'Closed' then
    new.closed_at := null;
  end if;
  return new;
end;
$$;

create trigger cases_closed_at
  before insert or update on public.cases
  for each row execute function public.case_closed_at();

-- ---------------------------------------------------------------------
-- Activities (tasks, calls, emails, meetings, notes)
-- Linked to any combination of CRM records.
-- ---------------------------------------------------------------------
create table public.activities (
  id             uuid primary key default gen_random_uuid(),
  subject        text not null check (length(trim(subject)) > 0),
  type           text not null default 'Task' check (type in ('Task', 'Call', 'Email', 'Meeting', 'Note')),
  status         text not null default 'Not Started' check (status in ('Not Started', 'In Progress', 'Waiting', 'Completed', 'Deferred')),
  priority       text not null default 'Normal' check (priority in ('Low', 'Normal', 'High')),
  due_date       date,
  description    text,
  account_id     uuid references public.accounts (id) on delete cascade,
  contact_id     uuid references public.contacts (id) on delete cascade,
  lead_id        uuid references public.leads (id) on delete cascade,
  opportunity_id uuid references public.opportunities (id) on delete cascade,
  case_id        uuid references public.cases (id) on delete cascade,
  completed_at   timestamptz,
  owner_id       uuid default auth.uid() references public.profiles (id) on delete set null,
  created_by     uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create or replace function public.activity_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'Completed' and (tg_op = 'INSERT' or old.status is distinct from 'Completed') then
    new.completed_at := now();
  elsif new.status <> 'Completed' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger activities_completed_at
  before insert or update on public.activities
  for each row execute function public.activity_completed_at();

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['profiles', 'accounts', 'contacts', 'opportunities', 'leads',
                           'products', 'opportunity_products', 'cases', 'activities']
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_updated_at', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Indexes (foreign keys, owners, common sorts & searches)
-- ---------------------------------------------------------------------
create extension if not exists pg_trgm with schema extensions;

create index accounts_owner_idx            on public.accounts (owner_id);
create index accounts_parent_idx           on public.accounts (parent_account_id);
create index accounts_created_by_idx       on public.accounts (created_by);
create index accounts_name_trgm            on public.accounts using gin (name extensions.gin_trgm_ops);

create index contacts_account_idx          on public.contacts (account_id);
create index contacts_owner_idx            on public.contacts (owner_id);
create index contacts_created_by_idx       on public.contacts (created_by);
create index contacts_name_trgm            on public.contacts using gin (full_name extensions.gin_trgm_ops);

create index opportunities_account_idx     on public.opportunities (account_id);
create index opportunities_contact_idx     on public.opportunities (contact_id);
create index opportunities_owner_idx       on public.opportunities (owner_id);
create index opportunities_created_by_idx  on public.opportunities (created_by);
create index opportunities_stage_idx       on public.opportunities (stage, close_date);

create index leads_owner_idx               on public.leads (owner_id);
create index leads_created_by_idx          on public.leads (created_by);
create index leads_status_idx              on public.leads (status);
create index leads_conv_account_idx        on public.leads (converted_account_id);
create index leads_conv_contact_idx        on public.leads (converted_contact_id);
create index leads_conv_opp_idx            on public.leads (converted_opportunity_id);
create index leads_name_trgm               on public.leads using gin (full_name extensions.gin_trgm_ops);

create index products_owner_idx            on public.products (owner_id);
create index products_created_by_idx       on public.products (created_by);

create index opp_products_opportunity_idx  on public.opportunity_products (opportunity_id);
create index opp_products_product_idx      on public.opportunity_products (product_id);
create index opp_products_owner_idx        on public.opportunity_products (owner_id);
create index opp_products_created_by_idx   on public.opportunity_products (created_by);

create index cases_account_idx             on public.cases (account_id);
create index cases_contact_idx             on public.cases (contact_id);
create index cases_owner_idx               on public.cases (owner_id);
create index cases_created_by_idx          on public.cases (created_by);
create index cases_status_idx              on public.cases (status);

create index activities_account_idx        on public.activities (account_id);
create index activities_contact_idx        on public.activities (contact_id);
create index activities_lead_idx           on public.activities (lead_id);
create index activities_opportunity_idx    on public.activities (opportunity_id);
create index activities_case_idx           on public.activities (case_id);
create index activities_owner_idx          on public.activities (owner_id, status, due_date);
create index activities_created_by_idx     on public.activities (created_by);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "Profiles are visible to signed-in users"
  on public.profiles for select to authenticated using (true);

create policy "Users update their own profile, admins update any"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id or (select private.is_admin()))
  with check ((select auth.uid()) = id or (select private.is_admin()));

-- Only admins may change roles (column-level guard).
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not private.is_admin() then
    raise exception 'Only admins can change user roles';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

do $$
declare t text;
begin
  foreach t in array array['accounts', 'contacts', 'opportunities', 'leads',
                           'products', 'opportunity_products', 'cases', 'activities']
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format($p$create policy "Signed-in users can read" on public.%I
      for select to authenticated using (true)$p$, t);

    execute format($p$create policy "Signed-in users can create" on public.%I
      for insert to authenticated with check (created_by = (select auth.uid()))$p$, t);

    execute format($p$create policy "Signed-in users can edit" on public.%I
      for update to authenticated using (true) with check (true)$p$, t);

    execute format($p$create policy "Owners and admins can delete" on public.%I
      for delete to authenticated
      using (owner_id = (select auth.uid()) or (select private.is_admin()))$p$, t);
  end loop;
end;
$$;

-- created_by is set by the database, never by the client.
create or replace function public.stamp_created_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_by := auth.uid();
  if new.owner_id is null then
    new.owner_id := auth.uid();
  end if;
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['accounts', 'contacts', 'opportunities', 'leads',
                           'products', 'opportunity_products', 'cases', 'activities']
  loop
    execute format(
      'create trigger %I before insert on public.%I for each row execute function public.stamp_created_by()',
      t || '_stamp_created_by', t);
  end loop;
end;
$$;

-- Don't let clients rewrite who created a record.
create or replace function public.keep_created_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['accounts', 'contacts', 'opportunities', 'leads',
                           'products', 'opportunity_products', 'cases', 'activities']
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.keep_created_by()',
      t || '_keep_created_by', t);
  end loop;
end;
$$;

-- Trigger/helper functions aren't meant to be called through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rollup_opportunity_amount() from public, anon, authenticated;
revoke execute on function public.recalc_opportunity_amount(uuid) from public, anon, authenticated;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;
grant usage, select on sequence public.case_number_seq to authenticated;

-- ---------------------------------------------------------------------
-- Lead conversion: Lead -> Account (+ Contact) (+ Opportunity)
-- Runs with the caller's permissions, so RLS still applies.
-- ---------------------------------------------------------------------
create or replace function public.convert_lead(
  p_lead_id uuid,
  p_account_id uuid default null,          -- attach to an existing account instead of creating one
  p_create_opportunity boolean default true,
  p_opportunity_name text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  l           public.leads%rowtype;
  v_account   uuid;
  v_contact   uuid;
  v_opp       uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into l from public.leads where id = p_lead_id for update;
  if not found then
    raise exception 'Lead not found';
  end if;
  if l.converted_at is not null then
    raise exception 'Lead has already been converted';
  end if;

  if p_account_id is not null then
    select id into v_account from public.accounts where id = p_account_id;
    if v_account is null then
      raise exception 'Account not found';
    end if;
  else
    insert into public.accounts (name, industry, website, phone, annual_revenue, employees,
                                 billing_street, billing_city, billing_state, billing_postal_code,
                                 billing_country, rating, type, owner_id)
    values (l.company, l.industry, l.website, l.phone, l.annual_revenue, l.employees,
            l.street, l.city, l.state, l.postal_code, l.country, l.rating, 'Prospect',
            coalesce(l.owner_id, auth.uid()))
    returning id into v_account;
  end if;

  insert into public.contacts (salutation, first_name, last_name, account_id, title, email, phone,
                               lead_source, mailing_street, mailing_city, mailing_state,
                               mailing_postal_code, mailing_country, description, owner_id)
  values (l.salutation, l.first_name, l.last_name, v_account, l.title, l.email, l.phone,
          l.lead_source, l.street, l.city, l.state, l.postal_code, l.country, l.description,
          coalesce(l.owner_id, auth.uid()))
  returning id into v_contact;

  if p_create_opportunity then
    insert into public.opportunities (name, account_id, contact_id, lead_source, type, owner_id)
    values (coalesce(nullif(trim(p_opportunity_name), ''), l.company || ' - New Deal'),
            v_account, v_contact, l.lead_source, 'New Business', coalesce(l.owner_id, auth.uid()))
    returning id into v_opp;
  end if;

  -- Move the lead's open activities onto the new records.
  update public.activities
     set contact_id = v_contact, account_id = v_account,
         opportunity_id = coalesce(opportunity_id, v_opp)
   where lead_id = p_lead_id;

  update public.leads
     set status = 'Converted', converted_at = now(),
         converted_account_id = v_account, converted_contact_id = v_contact,
         converted_opportunity_id = v_opp
   where id = p_lead_id;

  return jsonb_build_object('account_id', v_account, 'contact_id', v_contact, 'opportunity_id', v_opp);
end;
$$;

revoke execute on function public.convert_lead(uuid, uuid, boolean, text) from public, anon;
grant execute on function public.convert_lead(uuid, uuid, boolean, text) to authenticated;

-- ---------------------------------------------------------------------
-- Reporting views (respect the caller's RLS)
-- ---------------------------------------------------------------------
create view public.pipeline_by_stage
with (security_invoker = true) as
select stage,
       count(*)::int                         as deal_count,
       coalesce(sum(amount), 0)              as total_amount,
       coalesce(sum(amount * probability / 100.0), 0) as weighted_amount
from public.opportunities
group by stage;

create view public.lead_funnel
with (security_invoker = true) as
select status, count(*)::int as lead_count
from public.leads
group by status;

create view public.cases_by_status
with (security_invoker = true) as
select status, priority, count(*)::int as case_count
from public.cases
group by status, priority;
