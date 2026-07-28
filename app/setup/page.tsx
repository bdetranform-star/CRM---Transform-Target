import Link from "next/link";

import { getSetupStatus } from "@/app/actions/setup";
import { SetupForm } from "@/components/setup-form";

// Must re-check the database on every request — a static build would bake
// in whichever needsSetup value existed at build time and never notice once
// the first admin account gets created.
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const { needsSetup } = await getSetupStatus();

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-white">Transform Targets CRM</h1>
          <p className="mt-1 text-sm text-white/60">
            {needsSetup ? "Create the first admin account" : "Setup already completed"}
          </p>
        </div>
        <div className="rounded-xl border border-navy-border bg-white p-6 shadow-lg">
          {needsSetup ? (
            <SetupForm />
          ) : (
            <div className="flex flex-col gap-3 text-center">
              <p className="text-sm text-muted-foreground">
                An admin account already exists for this CRM, so setup can&apos;t be run again.
              </p>
              <Link href="/login" className="text-sm font-medium text-primary hover:underline">
                Go to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
