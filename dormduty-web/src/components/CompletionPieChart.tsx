"use client";

import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export type CompletionDataPoint = {
  name: string;
  value: number;
};

const DEFAULT_COLORS = ["#10B981", "#F59E0B", "#3B82F6", "#6366F1"];

export function CompletionPieChart({
  data,
  colors = DEFAULT_COLORS,
  title,
}: {
  data: CompletionDataPoint[];
  colors?: string[];
  title?: string;
}) {
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
  const completed = data.find((item) => item.name === "Completed")?.value ?? 0;
  const rate = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex h-full flex-col items-center justify-between rounded-3xl border border-gray-100 bg-white/70 p-6 shadow-md backdrop-blur">
      {title ? <h2 className="text-xl font-semibold text-gray-800">{title}</h2> : null}
      <div className="h-56 w-full">
        <ResponsiveContainer>
          <RePieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value">
              {data.map((_, index) => (
                <Cell key={index} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
              }}
            />
            <Legend />
          </RePieChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 text-sm text-gray-600">
        <span className="font-semibold text-emerald-600">{rate}%</span> of tasks completed this week
      </p>
    </div>
  );
}
