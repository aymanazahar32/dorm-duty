"use client";

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Crown,
  Bell,
  Calendar,
  Clock,
  CheckCircle2,
  Zap,
  Wallet,
  CloudSun,
  MessageCircle,
  Users,
  Sparkles,
} from "lucide-react";
import RoommateCard from "../components/RoommateCard";

// Mock Data
const currentUser = "Salman";
const roommates = [
  { name: "Salman", aura: 30, role: "Dorm Master", bio: "Manages chores efficiently" },
  { name: "Ayman", aura: 25, bio: "Laundry manager" },
  { name: "Anan", aura: 18, bio: "Keeps the kitchen clean" },
  { name: "Yeaz", aura: 22, bio: "Good at budgeting" },
];
const taskStats = [
  { name: "Completed", value: 12 },
  { name: "Pending", value: 8 },
];
const laundryBookings = [
  { id: 1, machine: "Washer", user: "Ayman", start: "2025-10-06T10:00", end: "2025-10-06T10:45" },
  { id: 2, machine: "Dryer", user: "Salman", start: "2025-10-06T11:00", end: "2025-10-06T11:45" },
];
const COLORS = ["#34D399", "#FBBF24"];

const daysUntil = (dueDate) => {
  if (!dueDate) return null;
  const due = new Date(`${dueDate}T23:59:59`);
  const now = new Date();
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
};

const UpcomingTasksList = () => {
  const tasks = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("tasks") || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }, []);

  const upcoming = useMemo(() => {
    return tasks
      .filter((t) => !t.completed && t.dueDate)
      .map((t) => ({ ...t, _diff: daysUntil(t.dueDate) }))
      .filter((t) => t._diff !== null && t._diff >= 0)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 6);
  }, [tasks]);

  if (!upcoming.length) {
    return <p className="text-sm text-gray-500">No upcoming tasks.</p>;
  }

  return (
    <div className="space-y-2">
      {upcoming.map((t) => (
        <div
          key={t.id}
          className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition"
        >
          <div className="text-sm text-gray-700">
            <span className="font-medium text-gray-800">{t.title}</span>
            <span className="text-gray-500"> • {t.assignedTo}</span>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">
            {t._diff === 0 ? "Due today" : t._diff === 1 ? "Due in 1 day" : `Due in ${t._diff} days`}
          </span>
        </div>
      ))}
    </div>
  );
};

const Home = () => {
  const totalTasks = taskStats.reduce((s, t) => s + t.value, 0);
  const completed = taskStats.find((t) => t.name === "Completed")?.value ?? 0;
  const rate = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;
  const dormMaster = roommates.reduce((a, b) => (b.aura > a.aura ? b : a));

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning 🌞";
    if (hour < 18) return "Good Afternoon 🌤️";
    return "Good Evening 🌙";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-6 flex flex-col gap-10">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-blue-700 mb-1">
            {greeting}, {currentUser}! 👋
          </h1>
          <p className="text-gray-500 text-sm">
            Here’s your dorm’s latest updates and stats.
          </p>
        </div>
        <button className="relative rounded-full bg-white shadow-md p-3 hover:bg-blue-50 transition">
          <Bell className="text-gray-600 w-5 h-5" />
          <span className="absolute top-2 right-2 bg-red-500 w-2.5 h-2.5 rounded-full"></span>
        </button>
      </header>

      {/* OVERVIEW GRID */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { label: "Tasks Done", value: 12, icon: <CheckCircle2 className="text-green-500" />, to: "/tasks" },
          { label: "Active Tasks", value: 8, icon: <Clock className="text-yellow-500" />, to: "/tasks" },
          { label: "Bookings", value: 3, icon: <Zap className="text-blue-500" />, to: "/laundry" },
          { label: "Due Payments", value: "$40", icon: <Wallet className="text-purple-500" />, to: "/split" },
          { label: "Aura Points", value: 30, icon: <Crown className="text-amber-500" />, to: "/profile" },
        ].map((stat, i) => (
          <Link
            key={i}
            to={stat.to}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col items-center hover:shadow-lg hover:-translate-y-1 transition"
          >
            {stat.icon}
            <p className="text-xl font-bold mt-2">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </Link>
        ))}
      </section>

      {/* MAIN DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ROOMMATES */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" /> Roommates
          </h2>
          <div className="grid grid-cols-2 gap-4">
              {roommates.map((r) => (
              <Link key={r.name} to="/profile">
                <RoommateCard name={r.name} aura={r.aura} bio={r.bio} />
              </Link>
            ))}
          </div>
          <div className="mt-6 border-t border-gray-100 pt-3">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Crown className="text-amber-500" /> <b>{dormMaster.name}</b> is the current Dorm Master
            </p>
          </div>
        </div>

        {/* TASK CHART */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">📈 Task Performance</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={taskStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {taskStats.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-gray-600 text-sm mt-3">
            You’ve completed{" "}
            <span className="text-emerald-600 font-semibold">{rate}%</span> of your weekly tasks ✅
          </p>
        </div>

        {/* LAUNDRY */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            🧺 Laundry Schedule
          </h2>
          {laundryBookings.length > 0 ? (
            <div className="space-y-3">
              {laundryBookings.map((b) => (
                <div
                  key={b.id}
                  className="border border-gray-100 rounded-xl p-3 flex justify-between items-center hover:bg-emerald-50 transition"
                >
                  <div>
                    <p className="font-medium text-gray-700">{b.machine}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(b.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} →{" "}
                      {new Date(b.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">by {b.user}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No upcoming bookings.</p>
          )}
          <Link
            to="/laundry"
            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 text-sm font-medium shadow text-center block"
          >
            + Add New Booking
          </Link>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* AI ASSISTANT */}
        <div className="bg-gradient-to-br from-indigo-100 to-blue-100 rounded-3xl p-6 shadow-md">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Sparkles className="text-indigo-500" /> Smart Assistant
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Need help managing chores or balancing tasks? Let AI plan it for you!
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 px-4 text-sm font-semibold flex items-center gap-2 justify-center transition">
            <MessageCircle className="w-4 h-4" /> Ask AI Assistant
          </button>
        </div>

        {/* WEATHER */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-3xl p-6 shadow-md flex flex-col justify-center items-center text-center">
          <CloudSun className="text-yellow-500 w-10 h-10 mb-2" />
          <p className="text-3xl font-bold text-gray-800">74°F</p>
          <p className="text-sm text-gray-500">Sunny Day</p>
          <p className="text-xs mt-2 text-gray-400">Perfect for laundry ☀️</p>
        </div>

        {/* UPCOMING TASKS */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="text-blue-500" /> Upcoming Tasks
          </h3>
          <UpcomingTasksList />
        </div>
      </section>
    </div>
  );
};

export default Home;
