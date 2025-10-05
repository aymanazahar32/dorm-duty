import React, { useEffect, useMemo, useState } from "react";
import { Crown, Home as HomeIcon, Calendar, ChevronDown, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RoommateCard from "../components/RoommateCard";
import PieChart from "../components/PieChart";
import { useAuth } from "../context/AuthContext";
import { fetchLeaderboard, fetchTasks, updateTask } from "../utils/api";

const CHART_COLORS = ["#10B981", "#F59E0B", "#EF4444"];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

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
        userId: task.user_id,
        name: task.task_name,
        completed: task.completed,
        dueDate: task.due_date,
        assignedTo: leaderboardIndex.get(task.user_id)?.name || task.user_id || "Unassigned",
        auraAwarded: task.aura_awarded ?? 0,
      })),
    [tasks, leaderboardIndex]
  );

  const myPendingTasks = useMemo(() => {
    return normalizedTasks.filter(
      (task) => task.userId === user?.id && !task.completed
    ).sort((a, b) => {
      // Sort by due date (earliest first), null dates last
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }, [normalizedTasks, user?.id]);

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

  const handleTaskStatusChange = async (taskId, status) => {
    if (!user?.id) return;

    setUpdatingTaskId(taskId);
    setError(null);

    try {
      const updates = status === 'done' 
        ? { completed: true } 
        : { completed: false }; // 'In Progress' means not yet completed

      await updateTask({
        taskId,
        userId: user.id,
        updates,
      });

      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, completed: updates.completed } : task
        )
      );
    } catch (err) {
      setError(err.message || "Failed to update task status");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No due date';
    
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);
    
    const diffTime = taskDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays <= 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!user?.id || !user?.roomId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-white to-emerald-100 p-6">
        <div className="max-w-lg rounded-3xl border border-amber-200 bg-white/90 p-8 text-center shadow-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
            <HomeIcon className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Room Setup Required
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            You need to create or join a room before you can access your chore dashboard.
          </p>
          <button
            onClick={() => navigate("/room-setup")}
            className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mx-auto"
          >
            <HomeIcon className="w-5 h-5" />
            Set Up Room
          </button>
          <p className="mt-4 text-xs text-gray-500">
            Create a new room or join an existing one with a room code
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

      {/* Pending Tasks Section */}
      <section className="mb-8 rounded-3xl border border-blue-200 bg-white/80 p-6 shadow-md backdrop-blur">
        <div className="flex items-center gap-3 mb-5">
          <CheckCircle2 className="h-7 w-7 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">My Pending Tasks</h2>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading your tasks...</p>
        ) : myPendingTasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500">No pending tasks! You're all caught up 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myPendingTasks.map((task) => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
              
              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    isOverdue 
                      ? 'border-red-200 bg-red-50/50' 
                      : 'border-blue-100 bg-gradient-to-r from-blue-50/50 to-white hover:shadow-md'
                  }`}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{task.name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                          {formatDueDate(task.dueDate)}
                        </span>
                      </div>
                      {task.auraAwarded > 0 && (
                        <div className="flex items-center gap-1 text-sm text-purple-600">
                          <Crown className="h-4 w-4" />
                          <span>{task.auraAwarded} aura</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative ml-4">
                    <select
                      value=""
                      onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                      disabled={updatingTaskId === task.id}
                      className="appearance-none bg-white border-2 border-blue-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <option value="" disabled>
                        {updatingTaskId === task.id ? 'Updating...' : 'Update Status'}
                      </option>
                      <option value="progress">Mark as In Progress</option>
                      <option value="done">Mark as Done ✓</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

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
