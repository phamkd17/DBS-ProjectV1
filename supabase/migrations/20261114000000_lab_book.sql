-- Culinary Lab Book v1: private lab books + send by link.
--
-- Identity: Clerk is connected to Supabase as a third-party auth provider, so
-- auth.jwt() ->> 'sub' is the signed-in Clerk user id. Every row has an
-- owner_id, and RLS only lets the owner see or change their own rows.
--
-- Sharing: a recipe with a share_token can be read by anyone who has the
-- token, but only through get_shared_recipe(). Saving a copy goes through
-- save_shared_recipe(). Neither opens up the tables themselves.

create or replace function public.requesting_user_id()
returns text
language sql stable
set search_path = ''
as $$ select nullif(auth.jwt() ->> 'sub', '') $$;

-- ---------------------------------------------------------------------------
-- dictations: the cook's words, verbatim. Never edited.
-- ---------------------------------------------------------------------------
create table public.dictations (
  id          uuid primary key default gen_random_uuid(),
  owner_id    text not null default public.requesting_user_id(),
  dish_name   text check (char_length(dish_name) <= 120),
  cook_name   text check (char_length(cook_name) <= 60),
  transcript  text not null check (char_length(transcript) between 1 and 20000),
  copied_from uuid,                       -- dictation this was copied from, if any
  created_at  timestamptz not null default now()
);

alter table public.dictations enable row level security;

create policy "owners read their dictations" on public.dictations
  for select to authenticated using (owner_id = public.requesting_user_id());
create policy "owners add dictations" on public.dictations
  for insert to authenticated with check (owner_id = public.requesting_user_id());
create policy "owners delete their dictations" on public.dictations
  for delete to authenticated using (owner_id = public.requesting_user_id());
-- No UPDATE policy: her words are never edited. The trigger below backs this up.

create or replace function public.forbid_transcript_update()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  if new.transcript is distinct from old.transcript then
    raise exception 'Transcripts are never edited';
  end if;
  return new;
end $$;

create trigger dictations_transcript_immutable
  before update on public.dictations
  for each row execute function public.forbid_transcript_update();

-- ---------------------------------------------------------------------------
-- recipes: generated from a dictation (pass 1 draft → pass 2 recipe).
-- ---------------------------------------------------------------------------
create table public.recipes (
  id             uuid primary key default gen_random_uuid(),
  owner_id       text not null default public.requesting_user_id(),
  dictation_id   uuid not null references public.dictations(id) on delete cascade,
  status         text not null default 'needs_answers'
                 check (status in ('needs_answers', 'ready', 'failed')),
  draft          jsonb,
  recipe         jsonb,
  model          text,
  prompt_version text,
  share_token    uuid unique,             -- null = not shared
  copied_from    uuid,                    -- recipe this was copied from, if any
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index recipes_owner_idx on public.recipes (owner_id, created_at desc);
create index recipes_dictation_idx on public.recipes (dictation_id);

alter table public.recipes enable row level security;

create policy "owners read their recipes" on public.recipes
  for select to authenticated using (owner_id = public.requesting_user_id());
create policy "owners add recipes" on public.recipes
  for insert to authenticated with check (
    owner_id = public.requesting_user_id()
    and exists (select 1 from public.dictations d
                where d.id = dictation_id and d.owner_id = public.requesting_user_id())
  );
create policy "owners update their recipes" on public.recipes
  for update to authenticated
  using (owner_id = public.requesting_user_id())
  with check (owner_id = public.requesting_user_id());
create policy "owners delete their recipes" on public.recipes
  for delete to authenticated using (owner_id = public.requesting_user_id());

-- ---------------------------------------------------------------------------
-- recipe_questions: what the app asked, and how it was answered.
-- ---------------------------------------------------------------------------
create table public.recipe_questions (
  id             uuid primary key default gen_random_uuid(),
  owner_id       text not null default public.requesting_user_id(),
  recipe_id      uuid not null references public.recipes(id) on delete cascade,
  position       int not null,
  kind           text not null
                 check (kind in ('amount', 'ambiguity', 'missing_step', 'contradiction', 'dictation_error')),
  quote          text not null default '',
  question       text not null,
  why_it_matters text not null default '',
  suggestion     text not null default '',
  answer         text check (char_length(answer) <= 2000),
  answer_source  text check (answer_source in ('user_answer', 'suggestion_accepted', 'suggestion_edited', 'skipped')),
  answered_at    timestamptz
);

create index recipe_questions_recipe_idx on public.recipe_questions (recipe_id, position);

alter table public.recipe_questions enable row level security;

create policy "owners read their questions" on public.recipe_questions
  for select to authenticated using (owner_id = public.requesting_user_id());
create policy "owners add questions" on public.recipe_questions
  for insert to authenticated with check (
    owner_id = public.requesting_user_id()
    and exists (select 1 from public.recipes r
                where r.id = recipe_id and r.owner_id = public.requesting_user_id())
  );
create policy "owners answer their questions" on public.recipe_questions
  for update to authenticated
  using (owner_id = public.requesting_user_id())
  with check (owner_id = public.requesting_user_id());

-- ---------------------------------------------------------------------------
-- Sharing by link
-- ---------------------------------------------------------------------------

-- Anyone with the token can read that one finished recipe (and its transcript).
create or replace function public.get_shared_recipe(token uuid)
returns table (title text, recipe jsonb, transcript text, dish_name text,
               cook_name text, created_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select r.recipe ->> 'title', r.recipe, d.transcript, d.dish_name, d.cook_name, r.created_at
  from public.recipes r
  join public.dictations d on d.id = r.dictation_id
  where r.share_token = token and r.status = 'ready'
$$;

revoke all on function public.get_shared_recipe(uuid) from public;
grant execute on function public.get_shared_recipe(uuid) to anon, authenticated;

-- A signed-in person saves a copy of a shared recipe into their own lab book.
-- Copies keep the transcript and every source label, unchanged.
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

  select * into src_dictation from public.dictations where id = src_recipe.dictation_id;

  insert into public.dictations (owner_id, dish_name, cook_name, transcript, copied_from)
  values (me, src_dictation.dish_name, src_dictation.cook_name, src_dictation.transcript, src_dictation.id)
  returning id into new_dictation;

  insert into public.recipes (owner_id, dictation_id, status, draft, recipe, model, prompt_version, copied_from)
  values (me, new_dictation, 'ready', src_recipe.draft, src_recipe.recipe,
          src_recipe.model, src_recipe.prompt_version, src_recipe.id)
  returning id into new_recipe;

  insert into public.recipe_questions (owner_id, recipe_id, position, kind, quote, question,
                                       why_it_matters, suggestion, answer, answer_source, answered_at)
  select me, new_recipe, q.position, q.kind, q.quote, q.question,
         q.why_it_matters, q.suggestion, q.answer, q.answer_source, q.answered_at
  from public.recipe_questions q where q.recipe_id = src_recipe.id;

  return new_recipe;
end $$;

-- Supabase also grants EXECUTE to anon directly, so revoke that too.
revoke all on function public.save_shared_recipe(uuid) from public, anon;
grant execute on function public.save_shared_recipe(uuid) to authenticated;
