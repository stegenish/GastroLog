# GastroLog agent notes

- Build for a busy parent: make the basic symptom check-in fast, and keep detail optional.
- Treat all entries as private health information. Authenticate every read and write, keep secrets server-side, and never log entry contents.
- Create good unit tests for behavior and edge cases, especially validation, time handling, authentication, and data mapping. Tests should catch plausible mistakes rather than repeat implementation details.
- Run unit tests, type checking, linting, and a production build before considering a change done. Manually check the core flow when UI changes.
- Do not infer a diagnosis or present food categories as proven causes. The log helps a family and clinician discuss patterns.
- Do not deploy or connect a production database while local testing is in progress unless the user asks.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
