import { Suspense } from "react";

import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#0b0d0c]">
      {/*
        Layered backgrounds, front to back: the hero photo (drop your own
        file in as public/login-bg.jpg — nothing else needs to change), a
        soft brand-green glow, then a navy/near-black gradient. CSS paints
        background-image layers in this order and simply skips any layer
        that fails to load, so a missing login-bg.jpg just exposes the
        gradient underneath instead of a broken-image icon.
      */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('/login-bg.jpg'), radial-gradient(circle at 25% 15%, rgba(95,206,129,0.16), transparent 55%), linear-gradient(135deg, #0b0d0c 0%, #14435f 55%, #0b0d0c 100%)",
        }}
      />
      {/* Dark overlay so hero text stays readable over any background photo */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/50 to-black/70" />

      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <header className="flex animate-in fade-in slide-in-from-top-2 items-center gap-2.5 px-6 py-6 duration-500 sm:px-10">
          <Logo />
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">Transform Targets</p>
            <p className="text-xs font-medium text-white/70">CRM</p>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center gap-12 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-20">
          <div className="max-w-xl text-center lg:text-left">
            <h1 className="animate-in fade-in slide-in-from-bottom-4 text-4xl font-bold leading-[1.1] text-white duration-700 sm:text-5xl lg:text-6xl">
              Offshore Teams.
              <br />
              Onshore Results.
            </h1>
            <p className="mt-4 animate-in fade-in slide-in-from-bottom-4 text-lg font-medium text-white/70 delay-150 duration-700 sm:text-xl">
              More capacity. Better execution.
            </p>
            <div className="mt-6 inline-flex animate-in fade-in slide-in-from-bottom-4 items-center gap-2 rounded-full border border-[var(--brand)]/40 bg-white/5 px-4 py-2 delay-300 duration-700 backdrop-blur-sm">
              <span className="size-2 shrink-0 rounded-full bg-[var(--brand)] shadow-[0_0_10px_2px_var(--brand)]" />
              <span
                className="text-sm font-bold tracking-wide text-[var(--brand)] sm:text-base"
                style={{ textShadow: "0 0 18px rgba(95,206,129,0.55)" }}
              >
                50–60%+ lower cost
              </span>
            </div>
          </div>

          <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-6 delay-300 duration-700">
            <div className="rounded-2xl border border-white/30 bg-white/90 p-6 shadow-2xl backdrop-blur-xl">
              <div className="mb-6 text-center">
                <h2 className="text-lg font-semibold text-foreground">Welcome back</h2>
                <p className="mt-1 text-sm text-muted-foreground">Sign in to your CRM</p>
              </div>
              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
