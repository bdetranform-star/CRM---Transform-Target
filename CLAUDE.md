# Transform Targets CRM

A cold-outreach CRM for the Facility Maintenance / IFM industry, tracking leads
across four channels — Email, LinkedIn, Cold Calling, and SMS/Text. The
information architecture (navigation, Contact properties, saved views,
dashboards) is modeled on HubSpot's CRM, upgraded from an earlier simpler
version — see "Data model", "Migration notes", and "Key modules" below for
what changed and why.

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
- **date-fns** — date-range math for the dashboard and relative timestamps
  on the Activity Feed
- **@anthropic-ai/sdk** — the contact detail page's AI Insights summary and
  "Ask a question" chat, called only from Server Actions / a Route Handler
  so `ANTHROPIC_API_KEY` never reaches the client
- **@vercel/blob** — stores uploaded contact photos (`Contact.avatarUrl`);
  `BLOB_READ_WRITE_TOKEN` never reaches the client, only used server-side in
  `app/actions/contact-avatar.ts`

## Architecture

### Routing

- `app/login/page.tsx` — public login page. A HubSpot-style hero: a
  full-bleed background layer (`bg-cover bg-center`, layered
  `url('/login-bg.jpg')` over a brand-green-tinted navy/near-black
  gradient) plus a dark gradient overlay for text contrast, a bold
  headline/sub-headline/stat-badge hero copy block, and the existing
  `LoginForm` unchanged inside a light frosted-glass card
  (`bg-white/90 backdrop-blur-xl`) so its dark-on-white styling needs no
  rework. `public/login-bg.jpg` isn't committed — CSS paints
  background-image layers front-to-back and simply skips one that 404s, so
  the gradient shows through on its own until that file is dropped in;
  no other code changes are needed once it exists. Fade-in-on-load uses
  `tw-animate-css`'s `animate-in`/`fade-in`/`slide-in-from-*`/`delay-*`
  utility classes (already a dependency, used elsewhere for Radix
  open/close transitions) rather than a new animation library. `app/setup/
  page.tsx` deliberately keeps its older plain-green-background look —
  this redesign was scoped to the login page only.
- `app/setup/page.tsx` — public one-time bootstrap page: a form to create the
  first admin login (email + password) when the `User` table is empty. See
  "Data layer" below for how reuse is prevented.
