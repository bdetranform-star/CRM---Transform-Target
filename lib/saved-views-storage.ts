"use client";

const STORAGE_KEY = "ttcrm-custom-contact-views";

export type CustomView = {
  id: string;
  name: string;
  /** The full contacts-page query string (without leading "?") to restore. */
  queryString: string;
};

export function getCustomViews(): CustomView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomView[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomView(name: string, queryString: string): CustomView[] {
  const views = getCustomViews();
  const view: CustomView = { id: crypto.randomUUID(), name, queryString };
  const next = [...views, view];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function removeCustomView(id: string): CustomView[] {
  const next = getCustomViews().filter((v) => v.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
