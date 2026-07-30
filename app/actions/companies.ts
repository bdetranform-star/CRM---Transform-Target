"use server";

import { revalidatePath } from "next/cache";
import type { Industry, TeamMember } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { companyBulkEditSchema } from "@/lib/contact-bulk-edit";
import { industryEnum, teamMemberEnum } from "@/lib/validations";

export type CompanySummary = {
  name: string;
  contactCount: number;
  city: string | null;
  state: string | null;
  country: string | null;
  numberOfEmployees: number | null;
  /**
   * `industry`/`contactOwner` are required, non-nullable fields on Contact,
   * so — unlike city/state/country/numberOfEmployees above, where a rolled-up
   * `null` is ambiguous between "mixed" and "all empty" — a `null` roll-up
   * here can only mean the company's contacts disagree; the paired
   * `*Mixed` flag makes that explicit rather than relying on callers to know
   * that distinction.
   */
  industry: Industry | null;
  industryMixed: boolean;
  contactOwner: TeamMember | null;
  contactOwnerMixed: boolean;
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
    select: {
      company: true,
      city: true,
      state: true,
      country: true,
      numberOfEmployees: true,
      industry: true,
      contactOwner: true,
    },
  });

  const byCompany = new Map<string, typeof contacts>();
  for (const contact of contacts) {
    const name = contact.company as string;
    const list = byCompany.get(name) ?? [];
    list.push(contact);
    byCompany.set(name, list);
  }

  return Array.from(byCompany.entries())
    .map(([name, rows]) => {
      const industry = rollUp(rows.map((r) => r.industry));
      const contactOwner = rollUp(rows.map((r) => r.contactOwner));
      return {
        name,
        contactCount: rows.length,
        city: rollUp(rows.map((r) => r.city)),
        state: rollUp(rows.map((r) => r.state)),
        country: rollUp(rows.map((r) => r.country)),
        numberOfEmployees: rollUp(rows.map((r) => r.numberOfEmployees)),
        industry,
        industryMixed: industry === null,
        contactOwner,
        contactOwnerMixed: contactOwner === null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Bulk-sets Industry or Contact Owner across every Contact under the
 * selected company names. Companies aren't a real table, so this is just a
 * scoped `updateMany` keyed by `company` rather than by id.
 */
export async function bulkUpdateCompanyProperty(input: unknown): Promise<number> {
  await requireAuth();
  const { companyNames, field, value } = companyBulkEditSchema.parse(input);

  const data =
    field === "industry"
      ? { industry: industryEnum.parse(value) }
      : { contactOwner: teamMemberEnum.parse(value) };

  const result = await prisma.contact.updateMany({ where: { company: { in: companyNames } }, data });
  revalidatePath("/companies");
  revalidatePath("/contacts");
  revalidatePath("/");
  return result.count;
}
