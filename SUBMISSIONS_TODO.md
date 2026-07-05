# Submissions / Moderation TODO

- [ ] Rework the submission flow:
  `PENDING -> NEEDS_CHANGES -> RESUBMITTED -> APPROVED / REJECTED`.

- [ ] Do not treat every rejection as final.
  Use `NEEDS_CHANGES` when a moderator wants the author to fix the submission.

- [ ] Store moderator feedback in `reviewComment`.
  Example: "Improve the description and add a cover image."

- [ ] Add a user-facing "My submissions" page.
  It should show pending, needs changes, approved, and rejected submissions.

- [ ] Show a top-right notification when a user has a submission that needs changes.

- [ ] Allow the author to edit a submission when its status is `NEEDS_CHANGES`.

- [ ] Add a "Submit again" action.
  After resubmission, move the status back to `PENDING` or `RESUBMITTED`.

- [ ] On approval:
  - create a `Title`
  - connect genres
  - mark the `TitleSubmission` as `APPROVED`
  - save `reviewedById`
  - save `reviewComment` if provided

- [ ] Decide whether approved submissions should count as user contributions.

- [ ] Build a proper `/titles` page.
  It should include search, type filters, genre display, cover images, and an "add to library" action.

- [ ] Make approved submissions appear in the public titles list automatically.
