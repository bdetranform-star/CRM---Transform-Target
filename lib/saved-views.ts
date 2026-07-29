/** Saved-view tabs on the Contacts page — preset leadStatus filters. */
export const SAVED_VIEWS = {
  ALL: "ALL",
  OPEN_OPPORTUNITIES: "OPEN_OPPORTUNITIES",
  NEED_FOLLOW_UP: "NEED_FOLLOW_UP",
  INITIAL_CONVERSATION: "INITIAL_CONVERSATION",
} as const;

export type SavedView = (typeof SAVED_VIEWS)[keyof typeof SAVED_VIEWS];
