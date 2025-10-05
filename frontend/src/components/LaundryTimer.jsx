import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlarmClock,
  CalendarClock,
  CheckCircle2,
  Clock,
  PauseCircle,
  PlayCircle,
  PlusCircle,
  RotateCcw,
} from "lucide-react";

const formatCountdown = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60).toString().padStart(2, "0");
  const secs = Math.floor(safeSeconds % 60).toString().padStart(2, "0");
  return hours > 0 ? `${hours.toString().padStart(2, "0")}:${mins}:${secs}` : `${mins}:${secs}`;
};

const formatTimeWindow = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Invalid time";
  }

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${timeFormatter.format(startDate)} - ${timeFormatter.format(endDate)}`;
};

const LaundryTimer = ({
  machineName,
  initialTime = 0,
  currentUser,
  upcomingBookings = [],
  onComplete,
}) => {
  // Cap initial time to under 50 hours for sanity (in minutes -> seconds)
  const initialSeconds = useMemo(
    () => {
      const mins = Math.max(0, Math.round(Number(initialTime)));
      const cappedMins = Math.min(mins, 50 * 60); // 50 hours max
      return cappedMins * 60;
    },
    [initialTime]
  );

  const [totalDuration, setTotalDuration] = useState(initialSeconds);
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(initialSeconds > 0);
  const [manualMinutes, setManualMinutes] = useState(Number(initialTime) || 0);
  const intervalRef = useRef(null);
  const [nowMs, setNowMs] = useState(Date.now());

  // Initialize timer
  useEffect(() => {
    setTotalDuration(initialSeconds);
    setTimeLeft(initialSeconds);
    setManualMinutes(Number(initialTime) || 0);
    setIsRunning(initialSeconds > 0);
    return () => clearInterval(intervalRef.current);
  }, [initialSeconds, initialTime]);

  // Real-time ticker for booking countdowns
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Countdown logic
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isRunning || timeLeft <= 0) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  // When timer ends
  useEffect(() => {
    if (timeLeft <= 0 && totalDuration > 0) {
      setIsRunning(false);
      onComplete?.();
    }
  }, [timeLeft, totalDuration, onComplete]);

  const percentComplete = totalDuration
    ? ((totalDuration - timeLeft) / totalDuration) * 100
    : 0;

  const accentBg = machineName.toLowerCase().includes("washer")
    ? "from-blue-400 to-blue-600"
    : "from-emerald-400 to-emerald-600";

  const nextBooking = upcomingBookings?.[0];

  return (
    <article className="rounded-3xl border border-gray-100 bg-white/90 backdrop-blur-md shadow-xl hover:-translate-y-1 hover:shadow-2xl transition">
      {/* Accent bar */}
      <div className={`h-2 rounded-t-3xl bg-gradient-to-r ${accentBg}`} />

      <div className="p-6 flex flex-col gap-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${accentBg} text-white`}>
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400 tracking-wide">
                {timeLeft <= 0 ? "Completed" : isRunning ? "In Progress" : "Paused"}
              </p>
              <h3 className="text-xl font-semibold text-gray-900">{machineName}</h3>
              <p className="text-sm text-gray-500">
                In use by{" "}
                <span className="font-semibold text-indigo-600">{currentUser}</span>
              </p>
            </div>
          </div>

          <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            {(totalDuration / 60).toFixed(0)} min cycle
          </div>
        </header>

        {/* Countdown Section */}
        <section className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-baseline gap-2">
              <span className="text-xs uppercase tracking-wide text-gray-400">Remaining</span>
              <div className="font-mono text-5xl font-extrabold text-gray-900">
                {formatCountdown(timeLeft)}
              </div>
            </div>
            <div className="text-sm text-gray-500 flex flex-col gap-1">
              <span className="flex items-center gap-2">
                <AlarmClock className="h-4 w-4 text-blue-500" />
                ETA:{" "}
                <span className="font-semibold">
                  {timeLeft > 0
                    ? new Date(Date.now() + timeLeft * 1000).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "Ready"}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-blue-500" />
                {percentComplete.toFixed(0)}% complete
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${accentBg}`}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </section>

        {/* Controls */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition ${
              isRunning ? "bg-amber-500 hover:bg-amber-600" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isRunning ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
            {isRunning ? "Pause" : timeLeft <= 0 ? "Restart" : "Start"}
          </button>

          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(totalDuration);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>

          <button
            onClick={() => {
              setTotalDuration((prev) => prev + 300);
              setTimeLeft((prev) => prev + 300);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            <PlusCircle className="h-4 w-4" /> +5 min
          </button>

          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(0);
              onComplete?.();
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
          >
            <CheckCircle2 className="h-4 w-4" /> Finish
          </button>
        </section>

        {/* Upcoming Booking */}
        {nextBooking && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm leading-relaxed text-blue-700">
            <p className="font-semibold text-blue-800">Upcoming Booking</p>
            <p className="mt-1">
              <span className="font-semibold text-indigo-700">{nextBooking.user}</span>{" "}
              reserved this machine.
            </p>
            <p className="text-blue-600/80">
              {formatTimeWindow(nextBooking.start, nextBooking.end)}
            </p>
            <p className="mt-1 text-blue-600/80">
              Starts in:{" "}
              <span className="font-semibold">
                {formatCountdown(
                  Math.max(0, (new Date(nextBooking.start).getTime() - nowMs) / 1000)
                )}
              </span>
            </p>
          </div>
        )}
      </div>
    </article>
  );
};

export default LaundryTimer;
