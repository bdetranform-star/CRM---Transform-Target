import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-white">Transform Targets CRM</h1>
          <p className="mt-1 text-sm text-white/60">
            Cold-outreach tracking for Facility Maintenance / IFM
          </p>
        </div>
        <div className="rounded-xl border border-navy-border bg-white p-6 shadow-lg">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