- `app/(app)/` — route group for everything behind auth, sharing
  `app/(app)/layout.tsx` (green `Sidebar` + `Topbar` shell). The sidebar's
  primary nav, top to bottom (`components/sidebar.tsx`'s `NAV_ITEMS`),
  mirrors HubSpot's own top-to-bottom order:
  - `/` — **Home**: Board (Kanban) view, the default view
  - `/contacts` — **Contacts**: Table view with saved-view tabs + advanced filters
  - `/contacts/[id]` — the full **Contact detail page** — see "Key modules" below
  - `/companies` — **Companies**: read-only rollup derived from `Contact.company`
  - `/deals` — **Deals**
  - `/tasks` — **Tasks**
  - `/activity-feed` — **Activity Feed**: global reverse-chronological Touch feed
  - `/dashboard` — **Dashboards**
  - **More** — a collapsible section (`MORE_ITEMS`), not a real page, holding
    the original four channel-specific modules so they stay reachable without
    competing with the HubSpot-shaped top-level nav:
    - `/calls` — Call Queue (cold calling module)
    - `/linkedin` — LinkedIn Tasks
    - `/sms-templates` — SMS template manager
    - `/import-export` — CSV import/export

  "Prospecting Agent" and "Sales Workspace" (present in HubSpot's own nav)
  are intentionally not included — there's no corresponding feature to link to.
- `middleware.ts` — protects every route except `/login`, `/setup`,
  `/api/auth/*`, and `/api/webhooks/*` (external callers like Instantly.ai
  can't send a session cookie; that route authenticates itself via a shared
  secret instead).

### Data layer

- `lib/prisma.ts` — the singleton `PrismaClient` (standard Next.js dev-mode
  global-cache pattern to survive HMR).
- `prisma/schema.prisma` — see "Data model" below.
- `prisma/seed.ts` — seeds 6 realistic sample leads (spread across
  lead statuses / industries / lifecycle stages, with matching touch
  history, `lastContactDate`/`lastInterestedReply` derived from that
  history, and `contactOwner` round-robined across the 5 `TeamMember`s), one
  sample `Deal` + `Task` attached to the `CONNECTED` sample contact, and 3
  starter SMS templates. Run with `npx prisma db seed` (wired up via
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
  The page header (`app/(app)/page.tsx`) leads with a static "Welcome back,
  BDE Team" heading above the existing "Lead Board" title — same
  `text-lg font-semibold` styling as the title it sits above (a plain
  heading, not a banner/callout), with "Lead Board" itself demoted to an
  `<h2>` underneath it for correct heading hierarchy even though its look
  is unchanged. The Dashboards page (`app/(app)/dashboard/page.tsx`) has
  the identical heading above its own title for the same reason. Cards show
  a `ChannelTagBadges` row (`components/channel-tags.tsx`) below the
  industry/step footer whenever the contact has any `channelTags` set —
  omitted entirely (not a "—" placeholder) when empty, matching how the
  card already omits `company` when unset.
- **Contacts table** (`components/contacts-table/`) — TanStack Table in
  fully **manual** mode (`manualPagination`/`manualSorting`): sorting, paging,
  and filtering all round-trip through URL search params
  (`?search=&industry=&status=&owner=&sort=&dir=&page=&view=&customView=&filters=`)
  into the `getContactsTable` server action, which does the real work in
  Prisma (`WHERE`/`ORDER BY`/`skip`/`take`). Row selection is TanStack-table-local
  (per page) and drives the bulk action bar.
  - **Saved-view tabs** (`saved-view-tabs.tsx`, `?view=`) — preset views
    defined in `lib/saved-views.ts` (`SAVED_VIEWS`, kept out of
    `app/actions/contacts.ts` since a `"use server"` file can't export a
    runtime const — see the "use server" convention note below): "All
    contacts" (no filter), "Open opportunities"
    (`leadStatus = OPEN_OPPORTUNITIES`), "Need follow up"
    (`leadStatus IN (OPEN_PROSPECT, IN_PROCESS, EMAIL_SENT)` — a judgment
    call for "needs another touch before it's qualified or dead"; `NEW_LEAD`
    is deliberately excluded since a lead that's never been touched yet
    isn't "following up" on anything), and "Initial conversation in
    progress" (`leadStatus = CONNECTED`). Each tab shows a live count from
    `getSavedViewCounts()`. Each preset's base filter also renders as a
    locked, non-removable chip (with a lock icon) in the filters row —
    `lib/saved-views.ts`'s `SAVED_VIEW_LOCKED_FILTER`, which must be kept in
    sync with `savedViewWhere()` in `app/actions/contacts.ts` by hand since
    one is a display-only `ContactFilter` and the other is the real Prisma
    `WHERE` fragment. Users can also save the *current* filter/search state
    as a **custom view** via the "+" button; custom views are client-only,
    persisted to `localStorage` (`lib/saved-views-storage.ts`), not a DB
    table — this is intentionally lighter-weight than HubSpot's real
    saved-views feature, and (unlike the 4 presets) a custom view's filters
    are all regular, removable/editable filters rather than a locked base.
  - **Advanced filters** (`advanced-filters-panel.tsx`) — a right-side
    `Sheet` matching HubSpot's own filter-builder pattern: "Add filter" opens
    a searchable property picker (`FILTERABLE_FIELDS`, filtered by label as
    you type); picking one shows an operator dropdown scoped to that
    property's type, then the matching value input. Field definitions (type,
    label, operators, enum options) live in `lib/contact-filters.ts`, one
    entry per filterable `Contact` property:
    - `string` (First/Last Name, Job Title, Designation, Email, Company,
      Website/LinkedIn URL, Street Address, City, State, Country, Zip Code,
      Pitch / Connection Request Note): contains / is equal to / is known /
      is unknown.
    - `phone` (Work/Cell Phone Number): contains / is known / is unknown —
      no "is equal to", since exact phone-format matching isn't useful.
    - `enum` (Lifecycle Stage, Lead Status, Industry, Industry Detail,
      Contact Owner, Lead Source, Lead Source Captured, LinkedIn Status,
      Lifecycle of LinkedIn, Interested Response From): is any of / is none
      of, each backed by a searchable multi-select checklist of the enum's
      real values (`SearchableChecklist`).
    - `number` (Website Traffic, Number of Employees): equals / greater than
      / less than / between (two inputs).
    - `date` (Last Interested Reply, Last Contact Date, Created Date,
      LinkedIn Connected On): is after / is before / is between (two date
      inputs) / in the last N days (relative, computed from `new Date()` at
      query time via `date-fns.subDays`) — `linkedinConnectedOn` reuses this
      same filter type and `ValueEditor` UI unchanged, since it's a plain
      nullable date column like the other three.
    - `boolean` (1st/2nd/3rd/4th Follow Up LinkedIn) — added alongside the
      original four types specifically for these fields: is Yes / is No,
      each a value-free operator exactly like `is_known`/`is_unknown` (the
      operator alone fully describes the filter, so `ValueEditor` renders no
      input for it). "is No" (`buildWhereFromFilters()`'s `is_false` branch)
      deliberately matches with `{ not: true }` rather than `{ equals:
      false }`, so a never-toggled `null` reads as "No" too, consistent with
      how the toggle displays on the New Contact form and contact detail
      page.
    - `array_enum` (Channel Tag, the only multi-value property): is any of /
      is none of — same operator labels and the same `SearchableChecklist`
      value editor as `enum` (the `ValueEditor` branches on the *operator*,
      not the field type, so it needed no changes at all for this new
      type), but `buildWhereFromFilters()` builds the Prisma clause with
      `hasSome` instead of `in`/`notIn` since `Contact.channelTags` is a
      native Postgres array column, not a scalar enum column — "is none of"
      is `NOT: { hasSome: values }` rather than `notIn`, since a `channelTags`
      array can contain other tags besides the excluded one and still needs
      to match.

    A filter's value lives in `ContactFilter.value` (single scalar),
    `.values` (the multi-select operators), or `.valueMin`/`.valueMax`
    (between) — never all three, which is why `isFilterComplete()` and
    `buildWhereFromFilters()` both switch on the operator, not just the
    field type, to know which shape to expect. Applied filters render as
    removable chips above the table (AND-combined only — no OR/grouping,
    per spec) and are serialized into the `?filters=` URL param as JSON.
    Both `app/(app)/contacts/page.tsx` (parsing the URL param) and
    `getContactsTable()` itself (a Server Action is directly callable,
    independent of the page that normally renders it) re-validate every
    filter against `contactFilterSchema` before it reaches
    `buildWhereFromFilters()` — the schema's `.refine()`s catch not just
    malformed shapes but a field/operator mismatch a hand-crafted request
    could send (e.g. `between` on an `enum` field). `buildWhereFromFilters()`
    itself also drops `is_any_of`/`is_none_of` values that aren't among the
    field's real enum options, rather than trusting them straight into a
    Prisma `in`/`notIn` — an invalid enum literal reaching Postgres directly
    would throw, not just no-op.
    - **Multi-property AND-stacking, audited**: `buildWhereFromFilters()`
      always accumulates every active filter into one shared
      `and: Prisma.ContactWhereInput[]` array regardless of field type and
      returns `{ AND: and }`, so any number of filters — mixed enum/string/
      number/date — genuinely combine with AND, never overwrite each other.
      `getContactsTable()` merges that `{ AND: [...] }` alongside the quick
      filters' own top-level keys (`where.industry`, `where.leadStatus`,
      the search box's `where.OR`) via `Object.assign`, which Prisma treats
      as an implicit top-level AND across all of them too. On the client,
      `AdvancedFiltersPanel`'s Sheet edits a local `draft` copy so in-progress
      edits can be cancelled; "Apply filters" replaces the committed array
      wholesale with `draft` (which always starts from the current committed
      filters when the panel opens, so earlier filters are never dropped),
      each chip's `X` removes only that one filter by index, and "Clear all"
      resets to `[]` — all three write through the same `?filters=` URL
      param, so removing one filter re-runs the query with the rest intact.
      Verified end-to-end against real seeded Postgres data, both via a
      direct `buildWhereFromFilters()` call (bypassing the UI) and live in
      the browser: stacking Industry = Facility Maintenance Companies +
      Lead Status = In Process/Dead Lead + Contact Owner = Saad Ahmed
      narrowed 6 contacts → 4 → 3 → 1 (matching a hand-verified single row),
      removing just the Contact Owner chip restored the 2-filter result
      (not 0, not all 6), and "Clear all" restored all 6 — confirming the
      chip-removal and AND-combination logic were already correct before
      this audit; no fix was needed.
  - **Bulk edit** (`bulk-action-bar.tsx`'s "Bulk edit" button, `bulk-edit-dialog.tsx`)
    — a full property editor for 1+ selected rows, alongside (not replacing)
    the existing "Change status to... / Apply" quick action and "Delete
    selected", since the status shortcut is still the fastest path for the
    single most common bulk op. Supports **multiple properties in one
    operation**: each row in the dialog is a property (picked via the same
    `PropertyPicker` component the Advanced Filters panel uses — extracted
    to `components/contacts-table/property-picker.tsx` so both flows share
    one picker, parameterized by field list — filtered to hide properties
    already used in another row of the *same* bulk edit, since setting one
    field twice in one operation is never meaningful) + a type-appropriate
    value input (dropdown for enum, text for string, number input for
    number, Yes/No dropdown for the one boolean field, `smsOptOut`) from
    `lib/contact-bulk-edit.ts`'s `BULK_EDIT_FIELDS`. That field list is
    deliberately a subset of every Contact column: `email` is excluded
    (unique constraint — setting the same email on 2+ rows in one
    `updateMany` would violate it), `firstName`/`lastName` are excluded
    (per-person identity; the same name across a batch of different people
    is never actually intended), and `avatarUrl`/`id`/`createdAt`/
    `updatedAt`/`lastContactDate`/`lastInterestedReply`/`aiInsightsSummary`/
    `aiInsightsGeneratedAt` are excluded as system-managed/computed. Clicking
    "Review changes" moves to a second stage in the same dialog listing
    each pending change in plain language ("Contact Owner → Shahmir") plus
    the affected count, then "Apply to N contacts" is the actual commit —
    two distinct steps, not a single click, since this can touch many
    records at once. `bulkUpdateContactProperties()` (`app/actions/
    contacts.ts`) re-validates every change server-side via
    `bulkEditContactsSchema`/`buildBulkUpdateData()` (same "don't trust a
    hand-crafted request" posture as `buildWhereFromFilters()`: an unknown
    field, invalid enum literal, or non-numeric string is dropped rather
    than reaching Prisma) and explicitly rejects an all-invalid change set
    before calling `updateMany()` — an empty `data: {}` would otherwise
    still be a "successful" no-op update that silently bumps every selected
    row's `@updatedAt` timestamp. Applying keeps the current filter/search/
    sort/page in place (the same `router.refresh()` + clear-selection
    pattern the existing bulk actions already used), so the user doesn't
    lose their place in the table.
- **Contact detail page** (`/contacts/[id]`, `components/contact-detail/
  contact-detail-page-view.tsx`) — a full page (not a slide-over) that's the
  only way to view or edit an existing contact; the Board, Contacts table,
  and Activity Feed all `router.push()` here on click instead of opening a
  panel. Layout: a header (back link, name/company/email, clickable Website
  URL/LinkedIn URL links that open in a new tab and are simply omitted when
  either field is empty — `formatUrlLabel()`/`toHref()` in
  `contact-detail-page-view.tsx`, wrapped via `flex-wrap` so a contact with
  every field populated wraps to a second line on narrow viewports instead
  of truncating — the same quick
  actions the old panel had — Log a call / Log LinkedIn touch / Send SMS /
  Reply logged / Open LinkedIn profile / Delete — plus `SequenceProgress`);
  a ~320px left column (`property-sections.tsx`'s `ContactInfoSection` /
  `CompanyInfoSection` / `LeadInfoSection` / `LinkedinOutreachSection`, each
  independently toggled between a read-only display and an inline edit form
  calling `updateContact` with just that section's fields — a genuine
  partial update, see the `contactUpdateSchema` note under "Data model"
  below — plus a read-only `DatesSection`); and a right-side `Overview`/`Activities` tab pair
  (`Tabs`). Overview shows `ContactInsightsPanel` (see below) and the 5 most
  recent touches (reusing `TouchTimeline`) with a link into the Activities
  tab. Activities shows `ActivityTimelineTab` — sub-tabs for All/Notes/
  Emails/Calls/LinkedIn/SMS (client-side filtered over the already-fetched
  touch list, no extra round trip), a search box (matches touch body text)
  and a from/to date-range filter, and a "Log a note" box wired to the
  existing `addNoteTouch` action.
  - **"New contact" stays a slide-over**, not this page — there's no `id` to
    route to yet. `ContactDetailPanel` (`components/contact-detail/
    contact-detail-panel.tsx`) was trimmed down to just that create flow
    (it used to also handle viewing/editing via a `NEW_CONTACT_ID` sentinel
    vs. a real id; the view/edit half moved to this page, so `ContactEditForm`
    was deleted as dead code). The "+ New Contact" buttons on the Board and
    Contacts table open this panel; on success it navigates to
    `/contacts/[id]` for the newly created contact instead of just closing.
    `Designation` sits in a 2-column grid next to `Company name`; a bordered
    "LinkedIn Outreach" section near the bottom of the form (right before
    Cancel/Create) groups the remaining 9 LinkedIn fields together — LinkedIn
    Status and Lifecycle of LinkedIn as side-by-side `Select`s, LinkedIn
    Connected On as a `DatePicker` right below them, the pitch note as a
    `Textarea`, the 4 follow-ups as a 2x2 grid of `Switch` toggles, and
    Interested Response From as a final `Select`. Right below the Lead
    source / Lead source captured row sits **Channel Tag**
    (`ChannelTagToggleGroup`, `components/channel-tags.tsx`) — a pill/chip
    multi-select, not a dropdown, since a contact can carry any combination
    of the 4 channels (or none): each button independently toggles on/off,
    filled with that channel's color when active and plain outline/gray
    otherwise.
  - **Avatar photo upload** — clicking the avatar circle in the identity
    card opens `AvatarUploadDialog` (`components/contact-detail/
    avatar-upload-dialog.tsx`): drag-and-drop or a file picker, client-side
    validated to jpg/png/webp and 5MB max before a local
    `URL.createObjectURL` preview, then `uploadContactAvatar()`
    (`app/actions/contact-avatar.ts`) re-validates the same constraints
    server-side, uploads to Vercel Blob at `avatars/{contactId}-{timestamp}.
    {ext}` via `put(..., { access: "public" })`, saves the public URL to
    `Contact.avatarUrl`, and best-effort deletes the previous blob if one
    existed (a delete failure doesn't block the update the user is waiting
    on). "Remove photo" (`removeContactAvatar()`) clears `avatarUrl` back to
    `null` and deletes the blob the same way. Both actions return the same
    discriminated `{success, ...}` shape used by the AI Insights/chat
    actions rather than throwing. `next.config.ts` allowlists
    `*.public.blob.vercel-storage.com` in `images.remotePatterns` so
    `next/image` can serve the uploaded photo directly.
    - **Missing-`BLOB_READ_WRITE_TOKEN` handling**: `@vercel/blob`'s `put()`
      throws a plain `Error` mentioning "token" when the env var isn't set
      (its own "No read-write token found..." message) — the only signal
      available to distinguish "storage isn't configured yet" from any
      other upload failure, so `describeBlobError()`
      (`app/actions/contact-avatar.ts`) detects it with a substring check
      and returns `{ success: false, error, notConfigured: true }` rather
      than a message naming the env var (that belongs in the admin's lap,
      not the end user's — the client-facing copy is just "Photo upload
      isn't set up yet — contact your admin."). `AvatarUploadDialog`
      renders that as a persistent inline banner in place of the drag-drop
      zone (not a `toast`, which would auto-dismiss before most users read
      it) and disables the Upload button, rather than inviting an identical
      retry; the rest of the contact detail page is unaffected since the
      failure is caught and returned, never thrown across the Server Action
      boundary. No proactive "is storage configured?" check exists — the
      condition is only surfaced reactively, after a real upload attempt —
      so once `BLOB_READ_WRITE_TOKEN` is set in the environment, the very
      next upload attempt succeeds with zero code changes; verified by
      confirming the failure path end-to-end (this environment has no real
      token to test the reverse).
  - **LinkedIn Outreach section** (`LinkedinOutreachSection`, `property-
    sections.tsx`) — same read/edit-toggle pattern as `ContactInfoSection`/
    `CompanyInfoSection`/`LeadInfoSection` above, covering the 8 LinkedIn
    outreach fields (LinkedIn Status, Pitch / Connection Request Note, the 4
    Follow Up toggles, Lifecycle of LinkedIn, Interested Response From) —
    see "Data model" below for the fields themselves. `Designation` lives in
    `CompanyInfoSection` instead (next to `company`), matching its placement
    on the New Contact form. The 4 follow-up fields edit as `Switch` toggles
    (`components/ui/switch.tsx`, a new shadcn-style wrapper around
    `@radix-ui/react-switch`) and display as literal "Yes"/"No" text in the
    read-only view.
  - **AI Insights panel** (`contact-insights-panel.tsx`) — a cached,
    manually-regenerated summary plus a persisted per-contact chat:
    - `generateContactInsights()` (`app/actions/contact-insights.ts`) sends
      the contact's full properties + touch history
      (`lib/contact-ai-context.ts`'s `buildContactContext()`) to Anthropic
      and caches the result on `Contact.aiInsightsSummary`/
      `aiInsightsGeneratedAt`. Called automatically only on the very first
      load of a contact that has never had insights generated (`summary`
      is `null`); every subsequent view just renders the cached copy, and
      regenerating again requires an explicit "Regenerate" click — this is
      the cost control the spec asked for, not a cache-expiry policy.
    - The "Ask a question" chat is intentionally **not** a Server Action —
      streaming a token-by-token response doesn't fit that model without
      extra libraries this app doesn't have, so it's a Route Handler instead
      (`app/api/contacts/[id]/chat/route.ts`, POST, `ReadableStream`
      response) per the "API routes exist only where a Server Action
      doesn't fit" convention. It persists the user's message immediately,
      then the assistant's full accumulated reply once the stream ends —
      persisted even on a **mid-stream failure**, appending a
      `[[STREAM_ERROR:...]]` marker the client strips out and renders as an
      error state (with retry) instead of model output, so a dropped
      connection never just silently truncates the reply with no
      explanation. Chat messages persist in the new `ContactChatMessage`
      model and reload on every page visit, scoped to that one contact only
      (the prompt never includes any other contact's data).
    - Both features return a discriminated `{success: true, ...} |
      {success: false, error}` result (or, for the streaming route, a plain
      error JSON) rather than letting a thrown `Error` cross the Server
      Action boundary — Next.js redacts custom error messages from thrown
      errors in production, so a friendly, specific message (missing API
      key vs. rate limit vs. network) would never actually reach the client
      otherwise. `lib/anthropic.ts`'s `describeAnthropicError()` maps the
      SDK's error classes (`AuthenticationError`, `RateLimitError`,
      `APIError`) to that friendly text in one place.
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
- **LinkedIn Lifecycle board** (`/linkedin-lifecycle`, `components/
  linkedin-board/`) — a second, independent Kanban board grouped on
  `Contact.linkedinLifecycleStage` instead of `leadStatus`, for tracking the
  LinkedIn-specific outreach pipeline separately from the main Lead Board.
  Closely mirrors `components/board/` (`LinkedinBoardView`/
  `LinkedinBoardColumn`/`LinkedinBoardCard`, same `dnd-kit` `DndContext` +
  `useOptimistic` drag pattern), but cards show LinkedIn Status and Contact
  Owner instead of Industry/sequence-step, and there's no "+ New Contact"
  button — contact creation stays on the Board/Contacts table, this board
  only re-stages existing contacts. `getLinkedinLifecycleBoardContacts()`
  (`app/actions/contacts.ts`) groups contacts by stage for the six columns
  in `LINKEDIN_LIFECYCLE_STAGE_ORDER` (`lib/status-config.ts`); since the
  field is nullable, a contact with no stage set yet is bucketed into the
  leftmost "Not Contacted" column for *display only* — the returned/grouped
  data always has a concrete stage, but the underlying DB column stays
  `null` until `updateContactLinkedinLifecycleStage()` (called on drag) sets
  it explicitly, so "never touched" and "explicitly Not Contacted" aren't
  conflated in the data itself. Reachable from the sidebar's "More" section
  as "LinkedIn Lifecycle", right below "LinkedIn Tasks".
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
- **Companies** (`app/actions/companies.ts`, `components/companies/`) — not
  a DB table; `getCompanies()` groups `Contact` rows by `company` and rolls
  up a contact count plus city/state/country/employee-count *only* when
  every contact at that company agrees (`rollUp<T>()` helper) — otherwise the
  rolled-up field shows blank rather than picking one contact's value
  arbitrarily. Clicking a company links to `/contacts` pre-filtered to it.
  - **Avatar cluster** — since a company row has no single contact to show
    an avatar for, `getCompanies()` returns each company's first 3 contacts
    (alphabetical by first name, for a stable row-to-row identity across
    reloads) as `avatars`, rendered via the shared `AvatarCluster` component
    (`components/contact-avatar.tsx`) as overlapping 28px circles — photos
    where `avatarUrl` is set, the existing initials-circle fallback
    otherwise (both via the same `ContactAvatar` this component wraps, so
    there's one fallback implementation, not a duplicate). A company with
    more than 3 contacts collapses the remainder into a trailing "+N" circle
    rather than growing the stack; `totalCount` (the company's real
    `contactCount`, not `avatars.length`) drives that count so it stays
    correct even though only 3 contacts' avatar data is ever fetched.
  - **Bulk edit** (checkboxes on `CompaniesView`, `company-bulk-edit-dialog.tsx`)
    — select 1+ companies and bulk-set **Industry** or **Contact Owner**
    across every `Contact` under those company names via
    `bulkUpdateCompanyProperty()` (`companyNames` → a single scoped
    `updateMany({ where: { company: { in: companyNames } } })`, not by id).
    Deliberately **single-property-at-a-time**, unlike the Contacts table's
    multi-property `BulkEditDialog` above: a "company" here is really a
    group of Contact rows sharing a company name rather than its own
    record, so the two properties named in spec (Industry, Contact Owner)
    cover the meaningful case without needing the same multi-row picker —
    if more company-level properties need bulk-editing later, `FIELD_META`
    in `company-bulk-edit-dialog.tsx` is a two-line addition away from
    supporting them, since `getCompanies()` already rolls up every
    Contact field the same way. Since `industry`/`contactOwner` are
    required, non-nullable Contact columns, `getCompanies()`'s `rollUp()`
    returning `null` for either one can only mean the company's contacts
    currently disagree (not "all empty," unlike the address/employee-count
    roll-ups) — surfaced to the picker as an explicit `industryMixed`/
    `contactOwnerMixed` flag rather than left for the caller to infer, and
    shown before applying as "N of M selected companies currently have
    mixed [Property] values ... this will set all of them to the same
    value," plus a per-company list of each one's current value or "Mixed"
    so nothing is applied blind. Same two-stage review/confirm pattern as
    the Contacts Bulk Edit dialog for visual and interaction consistency
    between the two.
- **Deals** (`prisma` `Deal` model, `app/actions/deals.ts`,
  `components/deals/`) — a `Contact` can have many `Deal`s (`title`, optional
  `value`, `stage` enum `NEW → QUALIFIED → PROPOSAL_SENT → NEGOTIATION →
  WON/LOST`, `createdAt`, optional `closedAt`). Simple list page, filterable
  by stage; `closedAt` is set when a deal moves to `WON`/`LOST` and cleared if
  it moves back out of those stages. Deliberately not wired into
  `leadStatus` transitions (e.g. moving a contact to `OPEN_OPPORTUNITIES`
  does not auto-create a `Deal`, and winning a `Deal` does not auto-update
  `leadStatus`) — kept as two independently-editable records rather than
  building a synced state machine between them.
- **Tasks** (`prisma` `Task` model, `app/actions/tasks.ts`,
  `components/tasks/`) — lightweight to-dos: `title`, optional `dueDate`,
  `completed` boolean, optional `contactId` (nullable — a task doesn't have
  to relate to a contact), `assignedTo` (`TeamMember` enum, same 5 names as
  `Contact.contactOwner`). List page splits open vs. completed, sortable by
  due date.
- **Activity Feed** (`app/actions/activity-feed.ts`,
  `components/activity-feed/`) — the same `Touch` model that backs each
  contact's timeline, but queried globally and paginated
  (`getActivityFeed(page)`, `PAGE_SIZE = 50`) newest-first across *all*
  contacts, for a HubSpot-style cross-contact activity stream. Clicking an
  entry opens that contact's detail panel.
- **Dashboards** (`components/dashboard/`, `app/actions/dashboard.ts`) —
  Recharts widgets, all accepting the shared `range`/`owner` URL params
  (`DashboardFilters`: date range 7/30/90/365 days or all-time, and an
  owner filter over the 5 `TeamMember`s):
  - **New Contacts Created** (`StatTile`) — current-period count vs. the
    immediately preceding period of equal length, with a % change indicator.
  - **Contact Sources** (`ContactSourcesChart`) — donut by `leadSourceCaptured`.
  - **Contacts Added Over Time** / **Deals Created Over Time**
    (`DailyLineChart`, shared component parameterized by title/data) — daily
    buckets over the selected range (defaults to a 90-day window when
    "all time" is selected, since a genuinely unbounded daily axis isn't
    useful).
  - **Deals by Stage** (`DealsByStageChart`) — donut by `DealStage`.
  - **Activity Type Breakdown** (`ActivityTypeChart`) — bar chart by `Touch.channel`,
    reusing `CHANNEL_CONFIG` brand colors.
  - **Team Activity Summary** (`TeamActivityChart`) — bar chart of touches
    logged per `contactOwner`, date-range filterable.
  - **Open Tasks Summary** / **Task Status Breakdown**
    (`OpenTasksSummary` stat tile, `TaskStatusChart` donut) — HubSpot's
    dashboard has an "Open Ticket Summary"/"Ticket Status Breakdown" pair;
    since this CRM has no ticketing concept, these are repurposed onto
    `Task` data instead (open count + overdue count; open vs. completed
    breakdown) using the same visual layout, deliberately never using the
    word "ticket" anywhere in the UI or code.
  - Also retained from the pre-redesign dashboard: **Contacts by status**
    (`StatusBarChart`), **Contacts by industry** (`IndustryPieChart`), and the
    **sequence tracker** widget (`SequenceTrackerWidget`).
  - **Contacts by status, by outreach channel** — four more `StatusBarChart`
    instances below the overall one, in a 2x2 grid (`lg:grid-cols-2`, 1
    column on narrow viewports), each with its own total-count shown in the
    card header: Cold Email (`leadSource = COLD_EMAIL`), LinkedIn
    (`LINKEDIN`), SMS / WhatsApp (`leadSource IN (SMS, WHATSAPP)`), and Cold
    Calling (`COLD_CALL`). `getContactsByStatus()` (`app/actions/
    dashboard.ts`) takes an optional `sources: LeadSource[]` third argument
    shared by all five chart instances (the overall chart just omits it) so
    there's one query implementation, not five near-duplicates; `StatusBarChart`
    likewise takes an optional `title` prop (defaulting to "Contacts by
    status") instead of a second component. All five still respect the
    dashboard's `range`/`owner` filters — auditing this also surfaced and
    fixed a pre-existing bug where the overall chart was being called as
    `getContactsByStatus()` with no arguments at all, so it silently ignored
    the date-range/owner filters the rest of the dashboard responded to;
    `getContactsByStatus(range, owner)` now applies them like every other
    widget.
  - Uses the CVD-validated 8-hue categorical palette in `lib/chart-palette.ts`
    for the status/industry/sources/deals/team charts, and the real
    per-channel brand colors (`lib/channel-config.tsx`) for the
    activity-type chart.
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
  (`app/actions/contacts.ts`), which simply returns `TEAM_MEMBERS`
  (`lib/contact-owners.ts`) — the fixed list of 5 named team members, always
  fully populated regardless of how many contacts currently have each owner
  assigned (see the `contactOwner` note under "Data model" below for how this
  differs from `getContactOwners()`).
  - **Email is optional, not a row-validity gate.** `Contact.email` is
    `String? @unique` (migration `20260731233629_make_contact_email_optional`)
    specifically so CSV rows without a usable email column still import —
    Postgres allows any number of `NULL`s in a unique column/index, so
    multiple email-less contacts never collide with each other or with an
    existing email-less contact, only a genuine duplicate real email still
    gets skipped. `mapCsvRows()`'s only skip condition is
    `isRowEffectivelyEmpty()` — every recognized column blank, not just
    email — so a row with, say, only a Company Name still imports with
    `firstName: ""` and `email: null`. (`firstName` stays a non-nullable
    `String` column; an empty string satisfies that constraint without
    needing a placeholder value, unlike `email`, which needs real `null` to
    stay collision-free under the unique constraint.) The import route's
    dedupe step (`existingEmails`/`seenInBatch`) explicitly skips this check
    for `email === null` rows so they're never treated as duplicates of one
    another. The manual "New Contact" form's Email field is optional for the
    same reason (`contactCreateSchema.email` and the form's local
    transform-free schema both accept `""`), so the UI and the CSV path
    agree on what "no email" means. The post-import summary
    (`components/import-export/import-export-view.tsx`) reports three
    distinct counts — rows imported, rows skipped for a duplicate email, and
    rows skipped for being completely empty — since those are different
    situations a user needs to distinguish, not one generic "skipped" count.
  - **Field mapping covers the full Contact property set**, not just the
    original core fields — `HEADER_ALIASES`/`ImportField` also recognize
    Designation, LinkedIn Status, Pitch / Connection Request Note, the 4
    Follow Up LinkedIn columns (parsed from Yes/No/True/False/1/0 via
    `parseBooleanLike`), Lifecycle of LinkedIn, Interested Response From,
    Channel Tag (multi-value — split on comma/semicolon/pipe, each piece
    matched independently via `detectChannelTags`), and LinkedIn Connected On
    (`parseDateLike`, accepting this app's own US `MM/DD/YYYY` export format
    or ISO). The three enum-label fields (LinkedIn Status, Lifecycle of
    LinkedIn, Interested Response From) match case-insensitively against
    either the human-readable label or the raw enum value via a shared
    `buildLabelLookup()` helper, so a re-imported export from this same app
    round-trips correctly. An unrecognized header is simply left unmapped
    (ignored), never an error — matching the existing convention for any
    extra column in an uploaded file.
- **Instantly.ai webhook** (`app/api/webhooks/instantly/route.ts`,
  `lib/instantly.ts`) — verifies a shared secret
  (`INSTANTLY_WEBHOOK_SECRET`, checked against the `x-instantly-secret`
  header or `?secret=`) if one is configured, validates the payload, logs an
  inbound `EMAIL` touch, and maps `email_sent → EMAIL_SENT`,
  `reply_received`/`lead_interested → CONNECTED` via
  `mapInstantlyEventToLeadStatus`. `INSTANTLY_API_KEY` is reserved for a
  future polling-based alternative; both are env vars only, never hardcoded.

## Data model (`prisma/schema.prisma`)

This is the **post-redesign** model (migration
`20260729180000_redesign_contact_model`), rebuilt to match HubSpot's
contacts/CRM information architecture. See "Migration notes: old → new
mapping" below for exactly how existing seeded data was carried forward.

- **`User`** — login only (email/password + bcrypt hash). Not the same
  concept as `contactOwner` (see below).
- **`Contact`** — the lead record. Full property list:
  - Identity: `firstName`, `lastName`, `jobTitle` (new), `email` (`String?
    @unique` — made nullable in migration
    `20260731233629_make_contact_email_optional` specifically so CSV-imported
    contacts without a usable email column still import; see the "Email is
    optional" note under Import/Export below), `workPhone` (renamed from
    `phone`), `cellPhone` (new).
  - Company: `company`, `websiteUrl` (new), `websiteTraffic: Int?` (new),
    `numberOfEmployees: Int?` (new).
  - Address (all new): `streetAddress`, `city`, `state`, `country`, `zipCode`.
  - Pipeline: `lifecycleStage` (new enum: `SUBSCRIBER → LEAD →
    MARKETING_QUALIFIED_LEAD → SALES_QUALIFIED_LEAD → OPPORTUNITY →
    CUSTOMER`, default `LEAD`), `leadStatus` (replaced enum — see mapping
    table below — default `NEW_LEAD`; this is still the Board's column set,
    in `LEAD_STATUS_ORDER`, `lib/status-config.ts`), `leadSource` (unchanged,
    original enum — the free-text-ish "how this lead entered the CRM"
    field used by existing features), `leadSourceCaptured` (new, separate
    enum: `LINKEDIN_SALES_NAVIGATOR` / `GOOGLE_MAPS` / `GOOGLE_DORK` /
    `ONLINE_DIRECTORY` — the specific outbound-prospecting source, distinct
    from `leadSource`; backs the dashboard's "Contact Sources" widget).
  - `channelTags: ChannelTag[]` (new, native Postgres array column,
    `@default([])` — never `null`, so every consumer can map/spread it
    without a null check) — a manually-set, multi-select tag of which
    outreach channel(s) have been used to reach a contact
    (`EMAIL_CHANNEL` / `LINKEDIN_CHANNEL` / `COLD_CALLING_CHANNEL` /
    `TEXT_WHATSAPP_CHANNEL`), independent of both `leadSource` (a single
    "how this lead entered the CRM" value) and `Touch.channel` (one value
    per logged outreach action) — a contact can carry any combination, or
    none. Edited via the pill/chip `ChannelTagToggleGroup`
    (`components/channel-tags.tsx`) on the New Contact form and the contact
    detail page's `LeadInfoSection`; displayed as small colored
    `ChannelTagBadges` on the Contacts table, the contact detail page, and
    Lead Board cards. Filterable via Advanced Filters (see the `array_enum`
    filter type below) but not sortable, matching the existing convention
    for other non-scalar/multi-value fields (`linkedinPitchNote`,
    `smsOptOut`).
  - Industry: `industry` (replaced enum — see mapping table below),
    `industryDetail` (new enum, a flat list of 27 sub-industry values,
    independent of `industry` — e.g. a `FACILITY_MAINTENANCE_COMPANIES`
    contact's `industryDetail` might be `HVAC`, `JANITORIAL`, etc.).
  - `contactOwner: TeamMember` — **replaced**: used to be a free-text email
    drawn from a 100-address seeded pool (outreach sending mailboxes, not CRM
    logins); now a fixed enum of the 5 real team members (`SAAD_AHMED`,
    `SHARMIN`, `MUHAMMAD_NAUMAN`, `SALMAN`, `SHAHMIR` — `TEAM_MEMBER_ORDER`/
    `TEAM_MEMBER_LABELS` in `lib/status-config.ts`). The old 100-email pool
    (`lib/contact-owners.ts`'s prior `SEEDED_CONTACT_OWNER_POOL`) is gone
    entirely from `Contact.contactOwner` — it was never meant to represent
    CRM-user ownership, only sending accounts, and nothing else in the app
    referenced those addresses, so there was nothing to preserve elsewhere.
    `getContactOwnerPool()` (`app/actions/contacts.ts`) now just returns the
    5-entry `TEAM_MEMBERS` list — always fully populated, unlike
    `getContactOwners()` (`DISTINCT contactOwner FROM Contact`, correct only
    for the Contacts table's owner *filter*, where an owner with zero
    contacts would be noise).
  - Activity tracking: `lastContactDate` (new, set to `now()` whenever any
    `Touch` is logged), `lastInterestedReply` (new, set to `now()` only when
    a `Touch` is logged with outcome `CONNECTED` or `REPLIED`) — both
    maintained by `recordContactActivity()` (`app/actions/touches.ts`),
    called after every touch-creating action. `createdAt` (existing).
  - `sequenceStep: Int` — position in the 4-channel cadence: `0` = due for
    Email, `1` = due for LinkedIn, `2` = due for a Call, `3` = due for SMS,
    `4+` = repeat/breakup. This single field is what the Call Queue,
    LinkedIn Tasks, and sequence tracker all filter/count on. Unchanged by
    the redesign.
  - `smsOptOut: Boolean` — gates the SMS send action everywhere. Unchanged.
  - `aiInsightsSummary: String?` / `aiInsightsGeneratedAt: DateTime?` (new) —
    the contact detail page's cached AI Insights summary; both set together
    whenever `generateContactInsights()` runs. Never populated automatically
    on a page view except the contact's very first one (see "Key modules").
  - `avatarUrl: String?` (new) — public URL of an uploaded photo, stored in
    Vercel Blob. `null` falls back to the existing initials-circle behavior
    everywhere an avatar renders (`components/contact-avatar.tsx`'s
    `ContactAvatar`, shared by the contact detail header, Board cards, and
    the Contacts table's avatar column) — see "Key modules" below. The
    initials circle's background color is deterministic per contact
    (`lib/avatar-colors.ts`'s `avatarColorForId()`, a `djb2` hash of
    `Contact.id` mod `CATEGORICAL_PALETTE`'s 8 hues) rather than every
    contact sharing one flat brand-green circle — the same contact always
    gets the same color everywhere its avatar renders, since it's a pure
    function of the immutable `id`, but different contacts spread across
    the palette. Per-swatch text color (`AVATAR_TEXT_COLORS`) is precomputed
    via the same WCAG relative-luminance formula used for the status pills
    — pure black passes >= 4.5:1 on 7 of the 8 hues; violet is the one
    swatch dark enough to need white text instead.
  - `designation: String?` (new) — the person's title as tracked for
    *outreach* purposes, entered on the New Contact form right next to
    `company`. Deliberately a separate field from `jobTitle` (the CRM's own
    identity property, entered elsewhere in the form) rather than merged
    into it — the two can differ and the LinkedIn outreach workflow this
    was added for needs its own copy.
  - LinkedIn outreach tracking (all new, all nullable since not every
    contact goes through a LinkedIn-specific cadence — see migration
    `20260731172730_add_linkedin_outreach_fields`): `linkedinConnectionStatus`
    (enum `LinkedinConnectionStatus`: `NOT_SENT` / `REQUEST_SENT` / `PENDING`
    / `CONNECTED` / `REJECTED` — where a connection request currently
    stands), `linkedinConnectedOn` (`DateTime? @db.Date` — see migration
    `20260731222221_add_linkedin_connected_on` — a plain calendar date, no
    time component, distinct from `lastContactDate`/`lastInterestedReply`
    which are auto-set timestamps derived from `Touch` history rather than
    manually entered; edited via the new `DatePicker` component,
    `components/ui/date-picker.tsx`, and always displayed in US MM/DD/YYYY
    format per spec, unlike the "MMM d, yyyy" convention the other date
    columns use), `linkedinPitchNote` (`String? @db.Text` — the connection
    request/pitch message), `linkedinFollowUp1`–`linkedinFollowUp4`
    (`Boolean?`, one per follow-up touch), `linkedinLifecycleStage` (enum
    `LinkedinLifecycleStage`: `NOT_CONTACTED → CONNECTION_SENT → CONNECTED →
    FOLLOW_UP_IN_PROGRESS → INTERESTED` / `NOT_INTERESTED` — powers its own
    Kanban board, see "LinkedIn Lifecycle board" under "Key modules", kept
    entirely separate from the main Lead Board's `leadStatus`), and
    `interestedResponseFrom` (enum `InterestedResponseChannel`: `EMAIL` /
    `LINKEDIN` / `CALLING` / `TEXT` — which channel a contact used to
    respond once interested, distinct from both `leadSource`, how they
    entered the CRM, and `Touch.channel`, how a given outreach action was
    logged). All editable via the New Contact form's "LinkedIn Outreach"
    section and the contact detail page's `LinkedinOutreachSection`
    (`components/contact-detail/property-sections.tsx`); all filterable via
    Advanced Filters and sortable/visible as Contacts table columns (the 4
    follow-up booleans are filterable but not sortable, matching the
    existing convention for `smsOptOut`).
- **`Touch`** — append-only log of every outreach action, any channel
  (`EMAIL` / `LINKEDIN` / `CALL` / `SMS` / `NOTE`), any direction
  (`OUTBOUND`/`INBOUND`). `outcome` is a free-text string (not its own enum)
  because its valid values differ per channel — see the comment above the
  field in the schema for the per-channel vocabularies used by the UI
  (call outcomes, SMS outcomes, LinkedIn outcomes). This is the single
  source for the touch-history timeline, call-count/last-outcome columns,
  the global Activity Feed, and the dashboard's activity-type/team-activity
  charts. Unchanged by the redesign.
- **`SmsTemplate`** — `name` + `body`, tokens replaced at send time. Unchanged.
- **`Deal`** (new) — `contactId` (FK → `Contact`, cascade delete), `title`,
  `value: Decimal?`, `stage` (`DealStage` enum: `NEW` / `QUALIFIED` /
  `PROPOSAL_SENT` / `NEGOTIATION` / `WON` / `LOST`, default `NEW`),
  `createdAt`, `closedAt: DateTime?`.
- **`Task`** (new) — `contactId` (FK → `Contact`, **nullable**, `SET NULL` on
  delete — a task can exist without a contact), `title`, `dueDate:
  DateTime?`, `completed: Boolean` (default `false`), `assignedTo`
  (`TeamMember` enum), `createdAt`, `updatedAt`.
- **`ContactChatMessage`** (new) — the contact detail page's persisted
  "Ask a question" thread: `contactId` (FK → `Contact`, cascade delete),
  `role` (`ChatRole` enum: `USER` / `ASSISTANT`), `content: String @db.Text`,
  `createdAt`. One row per turn; reloaded in full whenever that contact's
  page is opened.

All models use `id String @id @default(uuid())`. Deleting a `Contact`
cascades to its `Touch` history, `Deal`s, and `ContactChatMessage`s, but
only detaches (`SET NULL`) its `Task`s rather than deleting them, since a
task can stand alone.

**A gotcha that bit the `Contact`/`Deal`/`Task` update schemas**:
`someCreateSchema.partial().extend({ id })` is the established pattern for
deriving an update schema from a create schema (see "Forms" below), but
`.partial()` only wraps every field in `.optional()` — it does **not** stop
a field's `.default()` from firing when the key is missing from the input,
because `.optional()` just means "undefined is also a valid parsed value,"
while `.default()` is a transform that replaces a missing/undefined value
with the default regardless of the optional wrapper. Concretely: before the
fix, saving just the contact detail page's "Contact info" section (which
never sends `leadStatus`/`industry`/etc.) silently reset those fields back
to their schema defaults (`NEW_LEAD`, `FACILITY_MAINTENANCE_COMPANIES`, ...)
on every save — a real, reproducible data-corrupting bug caught by testing
the new edit-in-place sections end to end, since every *other* caller of
`updateContact` before this always submitted the complete form (so the
missing-key case never came up). Fixed by re-declaring each defaulted field
as a plain `.optional()` (no default) in the three affected update schemas
(`contactUpdateSchema`, `dealUpdateSchema`, `taskUpdateSchema`) so an
omitted key now genuinely means "leave this field alone."

## Migration notes: old → new mapping

The redesign migration (`prisma/migrations/20260729180000_redesign_contact_model/migration.sql`)
preserves existing data end-to-end rather than dropping and recreating
columns — verified by seeding the *old* schema with real data, applying this
migration on top, and confirming with `npx prisma migrate diff` that the
resulting database has zero drift from the new `schema.prisma`. Enum swaps
use an add-new-column → `CASE`-mapped backfill → drop-old → rename-new
pattern (not a naive `::text::NewEnum` cast, which fails outright for any old
value that has no literal in the new enum) so old value coverage is checked
explicitly rather than left to fail at migration time.

- **`phone` → `workPhone`**: straight `RENAME COLUMN`, no data loss, no
  mapping needed.
- **`leadStatus`** (old 8-value enum → new 9-value enum, default changed
  `OPEN_PROSPECT` → `NEW_LEAD`):
  | Old value | New value | Note |
  |---|---|---|
  | `OPEN_PROSPECT` | `OPEN_PROSPECT` | unchanged |
  | `SDR_IN_PROCESS` | `IN_PROCESS` | renamed |
  | `EMAIL_SENT` | `EMAIL_SENT` | unchanged |
  | `CONNECTED` | `CONNECTED` | unchanged |
  | `BAD_TIMING` | `DEAD_LEAD` | collapsed — no equivalent "come back later" state in the new set |
  | `NOT_INTERESTED` | `DEAD_LEAD` | collapsed |
  | `DEAD_LEAD` | `DEAD_LEAD` | unchanged |
  | `DUPLICATE` | `DEAD_LEAD` | collapsed |

  `NEW_LEAD`, `OPEN_OPPORTUNITIES`, `CURRENT_CUSTOMER`, and `CHURNED` are new
  values with no old equivalent; `NEW_LEAD` is the new default going forward
  but is **not** retroactively applied to any existing contact (every
  existing contact got an explicit mapped value above, never a blind
  default).
- **`industry`** (old enum → new 6-value enum, same default slot
  `FACILITY_MAINTENANCE_COMPANIES`):
  | Old value | New value | Note |
  |---|---|---|
  | `IFM` | `INTEGRATED_FACILITY_MANAGEMENT` | |
  | `FACILITY_MANAGEMENT` | `INTEGRATED_FACILITY_MANAGEMENT` | |
  | `FACILITY_SERVICES` | `FACILITY_MAINTENANCE_COMPANIES` | |
  | `FACILITY_MAINTENANCE` | `FACILITY_MAINTENANCE_COMPANIES` | |
  | `JANITORIAL_CLEANING` | `FACILITY_MAINTENANCE_COMPANIES` | granularity now lives in `industryDetail` |
  | `HVAC` | `FACILITY_MAINTENANCE_COMPANIES` | granularity now lives in `industryDetail` |
  | `FIRE_PROTECTION` | `FACILITY_MAINTENANCE_COMPANIES` | no matching `industryDetail` value exists |
  | `OTHER` | `FACILITY_MAINTENANCE_COMPANIES` | fallback |
- **`industryDetail`** (previously free text → new fixed 27-value enum):
  there's no reliable general mapping from arbitrary free text to a closed
  category list, so this column is intentionally **best-effort keyword
  matching** (`ILIKE '%hvac%'`, `%janitorial%`/`%cleaning%`, `%electrical%`,
  etc. — see the migration file for the full list of ~19 keyword rules).
  Anything that doesn't match a keyword (e.g. "construction", generic IFM
  descriptions) is set to `NULL` rather than guessed, and the original free
  text is not recoverable after this migration — re-enter it by hand on
  affected contacts if a specific value matters.
- **`contactOwner`** (free-text sending-account email → `TeamMember` enum):
  there is no correspondence between the old 100 placeholder emails and the
  5 named team members, so every existing contact is deterministically
  (not randomly re-rolled on re-run — stable, hashed off the contact's own
  `id`) distributed across the 5 names via
  `(ARRAY[...5 names...])[(abs(hashtext("id")) % 5) + 1]`. This is a
  placeholder assignment, not a real ownership decision — reassign manually
  per contact afterward if actual ownership matters.
- **`lastContactDate` / `lastInterestedReply`** (new columns, both
  nullable): backfilled from existing `Touch` history via a correlated
  subquery (`MAX(createdAt)` per `contactId`, the latter filtered to
  `outcome IN ('CONNECTED', 'REPLIED')`) rather than left `NULL` for contacts
  that already had activity.
- All other new `Contact` columns (`jobTitle`, `cellPhone`, `websiteUrl`,
  `websiteTraffic`, `numberOfEmployees`, `streetAddress`, `city`, `state`,
  `country`, `zipCode`, `leadSourceCaptured`) had no old equivalent at all
  and are simply `NULL` on pre-existing contacts.

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
- **Design tokens** live in `app/globals.css` as CSS custom properties, sampled
  directly from `public/logo.png` (green `#5fce81` background, white `#ffffff`
  "T", navy/teal `#14435f` "I", near-black `#0b0d0c` accent square) — see
  "Branding" below for the full palette and the contrast reasoning behind it.
  Change the palette there, not by hunting through components.
- **shadcn/ui components** (`components/ui/`) were hand-written (not
  generated via the `shadcn` CLI — its registry fetch is blocked in this
  environment's network policy) to match the standard shadcn source/API, so
  the CLI can still be used normally in the future to add more components.
  `popover.tsx` (`@radix-ui/react-popover`) and `calendar.tsx`
  (`react-day-picker`) follow this same hand-written pattern; `date-picker.tsx`
  composes them into a single `DatePicker` — a button styled like `Input`
  that shows the selected date in US `MM/DD/YYYY` format (or a placeholder)
  and opens a full `Calendar` popup on click rather than accepting free-text
  entry, used by `linkedinConnectedOn` on both the New Contact form and the
  contact detail page's `LinkedinOutreachSection`.
- **Server Action files** (`app/actions/*.ts`) may only export async
  functions (and types) — Next.js enforces this. Put sync helpers *and any
  runtime consts* in `lib/` instead: e.g. `SAVED_VIEWS` (the saved-view
  definitions) lives in `lib/saved-views.ts`, not `app/actions/contacts.ts`,
  specifically because a plain exported object literal isn't allowed there.

## Branding

A 2026 rebrand replaced the original navy/orange HubSpot-style palette with
one sampled directly from `public/logo.png`. `components/logo.tsx` renders
that file unconditionally — it's a committed, version-controlled asset, not
something optionally dropped in post-deploy, so there's no presence check or
placeholder fallback to keep in sync.

- **Logo asset**: `public/logo.png` is a tight crop around just the T/I mark
  (~1.275:1 aspect ratio), not the original square export — the source file
  has a lot of green padding around a much smaller centered glyph, and
  rendering that full square at sidebar-icon size would have put mostly flat
  green (indistinguishable from the now-green sidebar background) in a tiny
  32-40px box. `Logo` renders it by height (`h-9 w-auto`), not forced into a
  square, so it stays undistorted.
- **Favicon**: `app/favicon.ico` (a Next.js App Router special file, auto-served
  and auto-linked at `/favicon.ico`) plus `public/favicon-16x16.png`,
  `public/favicon-32x32.png`, and `public/apple-touch-icon.png`, all generated
  from the same square, padded master crop of `public/logo.png` (green
  `#5fce81` background sampled directly from the source pixels, matching the
  rest of the brand palette) rather than the sidebar's tighter T/I crop —
  favicons need equal padding on all sides since they render as a square.
  `app/layout.tsx`'s `metadata.icons` declares the 16px/32px PNGs and the
  Apple touch icon explicitly; the `.ico` itself is deliberately **not**
  redeclared there since Next already auto-injects its `<link rel="icon">`
  from the special `app/favicon.ico` file — doing both would emit a
  duplicate tag. (An `app/favicon.ico` already existed from the original
  `create-next-app` scaffold — the default Vercel triangle mark — and takes
  precedence over anything dropped in `public/`, which is why replacing only
  `public/favicon.ico` wouldn't have been enough on its own.)
- **Why no `fs.existsSync` check**: an earlier version of `Logo` conditionally
  rendered the image only if `fs.existsSync` found `public/logo.png` at
  request time, falling back to a "TT" placeholder otherwise. That worked in
  local dev but silently failed on Vercel — serverless functions only bundle
  files an import-tracer (`@vercel/nft`) can statically detect, and a
  dynamically-built `path.join(process.cwd(), ...)` string isn't traceable,
  so the check returned `false` in production even though the file was
  deployed and served correctly by the CDN. Since the logo is now a
  permanent asset, `Logo` just renders it directly instead.
- **Sampled colors**: green `#5fce81` (logo background), white `#ffffff` (the
  "T"), navy/teal `#14435f` (the "I"), near-black `#0b0d0c` (the accent
  square) — pulled from the actual PNG pixel data, not eyeballed.
- **Text-on-green uses navy, not white.** White directly on the logo's green
  is 1.98:1 contrast — fails WCAG AA outright. Navy on the same green is
  5.32:1 (passes). Every place text or an icon sits on the green brand color
  (sidebar nav labels, the login/setup page headings, primary-button labels)
  uses navy for exactly this reason; white is reserved for text on navy
  (10.51:1) — the sidebar's active-nav-item state and the "teal" button
  variant.
- **Token map** (`app/globals.css`): `--brand`/`--brand-foreground` (green /
  navy-on-green — sidebar and login/setup backgrounds, `--primary`),
  `--brand-muted` (a slightly deeper green — sidebar hover state, still
  4.57:1 with navy text), `--brand-border` (translucent black — subtle
  dividers within the green sidebar chrome), `--accent-teal`/
  `--accent-teal-foreground` (navy / white-on-navy — links, headers, the
  `teal` button variant, focus rings via `--ring`), `--status-*` (pill
  backgrounds/foregrounds), `--channel-*` (per-channel colors),
  `--channel-tag-*-bg`/`-fg` (Channel Tag chip tints — see below).
- **Status pills** (`lib/status-config.ts`'s `LEAD_STATUS_CONFIG`, values in
  `app/globals.css`): recolored from the old blue/purple/yellow/orange set to
  tints and shades built from the brand green, navy, and black-derived
  neutrals, ordered light-to-deep along the pipeline (light neutral →
  light navy-tint → light green-tint → deeper navy/green/teal-blend tints →
  gray for the two terminal negative states). Every bg/fg pair is >= 4.5:1
  (computed via the WCAG relative-luminance formula, not eyeballed).
- **Dashboard chart colors** (`lib/chart-palette.ts`): `CATEGORICAL_PALETTE`
  keeps the dataviz skill's validated 8-hue reference ramp (re-validated as a
  set via its `validate_palette.js` after the swap — all hard gates pass),
  with the brand green swapped into the lead slot instead of hand-deriving a
  new ramp from scratch. `SEQUENTIAL_BRAND` (was `SEQUENTIAL_BLUE`) is brand
  green, used for the single-series daily line charts.
- **Channel Tag chip colors** (`lib/channel-tags.ts`'s `CHANNEL_TAG_CONFIG`,
  values in `app/globals.css`'s `--channel-tag-*-bg`/`-fg`): light-tint
  background + saturated foreground pairs derived from the same hues as
  `--channel-*` (email/LinkedIn/call/SMS), rather than the raw `--channel-*`
  hues themselves — those raw hues fail 4.5:1 contrast against white text
  for 2 of the 4 (email 4.10:1, call 3.30:1), so a *filled* saturated
  background with white text wasn't viable for a toggle/badge. The tint
  pairs (e.g. email: `#e0f2fe` bg / `#0369a1` fg) are separate CSS variables
  from `--status-*` and `--channel-*` since those are validated for
  different bg/fg combinations, not reused as-is.
- **Deliberately left unchanged**: `lib/channel-config.tsx`'s `CHANNEL_CONFIG`
  colors represent real per-channel brand identities (e.g. LinkedIn's actual
  brand blue) independent of the CRM's own theme, so they weren't recolored
  to fit the new palette — except SMS, which had reused the old orange
  accent-warm hex verbatim and got its own violet now that orange is retired
  from the app entirely.
- **The "navy" button variant was renamed `teal`** (`bg-accent-teal
  text-accent-teal-foreground`) since it was unused anywhere before this
  rebrand and now represents the navy/teal secondary-accent role rather than
  the old navy-as-primary-brand role.

## Database / deployment

`prisma/schema.prisma`'s `datasource db` targets PostgreSQL, reading
`DATABASE_URL` from the environment (a Neon connection string in
production). Vercel's filesystem is ephemeral — a SQLite file wouldn't
survive across deploys or serverless instances — so Postgres is required
there; for local dev, point `DATABASE_URL` at any Postgres instance
(local or a Neon branch).

The datasource also sets `directUrl = env("DIRECT_URL")`. Neon's pooled
(PgBouncer) connection — what `DATABASE_URL` should always point at, for
the app's own runtime queries — doesn't reliably support the postgres
advisory locks Prisma Migrate takes during `migrate deploy`/`migrate dev`,
which surfaced as a `P1002` "Timed out trying to acquire a postgres
advisory lock" failure on Vercel builds. `directUrl` gives Migrate a
separate connection string to use instead (Neon's direct/unpooled one) —
only the Prisma CLI reads it; `PrismaClient` at runtime always uses
`DATABASE_URL`. Locally, where there's no pooler in front of Postgres,
`DIRECT_URL` can just be the same value as `DATABASE_URL`.

`npm run build` is `prisma generate && prisma migrate deploy && next build`,
so pushing new migrations to the deployed branch applies them automatically
on the next Vercel build — no manual `migrate deploy` step needed. Local
schema changes still go through `npx prisma migrate dev` as usual to create
the migration file, which then gets picked up by `migrate deploy` on deploy.

## Environment variables

See `.env.example`. Required: `DATABASE_URL`, `DIRECT_URL` (Neon's
direct/unpooled connection string, used only by Prisma Migrate — see
"Database / deployment" below), `AUTH_SECRET` (NextAuth v5;
`NEXTAUTH_SECRET`/`NEXTAUTH_URL` are also set for compatibility). Optional,
for the Instantly.ai stretch goal: `INSTANTLY_API_KEY`,
`INSTANTLY_WEBHOOK_SECRET`. Optional but required for the contact detail
page's AI Insights/chat to actually call Anthropic rather than show a
"missing API key" error state: `ANTHROPIC_API_KEY`. Optional but required
for the contact avatar photo upload to actually store the image rather than
show a "photo storage isn't configured" error: `BLOB_READ_WRITE_TOKEN`
(connect a Vercel Blob store to the project on Vercel, or `vercel env pull`
locally). Seed-only (not read by
the app itself, only by `prisma/seed.ts`): `SKIP_DEMO_SEED`, `ADMIN_EMAIL`,
`ADMIN_PASSWORD` — see "Data layer" above.

## Local dev

```bash
npm install
npx prisma migrate dev   # first time / after schema changes
npx prisma db seed       # 6 sample contacts (+ 1 deal, 1 task), demo user
npm run dev
```

Demo login: `admin@transformtargets.com` / `password123`.

## Known gaps / stretch-goal state

- SMS sending is simulated (`sendSmsViaProvider` in `app/actions/touches.ts`
  is a stub) — no real carrier integration. It's structured as the single
  seam to drop in Twilio.
- Instantly.ai integration is webhook-only (no polling fallback implemented).
- No test suite yet.
- The AI Insights/chat error paths (missing API key, mid-stream failure)
  were verified end-to-end against a real Postgres instance without
  `ANTHROPIC_API_KEY` set; the happy path (an actual successful Anthropic
  response) has not been exercised against the real API in this environment
  and should be checked once a real key is available, before relying on it
  in production.
- Similarly, the contact avatar upload's error path (missing
  `BLOB_READ_WRITE_TOKEN`) was verified end-to-end, but the actual upload
  happy path has not been exercised against a real Vercel Blob store in
  this environment (no token available here either) — check that once the
  project has a Blob store connected, before relying on it in production.
- Editing an existing `Deal` or `Task` (`components/deals/deal-form-dialog.tsx`,
  `components/tasks/task-form-dialog.tsx`) opens the dialog with the form
  reset to blank/default values instead of the record's current values —
  `useForm({ defaultValues })` only applies once at mount, and neither
  dialog has a `useEffect` that calls `reset()` when the `deal`/`task` prop
  changes to a different record. Pre-existing, unrelated to the contact
  detail page work; noticed only because saving a Deal/Task with all-blank
  required fields surfaces a client-side validation error rather than
  silently corrupting anything. Not fixed here since it's out of scope for
  this change — worth a follow-up.
