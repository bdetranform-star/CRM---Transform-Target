import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

/**
 * Renders public/logo.png if it exists, otherwise a "TT" placeholder sized
 * identically so dropping the real file in later is a zero-code swap.
 * Reads the filesystem, so this stays a Server Component (not "use client").
 */
export function Logo() {
  const hasLogo = fs.existsSync(path.join(process.cwd(), "public", "logo.png"));

  if (hasLogo) {
    return (
      <Image
        src="/logo.png"
        alt="Transform Targets"
        width={32}
        height={32}
        className="size-8 shrink-0 rounded-md object-contain"
      />
    );
  }

  return (
    <div
      className="flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-bold"
      style={{ backgroundColor: "#12151C", color: "var(--accent-warm)" }}
    >
      TT
    </div>
  );
}
