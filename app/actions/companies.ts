"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export type CompanySummary = {
  name: string;
  contactCount: number;
  city: string | null;
  state: string | null;
  country: string | null;
  numberOfEmployees: number | null;
};

/** Returns "the single consistent value" across contacts, or null if they disagree or are all empty. */
function rollUp<T>(values: (T | null)[]): T | null {
  const nonNull = values.filter((v): v is T => v !== null && v !== undefined);
  if (nonNull.length === 0) return null;
  const [first, ...rest] = nonNull;
  return rest.every((v) => v === first) ? first : null;
}

/**
 * Companies are derived from Contact.company — there's no separate
 * Company table yet, per spec ("lightweight for now"). Grouping and
 * roll-ups happen in application code since Prisma's groupBy can't express
 * "is this field consistent across the group".
 */
export async function getCompanies(): Promise<CompanySummary[]> {
  await requireAuth();

  const contacts = await prisma.contact.findMany({
    where: { company: { not: null } },
    select: { company: true, city: true, state: true, country: true, numberOfEmployees: true },
  });

  const byCompany = new Map<string, typeof contacts>();
  for (const contact of contacts) {
    const name = contact.company as string;
    const list = byCompany.get(name) ?? [];
    list.push(contact);
    byCompany.set(name, list);
  }

  return Array.from(byCompany.entries())
    .map(([name, rows]) => ({
      name,
      contactCount: rows.length,
      city: rollUp(rows.map((r) => r.city)),
      state: rollUp(rows.map((r) => r.state)),
      country: rollUp(rows.map((r) => r.country)),
      numberOfEmployees: rollUp(rows.map((r) => r.numberOfEmployees)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
