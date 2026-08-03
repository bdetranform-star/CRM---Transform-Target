"use client";

import { PAGE_SIZE_OPTIONS, type PageSizeOption } from "./contacts-table-preferences";

const STORAGE_KEY = "ttcrm-contacts-page-size";

/** The user's last-selected Contacts table page size, persisted across sessions. */
export function getSavedPageSize(): PageSizeOption | null {
  if (typeof window === "undefined") return null;
  const raw = Number(window.localStorage.getItem(STORAGE_KEY));
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(raw) ? (raw as PageSizeOption) : null;
}

export function savePageSize(pageSize: PageSizeOption): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(pageSize));
}
