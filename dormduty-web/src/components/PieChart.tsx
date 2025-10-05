/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";
import React from "react";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * Reusable Pie Chart Component
 * @param {Array} data - Array of objects with { name, value }
 * @param {Array} colors - Array of colors for chart slices
 * @param {String} title - Title of the chart
 */
const PieChart = ({ data, colors, title }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const completed = data.find((d) => d.name === "Completed")?.value ?? 0;
  const rate = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-3xl shadow-md hover:shadow-lg transition p-6 flex flex-col items-center">
      {/* Title */}
      {title && (
        <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
      )}

      {/* Chart */}
      <div className="w-full h-56">
        <ResponsiveContainer>
          <RePieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
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

      {/* Summary */}
      <p className="mt-4 text-sm text-gray-600 text-center">
        <span className="font-semibold text-emerald-600">{rate}%</span> of tasks completed this week
      </p>
    </div>
  );
};

export default PieChart;
