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
