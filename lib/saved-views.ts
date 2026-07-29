import type { ContactFilter } from "@/lib/contact-filters";

/** Saved-view tabs on the Contacts page — preset leadStatus filters. */
export const SAVED_VIEWS = {
  ALL: "ALL",
  OPEN_OPPORTUNITIES: "OPEN_OPPORTUNITIES",
  NEED_FOLLOW_UP: "NEED_FOLLOW_UP",
  INITIAL_CONVERSATION: "INITIAL_CONVERSATION",
} as const;

export type SavedView = (typeof SAVED_VIEWS)[keyof typeof SAVED_VIEWS];

/**
 * Each preset view's base filter, for display only — rendered as a locked,
 * non-removable chip in the filters row so it's clear the view is already
 * scoped before any user-added filters are combined on top. Must mirror
 * `savedViewWhere()` in app/actions/contacts.ts exactly; that function (not
 * this one) is what actually executes the query.
 */
export const SAVED_VIEW_LOCKED_FILTER: Partial<Record<SavedView, ContactFilter>> = {
  [SAVED_VIEWS.OPEN_OPPORTUNITIES]: {
    field: "leadStatus",
    operator: "is_any_of",
    values: ["OPEN_OPPORTUNITIES"],
  },
  [SAVED_VIEWS.NEED_FOLLOW_UP]: {
    field: "leadStatus",
    operator: "is_any_of",
    values: ["OPEN_PROSPECT", "IN_PROCESS", "EMAIL_SENT"],
  },
  [SAVED_VIEWS.INITIAL_CONVERSATION]: {
    field: "leadStatus",
    operator: "is_any_of",
    values: ["CONNECTED"],
  },
};
