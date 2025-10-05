import React, { useMemo } from "react";
import { AlarmClock, CalendarDays, Trash2 } from "lucide-react";

const formatDueLabel = (dueDate) => {
  if (!dueDate) return "No due date";
  const due = new Date(`${dueDate}T23:59:59`);
  const now = new Date();
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `Overdue by ${Math.abs(diff)}d`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff} days`;
};

const Avatar = ({ avatar, name }) => {
  const base = "w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-semibold border border-gray-200";
  if (avatar && /^(https?:|data:)/.test(avatar)) {
    return <img src={avatar} alt={name} className={base} />;
  }
  const content = avatar || (name ? name.charAt(0) : "?");
  return <span className={`${base} bg-gray-100 text-gray-600`}>{content}</span>;
};

const TaskCard = ({
  title,
  assignedTo,
  assignedAvatar,
  dueDate,
  completed,
  notes,
  onToggle,
  onSnooze,
  onDelete,
}) => {
  const dueLabel = useMemo(() => formatDueLabel(dueDate), [dueDate]);

  return (
    <article
      className={`rounded-2xl border p-5 shadow-md backdrop-blur-md transition-all hover:shadow-lg ${
        completed
          ? "bg-emerald-50/80 border-emerald-200"
          : "bg-white/70 border-gray-100"
      }`}
    >
      <header className="flex justify-between items-start mb-2">
        <div>
          <h3
            className={`text-lg font-semibold ${
              completed ? "text-emerald-700 line-through" : "text-gray-800"
            }`}
          >
            {title}
          </h3>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <Avatar avatar={assignedAvatar} name={assignedTo} />
            <span>{assignedTo}</span>
          </p>
        </div>
        <button
          onClick={onToggle}
          className={`text-sm px-3 py-1 rounded-full font-medium shadow-sm ${
            completed
              ? "bg-emerald-200 text-emerald-800 hover:bg-emerald-300"
              : "bg-blue-200 text-blue-800 hover:bg-blue-300"
          }`}
        >
          {completed ? "Completed" : "Mark Done"}
        </button>
      </header>

      <div className="flex justify-between text-xs mb-2">
        <span className="px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-700 flex items-center gap-1">
          <CalendarDays className="w-3 h-3" /> {dueLabel}
        </span>
      </div>

      {notes && (
        <p className="mt-2 text-gray-700 bg-gray-50 rounded-xl p-3 text-sm border border-gray-100">
          {notes}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        {!completed && (
          <button
            onClick={onSnooze}
            className="px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 flex items-center gap-1"
          >
            <AlarmClock className="w-3 h-3" /> Snooze
          </button>
        )}
        <button
          onClick={onDelete}
          className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" /> Delete
        </button>
      </div>
    </article>
  );
};

export default TaskCard;
