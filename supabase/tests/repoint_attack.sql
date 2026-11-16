-- Security review finding (Nov 14): a user could re-point their own question
-- (recipe_id) or recipe (dictation_id) at someone else's row. Rolled back.
-- Expected after 20261114010000_tighten_updates.sql:
--   owner_answer_saved = '2 tbsp', eve_copy_saved = true,
--   repoint_question = 'blocked: permission denied…', repoint_recipe = 'blocked: permission denied…'
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"victim_A","role":"authenticated"}', true);
insert into public.dictations (id, transcript) values ('00000000-0000-0000-0000-0000000000aa', 'her words');
insert into public.recipes (id, dictation_id, status, recipe, share_token)
values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000aa', 'ready', '{"title":"T"}', '11111111-1111-1111-1111-111111111111');
insert into public.recipe_questions (id, recipe_id, position, kind, question) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 0, 'amount', 'how much?');
update public.recipe_questions set answer='2 tbsp', answer_source='user_answer', answered_at=now() where id='00000000-0000-0000-0000-0000000000b1';
select set_config('t.normal_ok', (select answer from public.recipe_questions where id='00000000-0000-0000-0000-0000000000b1'), true);

select set_config('request.jwt.claims', '{"sub":"eve","role":"authenticated"}', true);
select set_config('t.copy', public.save_shared_recipe('11111111-1111-1111-1111-111111111111')::text, true);
select set_config('t.eve_qid', (select id::text from public.recipe_questions limit 1), true);
do $$ begin
  begin
    update public.recipe_questions set recipe_id = '00000000-0000-0000-0000-0000000000a1' where id = current_setting('t.eve_qid')::uuid;
    perform set_config('t.attack', 'ALLOWED (bad)', true);
  exception when insufficient_privilege then perform set_config('t.attack', 'blocked: ' || sqlerrm, true);
  end;
end $$;
do $$ begin
  begin
    update public.recipes set dictation_id = '00000000-0000-0000-0000-0000000000aa';
    perform set_config('t.attack2', 'ALLOWED (bad)', true);
  exception when insufficient_privilege then perform set_config('t.attack2', 'blocked: ' || sqlerrm, true);
  end;
end $$;
select current_setting('t.normal_ok') as owner_answer_saved,
       current_setting('t.copy') is not null as eve_copy_saved,
       current_setting('t.attack') as repoint_question,
       current_setting('t.attack2') as repoint_recipe;
rollback;
