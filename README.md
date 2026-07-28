# Transform Targets CRM

A CRM for tracking cold-outreach leads in the Facility Maintenance / IFM
industry across four channels: Email, LinkedIn, Cold Calling, and SMS/Text.

See [`CLAUDE.md`](./CLAUDE.md) for the full architecture, data model, and
conventions.

## Getting started

```bash
npm install
cp .env.example .env       # then adjust as needed
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo login:
`admin@transformtargets.com` / `password123`.

## Tech stack

Next.js 15 (App Router, TypeScript) · Prisma + PostgreSQL · NextAuth.js ·
Tailwind CSS + shadcn/ui · TanStack Table · dnd-kit · react-hook-form + zod ·
papaparse · Recharts.
