import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function OpenTasksSummary({ open, overdue }: { open: number; overdue: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Open tasks summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-8">
          <div>
            <span className="text-3xl font-semibold">{open.toLocaleString()}</span>
            <p className="mt-1 text-xs text-muted-foreground">Open tasks</p>
          </div>
          <div>
            <span className="text-3xl font-semibold text-destructive">{overdue.toLocaleString()}</span>
            <p className="mt-1 text-xs text-muted-foreground">Overdue</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
