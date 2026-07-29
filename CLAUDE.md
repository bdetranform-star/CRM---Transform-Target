# Transform Targets CRM

A cold-outreach CRM for the Facility Maintenance / IFM industry, tracking leads
across four channels — Email, LinkedIn, Cold Calling, and SMS/Text.

## Tech stack

- **Next.js 15** (App Router, TypeScript, React 19)
- **Prisma ORM** on **PostgreSQL** (e.g. Neon) — required in production since
  Vercel's filesystem is ephemeral and won't persist a SQLite file across
  deploys/instances. `npm run build` runs `prisma generate && prisma migrate
  deploy` before `next build` so migrations apply automatically on deploy.
- **NextAuth.js v5 (beta)** — credentials provider (email/password), JWT sessions
- **Tailwind CSS v4** + a hand-rolled shadcn/ui-style component set (`components/ui`)
- **TanStack Table** — the Contacts table view
- **dnd-kit** — the Kanban board drag-and-drop
- **react-hook-form + zod** — every form and every mutation's server-side validation
- **papaparse** — CSV import/export
- **Recharts** — the reporting dashboard

## Architecture

### Routing

- `app/login/page.tsx` — public login page.
- `app/setup/page.tsx` — public one-time bootstrap page: a form to create the
  first admin login (email + password) when the `User` table is empty. See
  "Data layer" below for how reuse is prevented.
- `app/(app)/` — route group for everything behind auth, sharing
  `app/(app)/layout.tsx` (navy `Sidebar` + `Topbar` shell). Pages:
  - `/` — Board (Kanban) view, the default view
  - `/contacts` — Table view
  - `/calls` — Call Queue (cold calling module)
  - `/linkedin` — LinkedIn Tasks
  - `/sms-templates` — SMS template manager
  - `/dashboard` — reporting dashboard + sequence tracker widget
  - `/import-export` — CSV import/export
- `middleware.ts` — protects every route except `/login`, `/setup`,
  `/api/auth/*`, and `/api/webhooks/*` (external callers like Instantly.ai
  can't send a session cookie; that route authenticates itself via a shared
  secret instead).

### Data layer

- `lib/prisma.ts` — the singleton `PrismaClient` (standard Next.js dev-mode
  global-cache pattern to survive HMR).
