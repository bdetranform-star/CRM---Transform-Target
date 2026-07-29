import { Check } from "lucide-react";

import { SEQUENCE_STEPS } from "@/lib/status-config";
import { cn } from "@/lib/utils";

export function SequenceProgress({ sequenceStep }: { sequenceStep: number }) {
  return (
    <div className="flex items-center">
      {SEQUENCE_STEPS.map((s, idx) => {
        const isDone = sequenceStep > s.step;
        const isCurrent = sequenceStep === s.step;
        return (
          <div key={s.step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border text-xs font-medium",
                  isDone && "border-[var(--accent-teal)] bg-[var(--accent-teal)] text-white",
                  isCurrent &&
                    "border-[var(--accent-teal)] text-[var(--accent-teal)] bg-white ring-2 ring-[var(--accent-teal)]/20",
                  !isDone && !isCurrent && "border-border bg-white text-muted-foreground"
                )}
              >
                {isDone ? <Check className="size-3.5" /> : s.step + 1}
              </div>
              <span
                className={cn(
                  "text-[11px]",
                  isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {idx < SEQUENCE_STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-px flex-1",
                  sequenceStep > s.step ? "bg-[var(--accent-teal)]" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
