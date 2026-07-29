"use client";

import { Pie, PieChart, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CATEGORICAL_PALETTE } from "@/lib/chart-palette";

export function TaskStatusChart({
  data,
}: {
  data: { status: string; label: string; count: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Task status breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              label={({ name, value }) => `${name} (${value})`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.status}
                  fill={CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length]}
                  stroke="var(--background)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--border)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
