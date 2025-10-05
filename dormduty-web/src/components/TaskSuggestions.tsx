"use client";

import { Calendar, Clock, Loader2, Sparkles, TrendingUp, User } from "lucide-react";

type Suggestion = {
  task: string;
  assignedTo: string;
  day: string;
  time: string;
  confidence?: number;
  reasoning?: string;
};

type Props = {
  suggestions: Suggestion[];
  onAddAll?: () => void;
  isAdding?: boolean;
};

type ConfidenceBadge = {
  label: string;
  className: string;
};

const getConfidenceBadge = (confidence = 0): ConfidenceBadge => {
  if (confidence >= 0.8) {
    return {
      label: "High",
      className: "bg-green-100 text-green-800 border-green-300",
    };
  }
  if (confidence >= 0.6) {
    return {
      label: "Medium",
      className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    };
  }
  return {
    label: "Low",
    className: "bg-red-100 text-red-800 border-red-300",
  };
};

const escapeCsvValue = (value: string) => `"${value.replace(/"/g, '""')}"`;

const exportSuggestionsToCsv = (suggestions: Suggestion[]) => {
  if (!suggestions.length) return;

  const headers = ["Task", "Assigned To", "Day", "Time", "Confidence", "Reasoning"];
  const rows = suggestions.map((suggestion) => [
    suggestion.task,
    suggestion.assignedTo,
    suggestion.day,
    suggestion.time,
    suggestion.confidence !== undefined ? Math.round(suggestion.confidence * 100).toString() : "",
    suggestion.reasoning ?? "",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dormduty-task-suggestions-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const TaskSuggestions = ({ suggestions, onAddAll, isAdding = false }: Props) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const usersInvolved = new Set(suggestions.map((s) => s.assignedTo)).size;
  const avgConfidence =
    suggestions.reduce((sum, s) => sum + (s.confidence ?? 0), 0) / (suggestions.length || 1);

  const handleAddAll = () => {
    if (onAddAll) {
      onAddAll();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="text-purple-500" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI-Powered Task Assignments</h2>
          <p className="text-gray-600">Based on everyone&apos;s availability and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4 md:grid-cols-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{suggestions.length}</div>
          <div className="text-sm text-gray-600">Tasks Assigned</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{usersInvolved}</div>
          <div className="text-sm text-gray-600">Users Involved</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{Math.round(avgConfidence * 100)}%</div>
          <div className="text-sm text-gray-600">Avg Confidence</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {suggestions.map((suggestion) => {
          const badge = getConfidenceBadge(suggestion.confidence ?? 0);
          const glyph = suggestion.task.charAt(0).toUpperCase();

          return (
            <div
              key={`${suggestion.task}-${suggestion.assignedTo}-${suggestion.day}-${suggestion.time}`}
              className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6 shadow-sm transition hover:shadow-lg"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-lg font-semibold text-purple-700" aria-hidden>
                    {glyph}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 capitalize">{suggestion.task}</h3>
                    <p className="text-sm text-gray-600">Task Assignment</p>
                  </div>
                </div>
                <div className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide border-2 ${badge.className}`}>
                  {Math.round((suggestion.confidence ?? 0) * 100)}% {badge.label}
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2 rounded-lg bg-white p-3">
                  <User className="text-blue-500" size={20} />
                  <div>
                    <div className="text-xs text-gray-500">Assigned To</div>
                    <div className="font-semibold text-gray-900">{suggestion.assignedTo}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white p-3">
                  <Calendar className="text-green-500" size={20} />
                  <div>
                    <div className="text-xs text-gray-500">Day</div>
                    <div className="font-semibold text-gray-900">{suggestion.day}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white p-3">
                  <Clock className="text-amber-500" size={20} />
                  <div>
                    <div className="text-xs text-gray-500">Start Time</div>
                    <div className="font-semibold text-gray-900">{suggestion.time}</div>
                  </div>
                </div>
              </div>

              {suggestion.reasoning ? (
                <div className="rounded-lg bg-white p-3 text-sm text-gray-600">
                  <TrendingUp className="mr-2 inline text-purple-500" size={18} />
                  {suggestion.reasoning}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        {onAddAll ? (
          <button
            type="button"
            onClick={handleAddAll}
            disabled={isAdding}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Adding Tasks...
              </>
            ) : (
              "Add All to Tasks"
            )}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => exportSuggestionsToCsv(suggestions)}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
        >
          Export as CSV
        </button>
      </div>
    </div>
  );
};

export default TaskSuggestions;
