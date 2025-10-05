import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  Download,
  Filter,
  FileText,
  PlusCircle,
  Search,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import TaskCard from "../components/TaskCard";

const roommateOptions = ["Salman", "Ayman", "Yeaz", "Anan"];

const initialTasks = [
  {
    id: 1,
    title: "Clean Kitchen",
    assignedTo: "Salman",
    dueDate: "2025-10-18",
    completed: false,
    priority: "high",
    category: "Chores",
    notes: "Remember to wipe the counters and mop the floor.",
  },
  {
    id: 2,
    title: "Take Out Trash",
    assignedTo: "Ayman",
    dueDate: "2025-10-17",
    completed: true,
    priority: "medium",
    category: "Chores",
  },
  {
    id: 3,
    title: "Restock Pantry",
    assignedTo: "Yeaz",
    dueDate: "2025-10-20",
    completed: false,
    priority: "medium",
    category: "Groceries",
    notes: "Grab milk, cereal, and dish soap.",
  },
];

const priorityOrder = { high: 0, medium: 1, low: 2 };

const formatToISODate = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Tasks = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [form, setForm] = useState({
    title: "",
    assignedTo: "",
    dueDate: "",
    notes: "",
    priority: "medium",
    category: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("any");
  const [sortOption, setSortOption] = useState("dueDate");

  const [scheduleForm, setScheduleForm] = useState({ roommate: "", notes: "" });
  const [scheduleFile, setScheduleFile] = useState(null);
  const [scheduleUploads, setScheduleUploads] = useState([]);
  const [scheduleError, setScheduleError] = useState("");
  const scheduleFileInputRef = useRef(null);
  const uploadedUrlsRef = useRef(new Set());

  useEffect(
    () => () => {
      uploadedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      uploadedUrlsRef.current.clear();
    },
    []
  );

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const pending = total - completed;
    const now = new Date();
    const overdue = tasks.filter(
      (task) => !task.completed && task.dueDate && new Date(task.dueDate) < now
    ).length;
    const highPriority = tasks.filter(
      (task) => !task.completed && task.priority === "high"
    ).length;

    return {
      total,
      completed,
      pending,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
      overdue,
      highPriority,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    const filtered = tasks.filter((task) => {
      if (filter === "completed" && !task.completed) return false;
      if (filter === "pending" && task.completed) return false;
      if (priorityFilter !== "any" && task.priority !== priorityFilter) return false;

      if (!normalizedQuery) return true;
      const haystack = `${task.title} ${task.assignedTo} ${task.category ?? ""} ${task.notes ?? ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });

    return filtered.sort((a, b) => {
      if (sortOption === "priority") {
        const aRank = priorityOrder[a.priority] ?? 99;
        const bRank = priorityOrder[b.priority] ?? 99;
        return aRank - bRank;
      }

      if (sortOption === "assignee") {
        return a.assignedTo.localeCompare(b.assignedTo);
      }

      // Default: due date
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });
  }, [tasks, filter, priorityFilter, searchTerm, sortOption]);

  const hasResults = filteredTasks.length > 0;

  const toggleTask = (id) =>
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((task) => !task.completed));
  };

  const cyclePriority = (currentPriority) => {
    const order = ["high", "medium", "low"];
    const index = order.indexOf(currentPriority);
    const nextIndex = (index + 1) % order.length;
    return order[nextIndex];
  };

  const handleChangePriority = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, priority: cyclePriority(task.priority ?? "medium") }
          : task
      )
    );
  };

  const handleSnooze = (id) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const baseDate = task.dueDate ? new Date(task.dueDate) : new Date();
        const next = new Date(baseDate);
        next.setDate(baseDate.getDate() + 1);
        return { ...task, dueDate: formatToISODate(next) };
      })
    );
  };

  const handleDeleteTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.assignedTo.trim()) return;

    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: form.title.trim(),
        assignedTo: form.assignedTo.trim(),
        dueDate: form.dueDate || undefined,
        completed: false,
        notes: form.notes.trim() || undefined,
        priority: form.priority || "medium",
        category: form.category.trim() || undefined,
      },
    ]);

    setForm({
      title: "",
      assignedTo: "",
      dueDate: "",
      notes: "",
      priority: "medium",
      category: "",
    });
  };

  const handleScheduleFormChange = (event) => {
    const { name, value } = event.target;
    setScheduleForm((prev) => ({ ...prev, [name]: value }));
    setScheduleError("");
  };

  const handleScheduleFile = (event) => {
    const file = event.target.files?.[0] ?? null;
    setScheduleFile(file);
    setScheduleError("");
  };

  const handleScheduleSubmit = (event) => {
    event.preventDefault();
    if (!scheduleForm.roommate) {
      setScheduleError("Please choose a roommate to associate the schedule with.");
      return;
    }
    if (!scheduleFile) {
      setScheduleError("Upload a schedule file to continue.");
      return;
    }

    const url = URL.createObjectURL(scheduleFile);
    uploadedUrlsRef.current.add(url);

    setScheduleUploads((prev) => [
      ...prev,
      {
        id: Date.now(),
        roommate: scheduleForm.roommate,
        notes: scheduleForm.notes.trim() || undefined,
        fileName: scheduleFile.name,
        fileType: scheduleFile.type,
        uploadedAt: new Date().toISOString(),
        url,
      },
    ]);

    setScheduleForm({ roommate: "", notes: "" });
    setScheduleFile(null);
    if (scheduleFileInputRef.current) {
      scheduleFileInputRef.current.value = "";
    }
    setScheduleError("");
  };

  const handleRemoveSchedule = (id) => {
    setScheduleUploads((prev) => {
      const target = prev.find((upload) => upload.id === id);
      if (target?.url) {
        URL.revokeObjectURL(target.url);
        uploadedUrlsRef.current.delete(target.url);
      }
      return prev.filter((upload) => upload.id !== id);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-emerald-100 p-6 pb-32 flex flex-col gap-8">
      <header className="flex flex-col gap-6 rounded-3xl bg-white/80 backdrop-blur-md border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-blue-600">
            <ClipboardList className="w-8 h-8" />
            <h1 className="text-3xl font-extrabold text-gray-900">Task Manager</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CalendarRange className="h-4 w-4" /> Stay aligned with chores and schedules.
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          <span className="rounded-full bg-blue-50 px-4 py-1 font-semibold text-blue-600">
            Total: {stats.total}
          </span>
          <span className="rounded-full bg-emerald-50 px-4 py-1 font-semibold text-emerald-600">
            Completed: {stats.completed}
          </span>
          <span className="rounded-full bg-amber-50 px-4 py-1 font-semibold text-amber-600">
            Pending: {stats.pending}
          </span>
          <span className="rounded-full bg-purple-50 px-4 py-1 font-semibold text-purple-600">
            Progress: {stats.completionRate}%
          </span>
          <span className="rounded-full bg-red-50 px-4 py-1 font-semibold text-red-600">
            Overdue: {stats.overdue}
          </span>
          <span className="rounded-full bg-rose-50 px-4 py-1 font-semibold text-rose-600">
            High priority: {stats.highPriority}
          </span>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white/70 p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-200">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by task, person, or note..."
                className="h-8 w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "All" },
                { id: "pending", label: "Pending" },
                { id: "completed", label: "Completed" },
              ].map((option) => {
                const active = filter === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFilter(option.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                      active
                        ? "bg-blue-600 text-white shadow"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <Filter className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Toggle a task to mark it complete.
              </span>
              <span className="flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-blue-500" /> Filters sort upcoming due dates first.
              </span>
              {tasks.some((task) => task.completed) && (
                <button
                  type="button"
                  onClick={clearCompleted}
                  className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 font-semibold text-red-600 transition hover:bg-red-100"
                >
                  <XCircle className="h-3.5 w-3.5" /> Clear completed
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="any">Priority: Any</option>
                <option value="high">Priority: High</option>
                <option value="medium">Priority: Medium</option>
                <option value="low">Priority: Low</option>
              </select>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm">
                <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                <select
                  value={sortOption}
                  onChange={(event) => setSortOption(event.target.value)}
                  className="bg-transparent focus:outline-none"
                >
                  <option value="dueDate">Sort: Due date</option>
                  <option value="priority">Sort: Priority</option>
                  <option value="assignee">Sort: Assignee</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        {hasResults ? (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              title={task.title}
              assignedTo={task.assignedTo}
              dueDate={task.dueDate}
              completed={task.completed}
              notes={task.notes}
              priority={task.priority}
              category={task.category}
              onToggle={() => toggleTask(task.id)}
              onSnooze={() => handleSnooze(task.id)}
              onChangePriority={() => handleChangePriority(task.id)}
              onDelete={() => handleDeleteTask(task.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 bg-white/70 px-6 py-16 text-center text-gray-500">
            <Search className="h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium">No tasks match your filters yet.</p>
            <p className="text-xs text-gray-400">
              Try adjusting the filters or create a new assignment below.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-lg backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-4">
            <header className="flex items-center gap-3 text-blue-600">
              <UploadCloud className="h-6 w-6" />
              <h2 className="text-2xl font-semibold text-gray-900">Roommate schedules</h2>
            </header>
            <p className="text-sm text-gray-500">
              Upload shared schedules to coordinate deep cleans, study sessions, and chore swaps. Files stay local in this browser session.
            </p>

            <div className="space-y-3">
              {scheduleUploads.length ? (
                scheduleUploads.map((upload) => (
                  <article
                    key={upload.id}
                    className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 font-semibold text-gray-800">
                        <FileText className="h-4 w-4 text-indigo-500" />
                        {upload.fileName}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-600">
                          {upload.roommate}
                        </span>
                        <span>{new Date(upload.uploadedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    {upload.notes && (
                      <p className="text-gray-600">
                        <strong className="font-semibold text-gray-700">Notes:</strong> {upload.notes}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <a
                        href={upload.url}
                        download={upload.fileName}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-600 transition hover:bg-emerald-100"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveSchedule(upload.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-gray-200 bg-white/70 px-4 py-6 text-sm text-gray-500">
                  No schedules uploaded yet. Share weekly availability to avoid laundry or cleaning clashes.
                </p>
              )}
            </div>
          </div>

          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-gray-50/70 p-5">
            <header className="mb-4 flex items-center gap-2 text-gray-800">
              <PlusCircle className="h-5 w-5 text-indigo-500" />
              <h3 className="text-lg font-semibold">Upload a schedule</h3>
            </header>
            <form className="space-y-4" onSubmit={handleScheduleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Roommate
                </label>
                <select
                  name="roommate"
                  value={scheduleForm.roommate}
                  onChange={handleScheduleFormChange}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select roommate...</option>
                  {roommateOptions.map((roomie) => (
                    <option key={roomie} value={roomie}>
                      {roomie}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Schedule file
                </label>
                <input
                  ref={scheduleFileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  onChange={handleScheduleFile}
                  className="rounded-xl border border-dashed border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <span className="text-xs text-gray-400">
                  Accepted formats: PDF, images, docs, spreadsheets.
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Notes <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  name="notes"
                  value={scheduleForm.notes}
                  onChange={handleScheduleFormChange}
                  placeholder="Add availability highlights or reminders"
                  rows={3}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {scheduleError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                  {scheduleError}
                </p>
              )}

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
              >
                <UploadCloud className="h-5 w-5" /> Save schedule
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="mt-auto">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white/90 backdrop-blur-md border border-gray-100 shadow-lg p-6 space-y-5"
        >
          <div className="flex items-center gap-3 text-gray-800">
            <PlusCircle className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-semibold">Add a new task</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="task-title" className="text-sm font-medium text-gray-600">
                Task title
              </label>
              <input
                id="task-title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Deep clean living room"
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="task-assigned" className="text-sm font-medium text-gray-600">
                Assign to
              </label>
              <select
                id="task-assigned"
                name="assignedTo"
                value={form.assignedTo}
                onChange={handleChange}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              >
                <option value="">Select roommate...</option>
                {roommateOptions.map((roomie) => (
                  <option key={roomie} value={roomie}>
                    {roomie}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="task-due" className="text-sm font-medium text-gray-600">
                Due date
              </label>
              <input
                id="task-due"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="task-priority" className="text-sm font-medium text-gray-600">
                Priority
              </label>
              <select
                id="task-priority"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="task-category" className="text-sm font-medium text-gray-600">
                Category <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="task-category"
                name="category"
                type="text"
                value={form.category}
                onChange={handleChange}
                placeholder="Cleaning, Groceries, Maintenance..."
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label htmlFor="task-notes" className="text-sm font-medium text-gray-600">
                Notes <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                id="task-notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Add quick reminders or details"
                rows={3}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
          >
            <PlusCircle className="w-5 h-5" /> Create Task
          </button>
        </form>
      </section>
    </div>
  );
};

export default Tasks;
