# GastroLog

A small private journal for tracking a child's stomach symptoms, meals, and bowel movements. Built with Next.js for Vercel and Neon Postgres. This is a record to share with a clinician, not a diagnostic tool.

## Local test

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and set `APP_PASSWORD` (at least 12 characters) and `SESSION_SECRET` (at least 32 random characters). Leave `DATABASE_URL` **unset** to use the local development file store.
3. Run `pnpm dev` and open `http://127.0.0.1:3001`. The development server binds only to this computer.
4. Sign in, save a symptom check-in, meal, and bathroom note. Test the daily timeline, delete, and CSV export.

Local entries are written to `data/local-entries.json`, which is ignored by Git. This local store is for testing only; production requires Neon. Do not put real health entries in a shared development computer.

## Neon and Vercel, when ready

1. Create a Neon database. Run [`db/schema.sql`](db/schema.sql) in its SQL editor.
2. Set `DATABASE_URL`, `APP_PASSWORD`, and `SESSION_SECRET` as server-side environment variables for the Vercel project. Use a different strong passphrase from local testing. Do not use a `NEXT_PUBLIC_` prefix.
3. Deploy the project to Vercel after local review. The app refuses to start data access in production without `DATABASE_URL`.

The shared passphrase is intended for one family. All page data, server actions, and CSV export check the signed session. Login attempts are limited per IP; production attempts are tracked in Neon using a keyed hash of the IP address. The CSV contains private health data, so store exported files carefully. For a larger group or individual accounts, replace the shared passphrase with a full authentication provider.

## Checks

Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`.

## Why these fields?

The everyday check-in is limited to stomach pain, nausea, and headache with four levels. Vomiting, fever, and a short note are optional. Meals use broad food groups, and bowel movements are a separate quick record. Bowel changes and diet can be relevant context in recurring abdominal pain; the log does not identify causes. See [HealthyChildren.org](https://www.healthychildren.org/English/health-issues/conditions/abdominal/Pages/Stomachaches-in-Children-Teens.aspx) and [NIDDK](https://www.niddk.nih.gov/health-information/digestive-diseases/irritable-bowel-syndrome-children/diagnosis).
