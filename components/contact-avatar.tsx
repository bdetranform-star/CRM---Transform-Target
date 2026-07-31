import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Renders a contact's uploaded photo (Vercel Blob) if avatarUrl is set,
 * otherwise falls back to an initials circle — used consistently on the
 * contact detail page, Board cards, and the Contacts table.
 */
export function ContactAvatar({
  firstName,
  lastName,
  avatarUrl,
  size = 40,
  className,
}: {
  firstName: string;
  lastName: string | null;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={`${firstName} ${lastName ?? ""}`}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  const initials = `${firstName[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[var(--brand)] font-semibold text-[var(--brand-foreground)]",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
    >
      {initials}
    </div>
  );
}

type AvatarPerson = {
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
};

/**
 * A small overlapping stack of ContactAvatars (e.g. for a Companies row,
 * where there's no single contact to show) — the first `max` people get a
 * circle each, and anything beyond that collapses into a trailing "+N"
 * circle rather than growing the stack unbounded.
 */
export function AvatarCluster({
  people,
  totalCount,
  size = 28,
  max = 3,
}: {
  people: AvatarPerson[];
  totalCount: number;
  size?: number;
  max?: number;
}) {
  const shown = people.slice(0, max);
  const overflow = totalCount - shown.length;

  return (
    <div className="flex items-center">
      {shown.map((person, i) => (
        <ContactAvatar
          key={i}
          firstName={person.firstName}
          lastName={person.lastName}
          avatarUrl={person.avatarUrl}
          size={size}
          className={cn("ring-2 ring-white", i > 0 && "-ml-2")}
        />
      ))}
      {overflow > 0 && (
        <div
          className="-ml-2 flex shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground ring-2 ring-white"
          style={{ width: size, height: size, fontSize: Math.max(9, size * 0.32) }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
