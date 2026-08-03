"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import {
  contactCreateSchema,
  contactUpdateSchema,
  bulkStatusChangeSchema,
  bulkDeleteSchema,
  leadStatusEnum,
  industryEnum,
  teamMemberEnum,
  linkedinLifecycleStageEnum,
} from "@/lib/validations";
import { LEAD_STATUS_ORDER, LINKEDIN_LIFECYCLE_STAGE_ORDER, LINKEDIN_LIFECYCLE_STAGE_DEFAULT } from "@/lib/status-config";
import { TEAM_MEMBERS } from "@/lib/contact-owners";
import { buildWhereFromFilters, contactFilterSchema, type ContactFilter } from "@/lib/contact-filters";
import { bulkEditContactsSchema, buildBulkUpdateData } from "@/lib/contact-bulk-edit";
import { SAVED_VIEWS } from "@/lib/saved-views";

export async function getBoardContacts() {
  await requireAuth();

  const contacts = await prisma.contact.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: true,
      email: true,
      leadStatus: true,
      industry: true,
      contactOwner: true,
      sequenceStep: true,
      avatarUrl: true,
      channelTags: true,
    },
  });

  const grouped = Object.fromEntries(
    LEAD_STATUS_ORDER.map((status) => [status, [] as typeof contacts])
  ) as Record<(typeof LEAD_STATUS_ORDER)[number], typeof contacts>;

  for (const contact of contacts) {
    grouped[contact.leadStatus].push(contact);
  }

  return grouped;
}

/**
 * Contacts grouped by `linkedinLifecycleStage` for the separate LinkedIn
 * Lifecycle board (/linkedin-lifecycle) — distinct from the main Lead Board,
 * which groups by `leadStatus`. The field is nullable (not every contact
 * goes through LinkedIn outreach), so contacts with no stage set yet are
 * bucketed into the leftmost "Not Contacted" column for display; the
 * underlying value stays null until the contact is actually dragged.
 */
export async function getLinkedinLifecycleBoardContacts() {
  await requireAuth();

  const rows = await prisma.contact.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: true,
      email: true,
      linkedinLifecycleStage: true,
      linkedinConnectionStatus: true,
      contactOwner: true,
      avatarUrl: true,
    },
  });

  // Display-only default: a contact with no stage set yet shows up in the
  // leftmost "Not Contacted" column, but the DB value stays null until the
  // contact is actually dragged (see updateContactLinkedinLifecycleStage()).
  const contacts = rows.map((r) => ({
    ...r,
    linkedinLifecycleStage: r.linkedinLifecycleStage ?? LINKEDIN_LIFECYCLE_STAGE_DEFAULT,
  }));

  const grouped = Object.fromEntries(
    LINKEDIN_LIFECYCLE_STAGE_ORDER.map((stage) => [stage, [] as typeof contacts])
  ) as Record<(typeof LINKEDIN_LIFECYCLE_STAGE_ORDER)[number], typeof contacts>;

  for (const contact of contacts) {
    grouped[contact.linkedinLifecycleStage].push(contact);
  }

  return grouped;
}

export async function updateContactLinkedinLifecycleStage(id: string, stage: string) {
  await requireAuth();
  const parsedId = z.string().uuid().parse(id);
  const parsedStage = linkedinLifecycleStageEnum.parse(stage);

  const contact = await prisma.contact.update({
    where: { id: parsedId },
    data: { linkedinLifecycleStage: parsedStage },
  });
  revalidatePath("/linkedin-lifecycle");
  revalidatePath("/contacts");
  return contact;
}

function savedViewWhere(view?: string): Prisma.ContactWhereInput {
  switch (view) {
    case SAVED_VIEWS.OPEN_OPPORTUNITIES:
      return { leadStatus: "OPEN_OPPORTUNITIES" };
    case SAVED_VIEWS.NEED_FOLLOW_UP:
      return { leadStatus: { in: ["OPEN_PROSPECT", "IN_PROCESS", "EMAIL_SENT"] } };
    case SAVED_VIEWS.INITIAL_CONVERSATION:
      return { leadStatus: "CONNECTED" };
    default:
      return {};
  }
}

export type ContactsTableParams = {
  page: number;
  pageSize: number;
  search?: string;
  industry?: string;
  contactOwner?: string;
  leadStatus?: string;
  savedView?: string;
  filters?: ContactFilter[];
  sortField?: string;
  sortDirection?: "asc" | "desc";
};

const SORTABLE_FIELDS = new Set([
  "firstName",
  "lastName",
  "email",
  "company",
  "designation",
  "contactOwner",
  "leadStatus",
  "lifecycleStage",
  "industry",
  "leadSource",
  "sequenceStep",
  "createdAt",
  "updatedAt",
  "lastContactDate",
  "linkedinConnectionStatus",
  "linkedinConnectedOn",
  "linkedinLifecycleStage",
  "interestedResponseFrom",
  "linkedinRegion",
  "linkedinResponseType",
]);

