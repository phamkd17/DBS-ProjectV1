-- Dictations become editable (student's decision, Nov 15: "Always editable").
-- Replaces the proposal rule "her words are never edited". To stay honest:
--   * the first version is kept automatically in original_transcript, and
--   * edited_at records when the words last changed (the app flags recipes
--     made before an edit).

alter table public.dictations
  add column original_transcript text,
  add column edited_at timestamptz;

drop trigger dictations_transcript_immutable on public.dictations;
drop function public.forbid_transcript_update();

create or replace function public.track_transcript_edits()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  if new.transcript is distinct from old.transcript then
    -- Keep the very first version, once.
    new.original_transcript := coalesce(old.original_transcript, old.transcript);
    new.edited_at := now();
  else
    -- Clients can't rewrite history directly.
    new.original_transcript := old.original_transcript;
    new.edited_at := old.edited_at;
  end if;
  return new;
end $$;

create trigger dictations_track_edits
  before update on public.dictations
  for each row execute function public.track_transcript_edits();

-- Owners may now change the words, names, and stage (never owner_id,
-- copied_from, original_transcript, or edited_at).
revoke update on public.dictations from anon, authenticated;
grant update (stage, transcript, dish_name, cook_name) on public.dictations to authenticated;
-- (The "owners move their dictations" UPDATE policy already limits rows to the owner.)
