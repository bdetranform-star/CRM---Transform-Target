import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-brand-foreground">Transform Targets CRM</h1>
          <p className="mt-1 text-sm font-medium text-brand-foreground">
            Cold-outreach tracking for Facility Maintenance / IFM
          </p>
        </div>
        <div className="rounded-xl border border-[var(--accent-teal)]/25 bg-white p-6 shadow-lg">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
