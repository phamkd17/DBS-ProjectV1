-- Manual RLS checks. Run in the Supabase SQL editor (or via MCP).
-- Everything is inside a transaction that is rolled back, so nothing is kept.
-- Expected (Nov 13 run): a_sees_own=1, b_sees_a=0, anon_sees=0,
--   owner_edit_rows_changed=0, anon_with_link=1, anon_wrong_link=0,
--   b_recipes_after_save=1, b_copy_transcript='her words'

begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"user_A","role":"authenticated"}', true);
insert into public.dictations (id, transcript) values ('00000000-0000-0000-0000-00000000000a', 'her words');
select set_config('t.a_sees_own', (select count(*) from public.dictations)::text, true);
with u as (update public.dictations set transcript = 'edited!' returning 1)
select set_config('t.edit_rows', (select count(*) from u)::text, true);
insert into public.recipes (dictation_id, status, recipe, share_token)
values ('00000000-0000-0000-0000-00000000000a', 'ready', '{"title":"Test"}', '11111111-1111-1111-1111-111111111111');

select set_config('request.jwt.claims', '{"sub":"user_B","role":"authenticated"}', true);
select set_config('t.b_sees_a', (select count(*) from public.dictations)::text, true);

reset role; set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select set_config('t.anon_sees', (select count(*) from public.dictations)::text, true);
select set_config('t.anon_link', (select count(*) from public.get_shared_recipe('11111111-1111-1111-1111-111111111111'))::text, true);
select set_config('t.anon_wrong_link', (select count(*) from public.get_shared_recipe('22222222-2222-2222-2222-222222222222'))::text, true);

reset role; set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"user_B","role":"authenticated"}', true);
select public.save_shared_recipe('11111111-1111-1111-1111-111111111111');
select set_config('t.b_recipes', (select count(*) from public.recipes)::text, true);
select set_config('t.b_words', (select transcript from public.dictations limit 1), true);

select current_setting('t.a_sees_own') as a_sees_own,
       current_setting('t.b_sees_a') as b_sees_a,
       current_setting('t.anon_sees') as anon_sees,
       current_setting('t.edit_rows') as owner_edit_rows_changed,
       current_setting('t.anon_link') as anon_with_link,
       current_setting('t.anon_wrong_link') as anon_wrong_link,
       current_setting('t.b_recipes') as b_recipes_after_save,
       current_setting('t.b_words') as b_copy_transcript;
rollback;
