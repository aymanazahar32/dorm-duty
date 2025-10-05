/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";
import React, { useMemo } from "react";
import {
  AlarmClock,
  AlertTriangle,
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  Circle,
  Trash2,
  User,
} from "lucide-react";

const noop = () => {};

const formatDueLabel = (dueDate) => {
  if (!dueDate) {
    return { label: "No due date", type: "none" };
  }

  const isIsoDate = /\d{4}-\d{2}-\d{2}/.test(dueDate);
  if (!isIsoDate) {
    return { label: `Due: ${dueDate}`, type: "text" };
  }

  const due = new Date(`${dueDate}T23:59:59`);
  if (Number.isNaN(due.getTime())) {
    return { label: `Due: ${dueDate}`, type: "text" };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`,
      type: "overdue",
    };
  }

  if (diffDays === 0) {
    return { label: "Due today", type: "today" };
  }

  if (diffDays === 1) {
    return { label: "Due tomorrow", type: "soon" };
  }

  return { label: `Due in ${diffDays} days`, type: "date" };
};

const statusColor = {
  completed: "text-emerald-600 bg-emerald-100/80 border border-emerald-200",
  overdue: "text-red-600 bg-red-100/80 border border-red-200",
  soon: "text-amber-600 bg-amber-100/80 border border-amber-200",
  today: "text-amber-600 bg-amber-100/80 border border-amber-200",
  date: "text-blue-600 bg-blue-100/80 border border-blue-200",
  text: "text-blue-600 bg-blue-100/80 border border-blue-200",
  none: "text-gray-500 bg-gray-100/80 border border-gray-200",
};

const accentColor = {
  completed: "border-l-4 border-emerald-300",
  overdue: "border-l-4 border-red-300",
  soon: "border-l-4 border-amber-300",
  today: "border-l-4 border-amber-300",
  date: "border-l-4 border-blue-300",
  text: "border-l-4 border-blue-300",
  none: "border-l-4 border-gray-200",
};

const priorityStyles = {
  high: "bg-red-50 text-red-600 border border-red-200",
  medium: "bg-amber-50 text-amber-600 border border-amber-200",
  low: "bg-emerald-50 text-emerald-600 border border-emerald-200",
};

const priorityLabel = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
};

const TaskCard = ({
  title,
  assignedTo,
  dueDate,
  completed = false,
  priority = "medium",
  notes,
  onToggle = noop,
  onSnooze = noop,
  onChangePriority = noop,
  onDelete = noop,
}) => {
  const dueMeta = useMemo(() => formatDueLabel(dueDate), [dueDate]);
  const statusVariant = completed ? "completed" : dueMeta.type;

  const statusPill = completed ? (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium transition ${
        statusColor[statusVariant] ?? statusColor.none
      }`}
      aria-pressed="true"
    >
      <CheckCircle2 className="w-4 h-4" /> Completed
    </button>
  ) : (
    <span
      className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
        statusColor[statusVariant] ?? statusColor.none
      }`}
    >
      {dueMeta.type === "overdue" ? (
        <AlertTriangle className="w-4 h-4" />
      ) : (
        <CalendarDays className="w-4 h-4" />
      )}
      {dueMeta.label}
    </span>
  );

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border ${
        completed ? "border-emerald-200" : "border-gray-100"
      } ${accentColor[statusVariant] ?? accentColor.none} bg-white/90 backdrop-blur transition shadow-lg/40 hover:-translate-y-0.5 hover:shadow-xl focus-within:ring-2 focus-within:ring-blue-200`}
      tabIndex={0}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-200 via-emerald-200 to-purple-200" />

      <div className="p-6 flex flex-col gap-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p
              className={`text-lg font-semibold ${
                completed ? "text-emerald-700 line-through" : "text-gray-900"
              }`}
            >
              {title}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-600">
                <User className="w-4 h-4" /> {assignedTo || "Unassigned"}
              </span>
              {!completed && (
                <span className="text-xs uppercase tracking-wide text-gray-400">
                  Stay on track
                </span>
              )}
            </div>
          </div>

          {statusPill}
        </header>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${
              priorityStyles[priority] || priorityStyles.medium
            }`}
          >
            <ArrowUpDown className="h-3.5 w-3.5" /> {priorityLabel[priority] || "Priority"}
          </span>
          {dueDate && (
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
              <CalendarDays className="h-3.5 w-3.5" /> Due {dueDate}
            </span>
          )}
        </div>

        {notes && (
          <p className="rounded-xl bg-slate-50/80 px-4 py-3 text-sm text-gray-700 border border-slate-100">
            {notes}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          {!completed && (
            <button
              type="button"
              onClick={onSnooze}
              className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-600 transition hover:bg-amber-100"
            >
              <AlarmClock className="h-3.5 w-3.5" /> Snooze +1 day
            </button>
          )}
          <button
            type="button"
            onClick={onChangePriority}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-600 transition hover:bg-gray-100"
          >
            <ArrowUpDown className="h-3.5 w-3.5" /> Cycle priority
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 font-semibold text-red-600 transition hover:bg-red-100"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-3">
        <button
          type="button"
          onClick={onToggle}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            completed
              ? "bg-emerald-500 text-white hover:bg-emerald-600"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {completed ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Mark as Pending
            </>
          ) : (
            <>
              <Circle className="w-4 h-4" /> Mark Complete
            </>
          )}
        </button>
      </div>
    </article>
  );
};

export default TaskCard;
