"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { TeamMember } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CATEGORICAL_PALETTE } from "@/lib/chart-palette";

export function TeamActivityChart({
  data,
}: {
  data: { member: TeamMember; label: string; count: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Team activity summary</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 32 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              angle={-30}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--border)",
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={entry.member} fill={CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
