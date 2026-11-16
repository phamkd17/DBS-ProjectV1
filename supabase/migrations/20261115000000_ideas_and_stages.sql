-- Ideas, and moving things between Ideas / Development / Finished (Nov 15).
-- Student: "add a way for me to create new ideas a move them between ideas,
-- development and finished".

-- ---------------------------------------------------------------------------
-- 1. Ideas: quick notes and links (photos come in v2).
-- ---------------------------------------------------------------------------
create table public.ideas (
  id         uuid primary key default gen_random_uuid(),
  owner_id   text not null default public.requesting_user_id(),
  title      text not null check (char_length(title) between 1 and 120),
  note       text not null default '' check (char_length(note) <= 5000),
  -- Only http(s) links, so a saved link can never run script when clicked.
  link       text check (link is null or (link ~* '^https?://[^\s]+$' and char_length(link) <= 2000)),
  stage      text not null default 'ideas' check (stage in ('ideas', 'development', 'finished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ideas_owner_idx on public.ideas (owner_id, created_at desc);

alter table public.ideas enable row level security;

create policy "owners read their ideas" on public.ideas
  for select to authenticated using (owner_id = public.requesting_user_id());
create policy "owners add ideas" on public.ideas
  for insert to authenticated with check (owner_id = public.requesting_user_id());
create policy "owners edit their ideas" on public.ideas
  for update to authenticated
  using (owner_id = public.requesting_user_id())
  with check (owner_id = public.requesting_user_id());
create policy "owners delete their ideas" on public.ideas
  for delete to authenticated using (owner_id = public.requesting_user_id());

-- Only the content and stage can change (never owner_id).
revoke update on public.ideas from anon, authenticated;
grant update (title, note, link, stage, updated_at) on public.ideas to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Dictations remember which tab they're in.
-- ---------------------------------------------------------------------------
alter table public.dictations
  add column stage text not null default 'ideas'
  check (stage in ('ideas', 'development', 'finished'));

-- Backfill from where each one is today.
update public.dictations d set stage = case
  when exists (select 1 from public.recipes r where r.dictation_id = d.id and r.status = 'ready') then 'finished'
  when exists (select 1 from public.recipes r where r.dictation_id = d.id) then 'development'
  else 'ideas'
end;

-- Owners may now update a dictation, but ONLY its stage. Her words stay
-- read-only (column grant + the existing forbid_transcript_update trigger).
revoke update on public.dictations from anon, authenticated;
grant update (stage) on public.dictations to authenticated;

create policy "owners move their dictations" on public.dictations
  for update to authenticated
  using (owner_id = public.requesting_user_id())
  with check (owner_id = public.requesting_user_id());

-- ---------------------------------------------------------------------------
-- 3. Copies saved from a link land in Finished.
-- ---------------------------------------------------------------------------
create or replace function public.save_shared_recipe(token uuid)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  me text := public.requesting_user_id();
  src_recipe public.recipes;
  src_dictation public.dictations;
  new_dictation uuid;
  new_recipe uuid;
begin
  if me is null then
    raise exception 'Sign in to save a copy';
  end if;

  select * into src_recipe from public.recipes
  where share_token = token and status = 'ready';
  if not found then
    raise exception 'This link is no longer shared';
  end if;

  select * into src_dictation from public.dictations
  where id = src_recipe.dictation_id and owner_id = src_recipe.owner_id;
  if not found then
    raise exception 'This link is no longer shared';
  end if;

  insert into public.dictations (owner_id, dish_name, cook_name, transcript, copied_from, stage)
  values (me, src_dictation.dish_name, src_dictation.cook_name, src_dictation.transcript, src_dictation.id, 'finished')
  returning id into new_dictation;

  insert into public.recipes (owner_id, dictation_id, status, draft, recipe, model, prompt_version, copied_from)
  values (me, new_dictation, 'ready', src_recipe.draft, src_recipe.recipe,
          src_recipe.model, src_recipe.prompt_version, src_recipe.id)
  returning id into new_recipe;

  insert into public.recipe_questions (owner_id, recipe_id, position, kind, quote, question,
                                       why_it_matters, suggestion, answer, answer_source, answered_at)
  select me, new_recipe, q.position, q.kind, q.quote, q.question,
         q.why_it_matters, q.suggestion, q.answer, q.answer_source, q.answered_at
  from public.recipe_questions q
  where q.recipe_id = src_recipe.id and q.owner_id = src_recipe.owner_id;

  return new_recipe;
end $$;

revoke all on function public.save_shared_recipe(uuid) from public, anon;
grant execute on function public.save_shared_recipe(uuid) to authenticated;
