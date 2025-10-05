import React, { useEffect, useMemo, useState } from "react";
import { useSplitManager } from "../hooks/useSplitManager";
import { ClipboardList, Plus, X } from "lucide-react";
import TaskCard from "../components/TaskCard";

const initialTasks = [
  {
    id: 1,
    title: "Clean Kitchen",
    assignedTo: "Md Salman Farse",
    dueDate: "2025-10-18",
    completed: false,
    notes: "Wipe counters and mop the floor.",
  },
  {
    id: 2,
    title: "Do the Dishes",
    assignedTo: "Ayman",
    dueDate: "2025-10-19",
    completed: false,
    notes: "Use dishwasher after dinner.",
  },
  {
    id: 3,
    title: "Take Out Trash",
    assignedTo: "Yeaz",
    dueDate: "2025-10-14",
    completed: true,
    notes: "Recycle separately.",
  },
  {
    id: 4,
    title: "Restock Pantry",
    assignedTo: "Anan",
    dueDate: "2025-10-16",
    completed: true,
    notes: "Buy milk and cereal.",
  },
];

const Tasks = () => {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("tasks") || "null");
      return Array.isArray(saved) ? saved : initialTasks;
    } catch {
      return initialTasks;
    }
  });
  const [newTask, setNewTask] = useState({
    title: "",
    assignedTo: "",
    dueDate: "",
    notes: "",
  });
  const [showNewTask, setShowNewTask] = useState(false);

  const toggleTask = (id) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );

  const deleteTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const snoozeTask = (id) =>
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              dueDate: new Date(
                new Date(t.dueDate).getTime() + 86400000
              ).toISOString().split("T")[0],
            }
          : t
      )
    );

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.assignedTo) return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now(), ...newTask, completed: false },
    ]);
    setNewTask({ title: "", assignedTo: "", dueDate: "", notes: "" });
    setShowNewTask(false);
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    return {
      total,
      completed,
      pending,
      rate: Math.round((completed / total) * 100) || 0,
    };
  }, [tasks]);

  const { state } = useSplitManager();
  const roommateOptions = useMemo(() => state.users.map((u) => u.name), [state.users]);
  const findAvatar = (name) => state.users.find((u) => u.name === name)?.avatar;
  const pendingTasks = tasks.filter((t) => !t.completed);
  const doneTasks = tasks.filter((t) => t.completed);

  useEffect(() => {
    try {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6 pb-24 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">HomeDuty Tasks</h1>
        </div>
        <button
          onClick={() => setShowNewTask(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" /> Add New Task
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-blue-100 rounded-xl text-center font-semibold text-blue-700">
          Total: {stats.total}
        </div>
        <div className="p-4 bg-emerald-100 rounded-xl text-center font-semibold text-emerald-700">
          Completed: {stats.completed}
        </div>
        <div className="p-4 bg-amber-100 rounded-xl text-center font-semibold text-amber-700">
          Progress: {stats.rate}%
        </div>
      </div>

      {/* Active Tasks */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Active Tasks
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {pendingTasks.map((t) => (
            <TaskCard
              key={t.id}
              {...t}
              assignedAvatar={findAvatar(t.assignedTo)}
              onToggle={() => toggleTask(t.id)}
              onSnooze={() => snoozeTask(t.id)}
              onDelete={() => deleteTask(t.id)}
            />
          ))}
        </div>
      </section>

      {/* Completed Tasks */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Completed Tasks
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {doneTasks.map((t) => (
            <TaskCard
              key={t.id}
              {...t}
              assignedAvatar={findAvatar(t.assignedTo)}
              onToggle={() => toggleTask(t.id)}
              onDelete={() => deleteTask(t.id)}
            />
          ))}
        </div>
      </section>

      {/* Fullscreen Add Task Form */}
      {showNewTask && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-md flex items-center justify-center z-50">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setShowNewTask(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Plus className="w-6 h-6 text-indigo-600" /> Add New Task
            </h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Assign To
                </label>
                <select
                  value={newTask.assignedTo}
                  onChange={(e) =>
                    setNewTask({ ...newTask, assignedTo: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-200"
                  required
                >
                  <option value="">Select roommate...</option>
                  {roommateOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Task title..."
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-200"
              />
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) =>
                  setNewTask({ ...newTask, dueDate: e.target.value })
                }
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-200"
              />
              <textarea
                placeholder="Notes (optional)"
                value={newTask.notes}
                onChange={(e) =>
                  setNewTask({ ...newTask, notes: e.target.value })
                }
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-200"
                rows={3}
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                Add Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
