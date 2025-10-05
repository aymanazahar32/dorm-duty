"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Calendar, Clock, Plus, Sparkles, Users } from "lucide-react";
import scheduleService, { Schedule } from "../../../services/scheduleService";
import geminiService from "../../../services/geminiService";
import ScheduleForm from "../../../components/ScheduleForm";
import ScheduleCard from "../../../components/ScheduleCard";
import TaskSuggestions from "../../../components/TaskSuggestions";
import { useAuth } from "../../../context/AuthContext";

const AVAILABLE_TASKS = [
  { id: "cooking", name: "Cooking", duration: 60 },
  { id: "cleaning", name: "Cleaning", duration: 45 },
  { id: "laundry", name: "Laundry", duration: 90 },
  { id: "dishes", name: "Dishes", duration: 20 },
  { id: "trash", name: "Trash", duration: 10 },
  { id: "bathroom", name: "Bathroom", duration: 30 },
] as const;

type Suggestion = {
  task: string;
  assignedTo: string;
  day: string;
  time: string;
  confidence?: number;
  reasoning?: string;
};

type Roommate = {
  id: string;
  name: string | null;
  email: string | null;
  aura_points?: number | null;
};

const dayToIsoDate = (day: string, time?: string) => {
  if (!day) return null;

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const today = new Date();
  const currentDayIndex = today.getDay();
  const targetDayIndex = daysOfWeek.findIndex((entry) => entry.toLowerCase() === day.toLowerCase());

  if (targetDayIndex === -1) {
    return null;
  }

  let daysUntilTarget = targetDayIndex - currentDayIndex;

  if (daysUntilTarget < 0) {
    daysUntilTarget += 7;
  }

  const dueDate = new Date(today);
  dueDate.setDate(today.getDate() + daysUntilTarget);

  if (time) {
    const [hours, minutes] = time.split(":");
    const parsedHours = Number.parseInt(hours ?? "0", 10);
    const parsedMinutes = Number.parseInt(minutes ?? "0", 10);
    dueDate.setHours(parsedHours, parsedMinutes, 0, 0);
  }

  return dueDate.toISOString().split("T")[0] ?? null;
};

