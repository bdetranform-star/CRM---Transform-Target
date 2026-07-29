import Image from "next/image";

/**
 * public/logo.png is a committed, version-controlled asset (not something
 * optionally dropped in later), so this renders it unconditionally rather
 * than gating on fs.existsSync at request time — that check works fine in
 * local dev but is unreliable on Vercel: serverless functions only bundle
 * files an import-tracer can statically detect, and a dynamically-built
 * fs path like this one isn't traceable, so the check silently returns
 * false in production even though the file is deployed and served fine.
 *
 * It's a tight crop around just the T/I mark (the source file has a lot of
 * green padding around it) at its native ~1.275:1 aspect ratio, so it's
 * rendered by height rather than forced into a square — it shares the
 * sidebar's green background color, so it blends in seamlessly rather than
 * showing a visible square frame.
 */
export function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="Transform Targets"
      width={46}
      height={36}
      priority
      className="h-9 w-auto shrink-0 object-contain"
    />
  );
}
