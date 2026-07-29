import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

/**
 * Renders public/logo.png if it exists, otherwise a "TT" placeholder sized
 * identically so dropping the real file in later is a zero-code swap.
 * Reads the filesystem, so this stays a Server Component (not "use client").
 *
 * public/logo.png is a tight crop around just the T/I mark (the source file
 * has a lot of green padding around it) at its native ~1.275:1 aspect ratio,
 * so it's rendered by height rather than forced into a square — it shares
 * the sidebar's green background color, so it blends in seamlessly rather
 * than showing a visible square frame.
 */
export function Logo() {
  const hasLogo = fs.existsSync(path.join(process.cwd(), "public", "logo.png"));

  if (hasLogo) {
    return (
      <Image
        src="/logo.png"
        alt="Transform Targets"
        width={46}
        height={36}
        className="h-9 w-auto shrink-0 object-contain"
      />
    );
  }

  return (
    <div
      className="flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-bold"
      style={{ backgroundColor: "var(--brand)", color: "var(--accent-teal)" }}
    >
      TT
    </div>
  );
}
