"use client";


import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Crown } from "lucide-react";
import RoommateCard from "../components/RoommateCard";

const roommates = [
  { name: "Salman", aura: 25, role: "Dorm Master" },
  { name: "Ayman", aura: 20 },
  { name: "Anan", aura: 15 },
  { name: "Yeaz", aura: 18 },
];

<div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
  {roommates.map((user) => (
    <RoommateCard
      key={user.name}
      name={user.name}
      aura={user.aura}
      role={user.role}
    />
  ))}
</div>;



const Home = () => {
  const roommates = [
    { id: 1, name: "Salman", aura: 25 },
    { id: 2, name: "Ayman", aura: 30 },
    { id: 3, name: "Anan", aura: 15 },
    { id: 4, name: "Yeaz", aura: 20 },
  ];

  const taskStats = [
    { name: "Completed", value: 12 },
    { name: "Pending", value: 8 },
  ];

  const COLORS = ["#10B981", "#F59E0B"];
  const totalTasks = taskStats.reduce((s, t) => s + t.value, 0);
  const completed = taskStats.find((t) => t.name === "Completed")?.value ?? 0;
  const rate = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;
  const dormMaster = roommates.reduce((a, b) => (b.aura > a.aura ? b : a));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-emerald-100 p-6 flex flex-col">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-blue-600 tracking-tight drop-shadow-sm">
            Home Duty 
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Welcome back 👋,{" "}
            <span className="font-semibold text-emerald-600">
              {dormMaster.name}
            </span>
          </p>
        </div>
        <div className="mt-4 sm:mt-0 bg-white/80 backdrop-blur-md border border-gray-100 rounded-xl px-4 py-2 shadow-sm">
          <p className="text-sm text-gray-600">
            Weekly Completion Rate:{" "}
            <span className="text-emerald-600 font-semibold">{rate}%</span>
          </p>
        </div>
      </header>

      {/* Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-grow">
        {/* Roommates */}
        <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-3xl shadow-md hover:shadow-lg transition p-6">
          <h2 className="text-xl font-semibold mb-5 text-gray-800 flex items-center gap-2">
            👥 Roommates
          </h2>
          <ul className="space-y-3">
            {roommates.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-3 hover:scale-[1.02] transition-transform duration-200"
              >
                <span className="font-medium text-gray-700">{u.name}</span>
                <span className="text-sm text-gray-500">{u.aura} Aura</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pie Chart */}
        <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-3xl shadow-md hover:shadow-lg transition p-6 flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            📊 Weekly Tasks Overview
          </h2>
          <div className="w-full h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={taskStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {taskStats.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                      className="cursor-pointer"
                    />
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
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            <span className="font-semibold text-emerald-600">{rate}%</span> of
            tasks completed this week
          </p>
        </div>

        {/* Dorm Master */}
        <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200 rounded-3xl shadow-inner p-6 flex flex-col items-center justify-center text-center hover:shadow-lg transition">
          <Crown className="text-yellow-500 w-10 h-10 mb-3 animate-bounce" />
          <h2 className="text-lg font-bold text-gray-800">Dorm Master 👑</h2>
          <p className="text-3xl font-extrabold text-emerald-700">
            {dormMaster.name}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Aura: {dormMaster.aura} points
          </p>
          <div className="mt-4 bg-emerald-500/10 rounded-xl px-4 py-2 text-sm text-emerald-700 font-medium">
            Leading with great responsibility 💪
          </div>
        </div>
      </div>

      {/* Footer Nav */}
      <footer className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-gray-200 shadow-inner flex justify-around py-3">
        {[
          { icon: "🏠", label: "Home" },
          { icon: "📋", label: "Tasks" },
          { icon: "🧺", label: "Laundry" },
          { icon: "💸", label: "Split" },
        ].map((tab) => (
          <button
            key={tab.label}
            className="text-gray-700 hover:text-blue-600 transition-all font-medium flex flex-col items-center gap-1 text-sm"
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </footer>
    </div>
  );
};

export default Home;
