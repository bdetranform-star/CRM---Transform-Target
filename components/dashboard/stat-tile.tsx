import { ArrowDown, ArrowUp } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatTile({
  title,
  value,
  changePct,
  subLabel,
}: {
  title: string;
  value: number;
  changePct?: number | null;
  subLabel?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          <span className="text-3xl font-semibold">{value.toLocaleString()}</span>
          {changePct !== null && changePct !== undefined && (
            <span
              className={cn(
                "mb-1 flex items-center gap-0.5 text-xs font-medium",
                changePct >= 0 ? "text-emerald-600" : "text-destructive"
              )}
            >
              {changePct >= 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
              {Math.abs(changePct)}%
            </span>
          )}
        </div>
        {subLabel && <p className="mt-1 text-xs text-muted-foreground">{subLabel}</p>}
      </CardContent>
    </Card>
  );
}
