/** The Contacts table's selectable "rows per page" options. */
export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_PAGE_SIZE: PageSizeOption = 50;

function isPageSizeOption(value: number): value is PageSizeOption {
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(value);
}

/** Parses the `?pageSize=` URL param, falling back to the default for anything unrecognized. */
export function parsePageSize(raw: string | undefined): PageSizeOption {
  const num = Number(raw);
  return isPageSizeOption(num) ? num : DEFAULT_PAGE_SIZE;
}
