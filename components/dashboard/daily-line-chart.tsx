"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SEQUENTIAL_BLUE } from "@/lib/chart-palette";

export function DailyLineChart({
  title,
  data,
}: {
  title: string;
  data: { date: string; count: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--border)",
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={SEQUENTIAL_BLUE}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