const SchedulePage = () => {
  const { user, roomId } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>(["cooking", "cleaning", "laundry"]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [isAddingTasks, setIsAddingTasks] = useState(false);

  const loadSchedules = useCallback(() => {
    setSchedules(scheduleService.getSchedules());
  }, []);

  const loadSuggestions = useCallback(() => {
    const stored = scheduleService.getSuggestions<Suggestion[]>();
    if (stored && Array.isArray(stored.suggestions)) {
      setSuggestions(stored.suggestions);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
    loadSuggestions();

    const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (envKey) {
      setApiKey(envKey);
      geminiService.setApiKey(envKey);
    } else {
      setShowApiKeyInput(true);
    }
  }, [loadSchedules, loadSuggestions]);

  useEffect(() => {
    let ignore = false;

    const fetchRoommates = async () => {
      if (!user?.id || !roomId) {
        if (!ignore) {
          setRoommates([]);
        }
        return;
      }

      try {
        const params = new URLSearchParams({
          userId: user.id,
          roomId,
          limit: "50",
        });

        const response = await fetch(`/api/leaderboard?${params.toString()}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load roommates");
        }

        if (!ignore) {
          setRoommates((payload?.data as Roommate[]) ?? []);
        }
      } catch (err) {
        console.error("Failed to load roommates", err);
        if (!ignore) {
          setRoommates([]);
        }
      }
    };

    fetchRoommates();

    return () => {
      ignore = true;
    };
  }, [roomId, user?.id]);

  const handleAddSchedule = (scheduleData: Omit<Schedule, "id" | "createdAt">) => {
    const validation = scheduleService.validateSchedule(scheduleData);

    if (!validation.isValid) {
      setError(validation.errors.join(", "));
      return;
    }

    scheduleService.addSchedule(scheduleData);
    loadSchedules();
    setShowForm(false);
    setError(null);
  };

  const handleDeleteSchedule = (id: string) => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      scheduleService.deleteSchedule(id);
      loadSchedules();
    }
  };

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleOptimize = async () => {
    if (schedules.length === 0) {
      setError("Please add at least one schedule before optimizing");
      return;
    }

    if (selectedTasks.length === 0) {
      setError("Please select at least one task to assign");
      return;
    }

    if (!apiKey) {
      setError("Please enter your Gemini API key");
      setShowApiKeyInput(true);
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      geminiService.setApiKey(apiKey);

      const taskNames = selectedTasks
        .map((taskId) => AVAILABLE_TASKS.find((task) => task.id === taskId)?.name)
        .filter((name): name is typeof AVAILABLE_TASKS[number]["name"] => Boolean(name));

      const aiSuggestions = (await geminiService.optimizeSchedules(schedules, taskNames)) as Suggestion[];

      setSuggestions(aiSuggestions);
      scheduleService.saveSuggestions(aiSuggestions);

      setTimeout(() => {
        document.getElementById("suggestions-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Optimization error", err);
      setError(err instanceof Error ? err.message : "Failed to optimize schedules. Please try again.");

      const fallback = geminiService.generateFallbackSuggestions(
        schedules,
        selectedTasks
          .map((taskId) => AVAILABLE_TASKS.find((task) => task.id === taskId)?.name)
          .filter((name): name is typeof AVAILABLE_TASKS[number]["name"] => Boolean(name))
      ) as Suggestion[];
      setSuggestions(fallback);
    } finally {
      setIsOptimizing(false);
    }
  };

  const resolveAssigneeId = useCallback(
    (assignedTo: string) => {
      const target = assignedTo.trim().toLowerCase();
      if (!target) return null;

      const match = roommates.find((roommate) => {
        const nameMatch = roommate.name?.toLowerCase() === target;
        const emailMatch = roommate.email?.toLowerCase() === target;
        return nameMatch || emailMatch;
      });

      return match?.id ?? null;
    },
    [roommates]
  );

  const handleAddAllTasks = useCallback(async () => {
    if (!user?.id || !roomId) {
      setError("You must be signed in and assigned to a room to add tasks");
      return;
    }

    if (suggestions.length === 0) {
      setError("No suggestions to add");
      return;
    }

    setIsAddingTasks(true);
    setError(null);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const suggestion of suggestions) {
        try {
          const assignedUserId = resolveAssigneeId(suggestion.assignedTo) ?? user.id;
          const dueDate = dayToIsoDate(suggestion.day, suggestion.time);

          const response = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              roomId,
              taskName: suggestion.task,
              dueDate,
              auraAwarded: suggestion.confidence ? Math.round(suggestion.confidence * 100) : 0,
              assignedUserId,
            }),
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload?.error ?? "Unknown error");
          }

          successCount += 1;
        } catch (err) {
          console.error("Failed to create task from suggestion", err);
          failCount += 1;
        }
      }

      if (successCount > 0) {
        window.alert(
          `Successfully added ${successCount} task${successCount > 1 ? "s" : ""}!${
            failCount > 0 ? ` (${failCount} failed)` : ""
          }`
        );
        setSuggestions([]);
        scheduleService.saveSuggestions([]);
      } else {
        setError("Failed to add any tasks. Please try again.");
      }
    } catch (err) {
      console.error("Error adding tasks", err);
      setError(err instanceof Error ? err.message : "Failed to add tasks");
    } finally {
      setIsAddingTasks(false);
    }
  }, [resolveAssigneeId, roomId, suggestions, user?.id]);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      geminiService.setApiKey(apiKey);
      setShowApiKeyInput(false);
      setError(null);
    }
  };

  const stats = useMemo(() => scheduleService.getStatistics(), []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">AI Schedule Optimizer</h1>
          <p className="text-gray-600">Upload your schedules and let AI find the best times for chores</p>
        </div>

        {showApiKeyInput ? (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 flex-shrink-0 text-yellow-600" size={20} />
              <div className="flex-1">
                <h3 className="mb-2 font-semibold text-yellow-900">Gemini API Key Required</h3>
                <p className="mb-3 text-sm text-yellow-800">
                  Get a free API key from Google AI Studio and store it in your environment or paste it below.
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder="Enter your API key..."
                    className="flex-1 rounded-lg border border-yellow-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-yellow-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 flex-shrink-0 text-red-600" size={20} />
              <div>
                <h3 className="font-semibold text-red-900">Something went wrong</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Users</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
              </div>
              <Users className="text-blue-500" size={32} />
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Time Slots</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalTimeSlots}</p>
              </div>
              <Clock className="text-green-500" size={32} />
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Free Slots</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalFreeSlots}</p>
              </div>
              <Calendar className="text-purple-500" size={32} />
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suggestions</p>
                <p className="text-3xl font-bold text-orange-600">{suggestions.length}</p>
              </div>
              <Sparkles className="text-orange-500" size={32} />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-4 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={20} /> Add Your Schedule
          </button>
        </div>

        {showForm ? (
          <ScheduleForm onSubmit={handleAddSchedule} onCancel={() => setShowForm(false)} />
        ) : null}

        {schedules.length > 0 ? (
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Uploaded Schedules</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {schedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onDelete={() => handleDeleteSchedule(schedule.id)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {schedules.length > 0 ? (
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Select Tasks to Assign</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {AVAILABLE_TASKS.map((task) => {
                const isActive = selectedTasks.includes(task.id);
                const glyph = task.name.charAt(0).toUpperCase();
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleTaskToggle(task.id)}
                    className={`rounded-lg border-2 p-4 text-left transition ${
                      isActive
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700" aria-hidden>
                      {glyph}
                    </div>
                    <div className="text-sm font-semibold text-gray-800">{task.name}</div>
                    <div className="text-xs text-gray-500">{task.duration} min</div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleOptimize}
              disabled={isOptimizing || selectedTasks.length === 0}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-lg py-4 text-sm font-semibold text-white transition ${
                isOptimizing || selectedTasks.length === 0
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
              }`}
            >
              {isOptimizing ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Optimizing with AI...
                </>
              ) : (
                <>
                  <Sparkles size={20} /> Optimize with AI
                </>
              )}
            </button>
          </div>
        ) : null}

        {suggestions.length > 0 ? (
          <div id="suggestions-section">
            <TaskSuggestions
              suggestions={suggestions}
              onAddAll={handleAddAllTasks}
              isAdding={isAddingTasks}
            />
          </div>
        ) : null}

        {schedules.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="mb-2 text-xl font-semibold text-gray-700">No schedules yet</h3>
            <p className="text-gray-500">Add your schedule to start generating AI task assignments.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SchedulePage;
