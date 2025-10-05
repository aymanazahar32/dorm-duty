import React, { useEffect, useMemo, useState } from "react";
import { Crown } from "lucide-react";
import RoommateCard from "../components/RoommateCard";
import PieChart from "../components/PieChart";
import { useAuth } from "../context/AuthContext";
import { fetchLeaderboard, fetchTasks } from "../utils/api";

const CHART_COLORS = ["#10B981", "#F59E0B", "#EF4444"];

const Home = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id || !user?.roomId) {
      setTasks([]);
      setLeaders([]);
      setLoading(false);
      return;
    }

    let ignore = false;
    const controller = new AbortController();

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const [taskList, leaderboardResponse] = await Promise.all([
          fetchTasks({ userId: user.id, roomId: user.roomId, signal: controller.signal }),
          fetchLeaderboard({ userId: user.id, roomId: user.roomId, limit: 10, signal: controller.signal }),
        ]);

        if (ignore) return;

        setTasks(taskList ?? []);
        setLeaders(leaderboardResponse.data ?? []);
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Unable to load dashboard data");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [user?.id, user?.roomId]);

  const leaderboardIndex = useMemo(() => {
    const map = new Map();
    leaders.forEach((entry) => {
      if (entry?.id) {
        map.set(entry.id, entry);
      }
    });
    return map;
  }, [leaders]);

  const normalizedTasks = useMemo(
    () =>
      tasks.map((task) => ({
        id: task.id,
        name: task.task_name,
        completed: task.completed,
        dueDate: task.due_date,
        assignedTo: leaderboardIndex.get(task.user_id)?.name || task.user_id || "Unassigned",
        auraAwarded: task.aura_awarded ?? 0,
      })),
    [tasks, leaderboardIndex]
  );

  const stats = useMemo(() => {
    const total = normalizedTasks.length;
    const completed = normalizedTasks.filter((task) => task.completed).length;
    const pending = total - completed;

    const overdue = normalizedTasks.filter((task) => {
      if (!task.dueDate || task.completed) return false;
      const due = new Date(task.dueDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return due < now;
    }).length;

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
    };
  }, [normalizedTasks]);

  const chartData = useMemo(
    () => [
      { name: "Completed", value: stats.completed },
      { name: "Pending", value: Math.max(stats.pending - stats.overdue, 0) },
      { name: "Overdue", value: stats.overdue },
    ],
    [stats]
  );

  const dormMaster = leaders[0];

  if (!user?.id || !user?.roomId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-white to-emerald-100 p-6">
        <div className="max-w-lg rounded-3xl border border-amber-200 bg-white/90 p-8 text-center shadow-lg">
          <h1 className="text-2xl font-semibold text-gray-900">
            Room context required
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            Add your Supabase user ID and room ID on the login screen so we can
            pull real chore data from the backend.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-emerald-100 p-6 pb-28">
      <header className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-blue-600">
            Home Duty
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, <span className="font-semibold text-emerald-600">{user?.name}</span>
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white/80 px-4 py-2 text-sm text-gray-600 shadow-sm">
          Weekly completion rate: <span className="font-semibold text-emerald-600">{stats.completionRate}%</span>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <section className="rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-md backdrop-blur">
          <h2 className="mb-5 text-xl font-semibold text-gray-800">👥 Roommates</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Loading leaderboard…</p>
          ) : leaders.length ? (
            <div className="grid grid-cols-2 gap-4">
              {leaders.slice(0, 6).map((entry) => (
                <RoommateCard
                  key={entry.id}
                  name={entry.name || entry.email || "Roommate"}
                  aura={entry.aura_points ?? 0}
                  role={entry.rank === 1 ? "Dorm Master" : undefined}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No roommates found yet. Add users to your Supabase room.
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-md backdrop-blur">
          <PieChart data={chartData} colors={CHART_COLORS} title="Weekly Tasks Overview" />
        </section>

        <section className="flex flex-col items-center justify-center rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-100 to-emerald-50 p-6 text-center shadow-inner">
          {dormMaster ? (
            <>
              <Crown className="mb-3 h-10 w-10 text-yellow-500" />
              <h2 className="text-lg font-bold text-gray-800">Dorm Master 👑</h2>
              <p className="text-3xl font-extrabold text-emerald-700">{dormMaster.name || dormMaster.email}</p>
              <p className="mt-1 text-sm text-gray-600">
                Aura: {dormMaster.aura_points ?? 0} points (rank {dormMaster.rank})
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              Complete chores to climb the leaderboard and unlock the Dorm Master
              crown.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
