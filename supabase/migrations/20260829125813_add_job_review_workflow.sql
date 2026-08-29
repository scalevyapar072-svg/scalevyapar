-- Phase 16F.2 review artifact only.
-- Create the final migration path with:
--   supabase migration new add_job_review_workflow
-- Then copy this reviewed body into the CLI-generated migration file.

alter table public.labour_job_posts
  add column if not exists review_status text,
  add column if not exists review_reason text,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz;

update public.labour_job_posts
set
  review_status = 'approved',
  review_reason = null,
  submitted_at = coalesce(submitted_at, published_at::timestamptz, created_at),
  reviewed_at = coalesce(reviewed_at, published_at::timestamptz, updated_at, created_at)
where review_status is null
  and status in ('live', 'expired', 'paused');

do $$
begin
  alter table public.labour_job_posts
    add constraint labour_job_posts_review_status_check
    check (review_status is null or review_status in ('under_review', 'approved', 'rejected'));
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter table public.labour_job_posts
    add constraint labour_job_posts_rejection_reason_check
    check (
      review_status <> 'rejected'
      or nullif(btrim(review_reason), '') is not null
    );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter table public.labour_job_posts
    add constraint labour_job_posts_submission_time_check
    check (review_status <> 'under_review' or submitted_at is not null);
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter table public.labour_job_posts
    add constraint labour_job_posts_review_time_check
    check (review_status not in ('approved', 'rejected') or reviewed_at is not null);
exception
  when duplicate_object then null;
end
$$;

create index if not exists labour_job_posts_review_status_created_at_idx
  on public.labour_job_posts (review_status, created_at desc);

comment on column public.labour_job_posts.review_status is
  'Admin moderation state: under_review, approved, rejected, or null for an unsubmitted draft.';
comment on column public.labour_job_posts.review_reason is
  'Actual admin rejection reason. Required when review_status is rejected.';
comment on column public.labour_job_posts.submitted_at is
  'Timestamp when the company submitted the job for moderation.';
comment on column public.labour_job_posts.reviewed_at is
  'Timestamp when an admin approved or rejected the job.';
