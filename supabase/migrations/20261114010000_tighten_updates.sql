-- Security review fix (Nov 14).
-- Finding: the UPDATE policies on recipe_questions and recipes only checked
-- owner_id, so a user could re-point their own row at someone else's recipe
-- (recipe_id) or dictation (dictation_id). save_shared_recipe then copied the
-- planted questions into other people's lab books.

-- 1. Only the answer columns of a question can change.
revoke update on public.recipe_questions from anon, authenticated;
grant update (answer, answer_source, answered_at) on public.recipe_questions to authenticated;

-- 2. Only the generated content and sharing of a recipe can change.
--    (owner_id, dictation_id, copied_from, created_at are fixed after insert.)
revoke update on public.recipes from anon, authenticated;
grant update (status, draft, recipe, model, prompt_version, share_token, updated_at)
  on public.recipes to authenticated;

-- 3. Re-check parent ownership on update too (defense in depth).
drop policy "owners answer their questions" on public.recipe_questions;
create policy "owners answer their questions" on public.recipe_questions
  for update to authenticated
  using (owner_id = public.requesting_user_id())
  with check (
    owner_id = public.requesting_user_id()
    and exists (select 1 from public.recipes r
                where r.id = recipe_id and r.owner_id = public.requesting_user_id())
  );

-- 4. The share functions only follow rows that belong to the same owner.
create or replace function public.get_shared_recipe(token uuid)
returns table (title text, recipe jsonb, transcript text, dish_name text,
               cook_name text, created_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select r.recipe ->> 'title', r.recipe, d.transcript, d.dish_name, d.cook_name, r.created_at
  from public.recipes r
  join public.dictations d on d.id = r.dictation_id and d.owner_id = r.owner_id
  where r.share_token = token and r.status = 'ready'
$$;

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
  from public.recipe_questions q
  where q.recipe_id = src_recipe.id and q.owner_id = src_recipe.owner_id;

  return new_recipe;
end $$;

-- create or replace keeps existing grants, but restate them to be explicit.
revoke all on function public.get_shared_recipe(uuid) from public;
grant execute on function public.get_shared_recipe(uuid) to anon, authenticated;
revoke all on function public.save_shared_recipe(uuid) from public, anon;
grant execute on function public.save_shared_recipe(uuid) to authenticated;