export async function getContactsTable(params: ContactsTableParams) {
  await requireAuth();

  const page = Math.max(1, params.page);
  const pageSize = Math.min(200, Math.max(1, params.pageSize));

  const where: Prisma.ContactWhereInput = { ...savedViewWhere(params.savedView) };

  if (params.search) {
    where.OR = [
      { firstName: { contains: params.search } },
      { lastName: { contains: params.search } },
      { company: { contains: params.search } },
      { email: { contains: params.search } },
    ];
  }

  if (params.industry) {
    const parsedIndustry = industryEnum.safeParse(params.industry);
    if (parsedIndustry.success) where.industry = parsedIndustry.data;
  }

  if (params.leadStatus) {
    const parsedStatus = leadStatusEnum.safeParse(params.leadStatus);
    if (parsedStatus.success) where.leadStatus = parsedStatus.data;
  }

  if (params.contactOwner) {
    const parsedOwner = teamMemberEnum.safeParse(params.contactOwner);
    if (parsedOwner.success) where.contactOwner = parsedOwner.data;
  }

  if (params.filters?.length) {
    // Server Actions are directly callable, so re-validate here too rather
    // than trusting the caller already ran this through contactFilterSchema.
    const validFilters = params.filters.filter((f) => contactFilterSchema.safeParse(f).success);
    Object.assign(where, buildWhereFromFilters(validFilters));
  }

  const sortField =
    params.sortField && SORTABLE_FIELDS.has(params.sortField) ? params.sortField : "updatedAt";
  const sortDirection = params.sortDirection === "asc" ? "asc" : "desc";

  const [rows, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { [sortField]: sortDirection },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        touches: {
          where: { channel: "CALL" },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.contact.count({ where }),
  ]);

  const rowsWithCallStats = rows.map(({ touches, ...contact }) => ({
    ...contact,
    callCount: touches.length,
    lastCallOutcome: touches[0]?.outcome ?? null,
  }));

  return {
    rows: rowsWithCallStats,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Counts for each saved-view tab, shown live on the tab itself. */
export async function getSavedViewCounts() {
  await requireAuth();
  const [all, openOpportunities, needFollowUp, initialConversation] = await Promise.all([
    prisma.contact.count(),
    prisma.contact.count({ where: savedViewWhere(SAVED_VIEWS.OPEN_OPPORTUNITIES) }),
    prisma.contact.count({ where: savedViewWhere(SAVED_VIEWS.NEED_FOLLOW_UP) }),
    prisma.contact.count({ where: savedViewWhere(SAVED_VIEWS.INITIAL_CONVERSATION) }),
  ]);
  return {
    [SAVED_VIEWS.ALL]: all,
    [SAVED_VIEWS.OPEN_OPPORTUNITIES]: openOpportunities,
    [SAVED_VIEWS.NEED_FOLLOW_UP]: needFollowUp,
    [SAVED_VIEWS.INITIAL_CONVERSATION]: initialConversation,
  };
}

/** Owners currently assigned to at least one contact — used for the Contacts table filter. */
export async function getContactOwners() {
  await requireAuth();
  const owners = await prisma.contact.findMany({
    distinct: ["contactOwner"],
    select: { contactOwner: true },
    orderBy: { contactOwner: "asc" },
  });
  return owners.map((o) => o.contactOwner);
}

/**
 * The full pool of selectable contact owners (the 5 named team members).
 * Unlike getContactOwners(), this doesn't depend on any contact actually
 * being assigned that owner yet — it's the list for assigning an owner to a
 * *new* contact (manual create or import), so it's populated even when the
 * Contact table is empty.
 */
export async function getContactOwnerPool() {
  await requireAuth();
  return TEAM_MEMBERS;
}

export async function getContactDetail(id: string) {
  await requireAuth();
  return prisma.contact.findUnique({
    where: { id },
    include: {
      touches: { orderBy: { createdAt: "desc" } },
      deals: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { dueDate: "asc" } },
    },
  });
}

export async function createContact(input: unknown) {
  await requireAuth();
  const data = contactCreateSchema.parse(input);

  const contact = await prisma.contact.create({ data });
  revalidatePath("/");
  revalidatePath("/contacts");
  return contact;
}

export async function updateContact(input: unknown) {
  await requireAuth();
  const { id, ...data } = contactUpdateSchema.parse(input);

  const contact = await prisma.contact.update({ where: { id }, data });
  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath("/linkedin");
  revalidatePath("/linkedin-lifecycle");
  revalidatePath("/calls");
  return contact;
}

export async function updateContactStatus(id: string, leadStatus: string) {
  await requireAuth();
  const parsedId = z.string().uuid().parse(id);
  const parsedStatus = leadStatusEnum.parse(leadStatus);

  const contact = await prisma.contact.update({
    where: { id: parsedId },
    data: { leadStatus: parsedStatus },
  });
  revalidatePath("/");
  revalidatePath("/contacts");
  return contact;
}

export async function deleteContact(id: string) {
  await requireAuth();
  const parsedId = z.string().uuid().parse(id);
  await prisma.contact.delete({ where: { id: parsedId } });
  revalidatePath("/");
  revalidatePath("/contacts");
}

export async function bulkUpdateStatus(input: unknown) {
  await requireAuth();
  const { ids, leadStatus } = bulkStatusChangeSchema.parse(input);
  await prisma.contact.updateMany({ where: { id: { in: ids } }, data: { leadStatus } });
  revalidatePath("/");
  revalidatePath("/contacts");
}

export async function bulkDeleteContacts(input: unknown) {
  await requireAuth();
  const { ids } = bulkDeleteSchema.parse(input);
  await prisma.contact.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/");
  revalidatePath("/contacts");
}

/** Bulk-sets one or more properties across every selected contact. */
export async function bulkUpdateContactProperties(input: unknown): Promise<number> {
  await requireAuth();
  const { ids, changes } = bulkEditContactsSchema.parse(input);

  const data = buildBulkUpdateData(changes);
  // buildBulkUpdateData() silently drops any invalid/incomplete change, so a
  // hand-crafted request with no valid changes left could otherwise reach
  // Prisma as an empty `data: {}` — updateMany() with no fields still bumps
  // every matched row's `@updatedAt`, a real (if silent) side effect on
  // records the caller never actually asked to touch.
  if (Object.keys(data).length === 0) {
    throw new Error("No valid changes to apply.");
  }

  const result = await prisma.contact.updateMany({ where: { id: { in: ids } }, data });
  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath("/companies");
  return result.count;
}
