-- Idea notes and the cook's words are separate (Nov 15).
-- Student: "Keep ideas note when it is move to develompent. Have a new setction
-- for Cook Their words. If it doesn't have one have a way to add it."
--
-- Ideas and dictations become one kind of lab-book entry (public.dictations):
--   dish_name = title, notes + link = Idea notes, transcript = the cook's words
--   (now optional until someone adds them).

alter table public.dictations
  add column notes text not null default '' check (char_length(notes) <= 5000),
  add column link text check (link is null or (link ~* '^https?://[^\s]+$' and char_length(link) <= 2000));

alter table public.dictations alter column transcript drop not null;
alter table public.dictations drop constraint dictations_transcript_check;
alter table public.dictations add constraint dictations_transcript_check
  check (transcript is null or char_length(transcript) between 1 and 20000);

-- Adding words for the first time isn't an "edit"; only changing existing words is.
create or replace function public.track_transcript_edits()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  if new.transcript is distinct from old.transcript and old.transcript is not null then
    new.original_transcript := coalesce(old.original_transcript, old.transcript);
    new.edited_at := now();
  else
    new.original_transcript := old.original_transcript;
    new.edited_at := old.edited_at;
  end if;
  return new;
end $$;

revoke update on public.dictations from anon, authenticated;
grant update (stage, transcript, dish_name, cook_name, notes, link) on public.dictations to authenticated;

-- Move existing ideas into the one table, keeping their stage and date.
insert into public.dictations (owner_id, dish_name, notes, link, stage, created_at)
select owner_id, title, note, link, stage, created_at from public.ideas;
delete from public.ideas;
-- (public.ideas is now unused; dropped in a later migration once main is merged.)
