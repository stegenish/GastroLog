# Code review — 2026-09-16

## Findings

1. **High — storage errors can reach the browser.** `createEntryAction` catches both validation and persistence errors, then returns most `Error.message` values. A file or database error could expose internal details. Split validation from saving and return a generic persistence error.
2. **Medium — invalid calendar dates are accepted.** `new Date()` normalizes values such as `2026-02-31T10:00:00Z` to March 3. Require a timestamp with a timezone and reject normalized calendar dates.
3. **Medium — dashboard cohesion.** One client component owns entry forms, weekly calculations, date navigation, timeline rendering, and mutation state. Extract the form and journal views, and put date calculations in a tested helper.
4. **Medium — duplicated storage setup and missing behavioral tests.** The entry store and login guard each choose local versus Neon and create a Neon client. Centralize this choice. Add tests for local persistence, login throttling, date grouping, and action error behavior.
5. **Medium — empty-day shortcut uses the wrong day and stale feedback.** When viewing an earlier day, “Add a check-in” leaves the form time on today and can retain a previous save message. Prefill the selected day and reset the form state.
6. **Medium — a long-open tab can record the wrong time.** The form initially captures the clock once, so a later submission can silently use an old timestamp. Refresh untouched defaults and the current-day view while the tab remains open.
7. **Low — temporary local entry files need Git protection.** Atomic local writes can leave a `.tmp` file after a crash. Ignore the entire `data/` directory.

## Resolution

All seven findings above have been fixed. Validation and persistence failures now have separate handling. Timestamps require a real calendar date and timezone. The dashboard delegates to dedicated form, weekly view, and timeline components; date calculations and storage adapters are separate. The prior-day shortcut now resets the form and prefills that day. Untouched time defaults advance while the tab stays open, and the entire local `data/` directory is ignored by Git.

Added behavior-focused tests for validation, persistence, throttling, date handling, action authorization, and export authorization. **30 unit tests pass**, as do type checking, linting, and a production build. In the local browser, symptom and meal saves appeared in the timeline, and the prior-day shortcut saved to the selected day.

Neon queries have not been exercised against a live database because no `DATABASE_URL` is configured. This is the remaining integration check before deployment.