- `prisma/schema.prisma` — see "Data model" below.
- `prisma/seed.ts` — seeds 6 realistic sample leads (one per lead status /
  industry, with matching touch history), 100 placeholder `contactOwner`
  emails in the pattern `first.last@transformtargets-*.com`, and 3 starter
  SMS templates. Run with `npx prisma db seed` (wired up via
  `prisma.config.ts`).
  - By default it also seeds a demo login (`admin@transformtargets.com` /
    `password123`) — fine for local dev, but that hardcoded password
    shouldn't land in a real deployment. Set `SKIP_DEMO_SEED=true` to skip
    it; pair that with `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars to seed a
    real admin login instead (bcrypt-hashed like any other user), if you'd
    rather bootstrap via a deploy script than the `/setup` page below.
  - The **first admin account for a production deploy is normally created
    through `/setup`** (`app/setup/page.tsx`, `app/actions/setup.ts`), not
    this script: a public, one-time-use page that renders a create-account
    form only while `User` has zero rows. `createFirstAdmin` re-checks the
    count is still zero inside a transaction immediately before inserting,
    so the first submission (from this page, or a direct call from anyone
    who finds the URL) wins and every later one is rejected — no auth guard
    is possible before an account exists, so this check is the only thing
    standing in for one. Once any user exists, `/setup` just shows "already
    completed" and links to `/login`.

### Mutations: Server Actions, not API routes (except where a route is required)

Almost all writes go through **Server Actions** in `app/actions/*.ts`
(`"use server"` files), each of which:
1. Calls `requireAuth()` (`lib/require-auth.ts`) first — never trust the
   middleware alone, since Server Actions are directly callable.
2. Validates its input with a zod schema from `lib/validations.ts` (input type
   is always `unknown` at the function boundary).
3. Runs the Prisma call, then `revalidatePath(...)` the affected pages.

API routes under `app/api/` exist only where a Server Action doesn't fit:
- `app/api/auth/[...nextauth]/route.ts` — NextAuth handler.
- `app/api/contacts/export/route.ts` — CSV download (needs to set
  `Content-Disposition`, can't be a Server Action).
- `app/api/contacts/import/route.ts` — bulk insert from client-parsed CSV JSON.
- `app/api/webhooks/instantly/route.ts` — Instantly.ai webhook receiver.

**A `"use server"` file may only export async functions** (plus types) — pure
helpers like `fillTemplateTokens` or `mapCsvRows` live in `lib/`, not
`app/actions/`.

### Key modules

- **Board** (`components/board/`) — `dnd-kit` `DndContext` with one
  `useDroppable` column per `LeadStatus` and one `useDraggable` card per
  contact. Drag end calls the `updateContactStatus` server action; the UI
  updates optimistically via `useOptimistic` before the server confirms.
- **Contacts table** (`components/contacts-table/`) — TanStack Table in
  fully **manual** mode (`manualPagination`/`manualSorting`): sorting, paging,
  and filtering all round-trip through URL search params
  (`?search=&industry=&status=&owner=&sort=&dir=&page=`) into the
  `getContactsTable` server action, which does the real work in Prisma
  (`WHERE`/`ORDER BY`/`skip`/`take`). Row selection is TanStack-table-local
  (per page) and drives the bulk action bar.
- **Contact detail panel** (`components/contact-detail/`) — a `Sheet`
  (slide-over from the right, not a centered dialog) that lazy-fetches the
  full contact + touch history when opened. Reused by the Board, Table, and
  anywhere else a contact needs inspecting. Also doubles as the "new
  contact" form: passing the `NEW_CONTACT_ID` sentinel as `contactId`
  renders `ContactCreateForm` instead of fetching, skipping the quick
  actions/tabs/touch-history that don't make sense before the contact
  exists. The "+ New Contact" buttons on the Board and Contacts table both
  open the panel this way; on success the panel switches itself to normal
  view mode for the newly created contact via `onCreated`.
- **Call Queue** (`components/call-queue/`) — pulls contacts at
  `sequenceStep === 2`, walks through them one at a time client-side (no
  server round trip to advance/skip). Logging a call with outcome
  `CONNECTED` moves `leadStatus → CONNECTED` and `sequenceStep → 3`
  server-side (`logCallTouch` in `app/actions/touches.ts`). The call script
  panel is a plain `localStorage`-backed textarea — no DB model, since the
  spec only calls for "a simple static call script reference panel."
- **LinkedIn Tasks** (`components/linkedin-tasks/`) — same shape, for
  `sequenceStep === 1`. Outcome `CONNECTED` or `REPLIED` advances
  `sequenceStep → 2`.
- **SMS** — template CRUD lives in `app/actions/sms-templates.ts` +
  `components/sms-templates/`. Token replacement (`{{firstName}}`,
  `{{company}}`, `{{industryDetail}}`) is `lib/sms-template-tokens.ts`
  (kept out of `app/actions/` because it's sync, not a Server Action).
  Sending is `sendSms` in `app/actions/touches.ts`, which calls
  `sendSmsViaProvider(...)` — currently a no-op stub that's the single seam
  for dropping in a real Twilio integration later. `smsOptOut` is checked
  server-side before any send; the UI hides the "Send SMS" button and shows
  an opt-out badge when true. "Reply logged" (`markSmsReplied`) flips the
  most recent SMS touch to `REPLIED`, logs an inbound touch, and optionally
  sets `smsOptOut`.
- **Sequence tracker** — `getSequenceCounts()` (counts contacts at each of
  `sequenceStep` 0–3) backs the dashboard widget; `SequenceProgress` renders
  the same 4-step Email → LinkedIn → Call → SMS indicator on the contact panel.
- **Dashboard** (`components/dashboard/`) — Recharts bar/pie/line/bar views
  fed by `app/actions/dashboard.ts`. Uses the CVD-validated 8-hue
  categorical palette in `lib/chart-palette.ts` for the status/industry
  charts, the real per-channel brand colors (`lib/channel-config.tsx`) for
  the channel-activity chart, and a single blue hue for the (single-series)
  weekly line chart.
- **Import/Export** (`components/import-export/`, `lib/csv-import.ts`) —
  import is parsed **client-side** with papaparse, header-detected
  (`detectField`/`isFullNameHeader`/`detectIndustry`), previewed (first 6
  rows), then POSTed as JSON to `/api/contacts/import` for the actual
  zod-validated bulk insert. The route pre-fetches existing emails and
  filters the batch manually rather than relying on `createMany`'s
  `skipDuplicates` (this predates the Postgres switch, when the app ran on
  SQLite, which doesn't support that option — it still works fine on
  Postgres, just could be simplified to `skipDuplicates: true` if desired).
  The "default contact owner" dropdown is populated by `getContactOwnerPool()`
  (`app/actions/contacts.ts`), not `getContactOwners()` — see the
  `lib/contact-owners.ts` note under "Data model" below for why that
  distinction matters.
- **Instantly.ai webhook** (`app/api/webhooks/instantly/route.ts`,
  `lib/instantly.ts`) — verifies a shared secret
  (`INSTANTLY_WEBHOOK_SECRET`, checked against the `x-instantly-secret`
  header or `?secret=`) if one is configured, validates the payload, logs an
  inbound `EMAIL` touch, and maps `email_sent → EMAIL_SENT`,
  `reply_received`/`lead_interested → CONNECTED` via
  `mapInstantlyEventToLeadStatus`. `INSTANTLY_API_KEY` is reserved for a
  future polling-based alternative; both are env vars only, never hardcoded.

## Data model (`prisma/schema.prisma`)

- **`User`** — login only (email/password + bcrypt hash). Not the same
  concept as `contactOwner` (see below).
- **`Contact`** — the lead record. Notable fields:
  - `contactOwner: String` — free-text email, drawn from the 100 seeded
    placeholder addresses; intentionally *not* a `User` foreign key, since
    the spec's 100 "sending accounts" are outreach mailboxes, not CRM logins.
    The 100-owner pool itself isn't a DB table — it's generated
    deterministically by `buildSeedOwners()`/`SEEDED_CONTACT_OWNER_POOL` in
    `lib/contact-owners.ts`, imported by both `prisma/seed.ts` and
    `getContactOwnerPool()`. This matters because only a handful of those
    100 emails ever actually get attached to a `Contact` row (the seed only
    assigns owners to its 6 sample leads); anything that needs to *offer the
    full pool as options* (import's default-owner picker, the create-contact
    form) must call `getContactOwnerPool()`, not `getContactOwners()` (which
    does `DISTINCT contactOwner FROM Contact` and is correct only for the
    Contacts table's owner *filter*, where showing an owner with zero
    contacts would be noise).
  - `leadStatus` — 8-value enum, `OPEN_PROSPECT` default; this is the Board's
    column set, in `LEAD_STATUS_ORDER` (`lib/status-config.ts`).
  - `sequenceStep: Int` — position in the 4-channel cadence: `0` = due for
    Email, `1` = due for LinkedIn, `2` = due for a Call, `3` = due for SMS,
    `4+` = repeat/breakup. This single field is what the Call Queue,
    LinkedIn Tasks, and sequence tracker all filter/count on.
  - `smsOptOut: Boolean` — gates the SMS send action everywhere.
- **`Touch`** — append-only log of every outreach action, any channel
  (`EMAIL` / `LINKEDIN` / `CALL` / `SMS` / `NOTE`), any direction
  (`OUTBOUND`/`INBOUND`). `outcome` is a free-text string (not its own enum)
  because its valid values differ per channel — see the comment above the
  field in the schema for the per-channel vocabularies used by the UI
  (call outcomes, SMS outcomes, LinkedIn outcomes). This is the single
  source for the touch-history timeline, call-count/last-outcome columns,
  and the "touches per channel" chart.
- **`SmsTemplate`** — `name` + `body`, tokens replaced at send time.

All four models use `id String @id @default(uuid())`. Cascading delete is set
on `Touch.contactId` — deleting a contact deletes its touch history.

## Conventions

- **Never trust the client.** Every Server Action re-validates its `unknown`
  input with a zod schema from `lib/validations.ts`, even though the UI
  already validates the same shape with react-hook-form. Every mutation also
  calls `requireAuth()` first.
- **Forms**: react-hook-form + `zodResolver`. Where a schema has
  zod `.transform()`/`.default()`/`.coerce` (needed for the *server-side*
  validation), the **client form** uses a separate, transform-free schema
  shaped like what the actual `<input>` elements produce (see
  `contact-edit-form.tsx`) — mixing the two trips up `@hookform/resolvers`'
  generic inference. The server action re-validates with the authoritative
  schema regardless, so this split is purely a client-side typing concern.
- **Status pills / channel icons**: always pull colors and labels from
  `lib/status-config.ts` and `lib/channel-config.tsx` rather than
  re-deriving them, so the Board, Table, Timeline, and Dashboard stay visually
  consistent (this is also where the CSS custom properties defined in
  `app/globals.css` — `--status-*-bg/fg`, `--channel-*` — are consumed).
- **Design tokens** live in `app/globals.css` as CSS custom properties:
  `--navy*` (sidebar/brand), `--accent-warm*` (primary actions/active
  states — mapped to shadcn's `--primary`), `--status-*` (pill backgrounds),
  `--channel-*` (per-channel brand colors). Change the palette there, not by
  hunting through components.
- **shadcn/ui components** (`components/ui/`) were hand-written (not
  generated via the `shadcn` CLI — its registry fetch is blocked in this
  environment's network policy) to match the standard shadcn source/API, so
  the CLI can still be used normally in the future to add more components.
- **Server Action files** (`app/actions/*.ts`) may only export async
  functions (and types) — Next.js enforces this. Put sync helpers in `lib/`.

## Database / deployment

`prisma/schema.prisma`'s `datasource db` targets PostgreSQL, reading
`DATABASE_URL` from the environment (a Neon connection string in
production). Vercel's filesystem is ephemeral — a SQLite file wouldn't
survive across deploys or serverless instances — so Postgres is required
there; for local dev, point `DATABASE_URL` at any Postgres instance
(local or a Neon branch).

`npm run build` is `prisma generate && prisma migrate deploy && next build`,
so pushing new migrations to the deployed branch applies them automatically
on the next Vercel build — no manual `migrate deploy` step needed. Local
schema changes still go through `npx prisma migrate dev` as usual to create
the migration file, which then gets picked up by `migrate deploy` on deploy.

## Environment variables

See `.env.example`. Required: `DATABASE_URL`, `AUTH_SECRET` (NextAuth v5;
`NEXTAUTH_SECRET`/`NEXTAUTH_URL` are also set for compatibility). Optional,
for the Instantly.ai stretch goal: `INSTANTLY_API_KEY`,
`INSTANTLY_WEBHOOK_SECRET`. Seed-only (not read by the app itself, only by
`prisma/seed.ts`): `SKIP_DEMO_SEED`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` — see
"Data layer" above.

## Local dev

```bash
npm install
npx prisma migrate dev   # first time / after schema changes
npx prisma db seed       # 6 sample contacts, 100 contactOwner emails, demo user
npm run dev
```

Demo login: `admin@transformtargets.com` / `password123`.

## Known gaps / stretch-goal state

- SMS sending is simulated (`sendSmsViaProvider` in `app/actions/touches.ts`
  is a stub) — no real carrier integration. It's structured as the single
  seam to drop in Twilio.
- Instantly.ai integration is webhook-only (no polling fallback implemented).
- No test suite yet.
