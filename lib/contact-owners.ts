const OWNER_FIRST_NAMES = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Avery",
  "Cameron", "Drew", "Reese", "Skyler", "Peyton", "Quinn", "Rowan", "Sage",
  "Emerson", "Finley", "Harper", "Hayden",
];
const OWNER_LAST_NAMES = [
  "Bennett", "Carter", "Diaz", "Ellis", "Foster", "Grant", "Hayes", "Irwin",
  "Jenkins", "Kim", "Lewis", "Marsh", "Nolan", "Ortiz", "Parker", "Quinn",
  "Reyes", "Sanders", "Turner", "Vance",
];
const OWNER_DOMAINS = [
  "transformtargets-mail.com",
  "transformtargets-outreach.com",
  "transformtargets-sales.com",
  "transformtargets-connect.com",
  "transformtargets-growth.com",
];

/**
 * Deterministically generates the pool of placeholder "sending account"
 * emails. Used by prisma/seed.ts (to attach owners to seeded contacts) and
 * by the app itself (to offer the full pool as selectable options,
 * independent of which owners happen to already be assigned to a contact).
 */
export function buildSeedOwners(count: number): string[] {
  const owners = new Set<string>();
  let i = 0;
  while (owners.size < count) {
    const first = OWNER_FIRST_NAMES[i % OWNER_FIRST_NAMES.length];
    const last = OWNER_LAST_NAMES[Math.floor(i / OWNER_FIRST_NAMES.length) % OWNER_LAST_NAMES.length];
    const domain = OWNER_DOMAINS[i % OWNER_DOMAINS.length];
    const suffix = Math.floor(i / (OWNER_FIRST_NAMES.length * OWNER_LAST_NAMES.length));
    const local = `${first.toLowerCase()}.${last.toLowerCase()}${suffix > 0 ? suffix : ""}`;
    owners.add(`${local}@${domain}`);
    i++;
  }
  return Array.from(owners);
}

export const SEEDED_CONTACT_OWNER_POOL = buildSeedOwners(100);
