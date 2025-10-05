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
  const safeSeconds = Math.max(0, seconds);
  const mins = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(safeSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

const formatTimeWindow = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Time pending";
  }

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const sameDay = startDate.toDateString() === endDate.toDateString();
  if (sameDay) {
    return `${dateFormatter.format(startDate)} • ${timeFormatter.format(
      startDate
    )} – ${timeFormatter.format(endDate)}`;
  }

  return `${dateFormatter.format(startDate)} ${timeFormatter.format(
    startDate
  )} → ${dateFormatter.format(endDate)} ${timeFormatter.format(endDate)}`;
};

const LaundryTimer = ({
  machineName,
  initialTime = 0,
  currentUser,
  upcomingBookings = [],
  onComplete,
}) => {
  const initialSeconds = useMemo(
    () => Math.max(0, Math.round(Number(initialTime) * 60)),
    [initialTime]
  );

  const [totalDuration, setTotalDuration] = useState(initialSeconds);
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(initialSeconds > 0);
  const [manualMinutes, setManualMinutes] = useState(Number(initialTime) || 0);

  const intervalRef = useRef(null);

  useEffect(() => {
    setTotalDuration(initialSeconds);
    setTimeLeft(initialSeconds);
    setManualMinutes(Number(initialTime) || 0);
    setIsRunning(initialSeconds > 0);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [initialSeconds, initialTime]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!isRunning || timeLeft <= 0) {
      return undefined;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0 && totalDuration > 0) {
      setIsRunning(false);
      if (typeof onComplete === "function") {
        onComplete();
      }
    }
  }, [timeLeft, totalDuration, onComplete]);

  const percentComplete = useMemo(() => {
    if (!totalDuration) return 0;
    const progress = ((totalDuration - timeLeft) / totalDuration) * 100;
    return Math.min(100, Math.max(0, progress));
  }, [timeLeft, totalDuration]);

  const etaLabel = useMemo(() => {
    if (timeLeft <= 0) return "Ready now";
    const eta = new Date(Date.now() + timeLeft * 1000);
    return eta.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }, [timeLeft]);

  const stateLabel = timeLeft <= 0 ? "Completed" : isRunning ? "In progress" : "Paused";

  const accentBg = machineName
    .toLowerCase()
    .includes("washer")
    ? "from-blue-500/20 to-blue-200/30"
    : "from-emerald-500/20 to-emerald-200/30";

  const nextBooking = upcomingBookings?.[0];

  const handleToggle = () => {
    if (timeLeft <= 0) {
      setTimeLeft(totalDuration);
    }
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(totalDuration);
  };

  const handleAddMinutes = (minutes) => {
    const additional = Math.round(Number(minutes) * 60);
    if (!additional) return;
    setTotalDuration((prev) => prev + additional);
    setTimeLeft((prev) => prev + additional);
  };

  const handleFinishNow = () => {
    setIsRunning(false);
    setTimeLeft(0);
    if (typeof onComplete === "function") {
      onComplete();
    }
  };

  const handleManualSubmit = (event) => {
    event.preventDefault();
    const nextMinutes = Number(manualMinutes);
    if (!nextMinutes || nextMinutes <= 0) return;
    const nextSeconds = Math.round(nextMinutes * 60);
    setTotalDuration(nextSeconds);
    setTimeLeft(nextSeconds);
    setIsRunning(false);
  };

  return (
    <article className={`rounded-3xl border border-gray-100 bg-white/90 backdrop-blur-md shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl focus-within:ring-2 focus-within:ring-blue-200`}>
      <div className={`h-2 rounded-t-3xl bg-gradient-to-r ${accentBg}`} aria-hidden="true" />

      <div className="flex flex-col gap-6 p-6" tabIndex={0}>
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${
                accentBg === "from-blue-500/20 to-blue-200/30"
                  ? "from-blue-500/20 to-blue-200/40 text-blue-600"
                  : "from-emerald-500/20 to-emerald-200/40 text-emerald-600"
              }`}
            >
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">{stateLabel}</p>
              <h3 className="text-xl font-semibold text-gray-900">{machineName}</h3>
              <p className="text-sm text-gray-500">
                In use by <span className="font-medium text-blue-600">{currentUser}</span>
              </p>
            </div>
          </div>
          <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            {(totalDuration / 60).toFixed(totalDuration % 60 ? 1 : 0)} min cycle
          </div>
        </header>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="font-mono text-4xl font-bold text-gray-900">
              {formatCountdown(timeLeft)}
            </div>
            <div className="flex flex-col gap-1 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <AlarmClock className="h-4 w-4 text-blue-500" />
                ETA: <span className="font-medium text-gray-800">{etaLabel}</span>
              </span>
              <span className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-blue-500" />
                Progress: <span className="font-medium text-gray-800">{percentComplete.toFixed(0)}%</span>
              </span>
            </div>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${accentBg}`}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <button
            type="button"
            onClick={handleToggle}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${
              isRunning ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isRunning ? (
              <>
                <PauseCircle className="h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" /> {timeLeft <= 0 ? "Restart" : "Start"}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>

          <button
            type="button"
            onClick={() => handleAddMinutes(5)}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            <PlusCircle className="h-4 w-4" /> +5 min
          </button>

          <button
            type="button"
            onClick={handleFinishNow}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <CheckCircle2 className="h-4 w-4" /> Finish now
          </button>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-4">
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor={`${machineName}-cycle`} className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Custom cycle length (minutes)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`${machineName}-cycle`}
                  type="number"
                  min="1"
                  step="0.5"
                  value={manualMinutes}
                  onChange={(event) => setManualMinutes(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </form>

          {nextBooking ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm leading-relaxed text-blue-700">
              <p className="font-semibold text-blue-800">Upcoming booking</p>
              <p className="mt-1">
                <span className="font-semibold">{nextBooking.user}</span> reserved this machine
              </p>
              <p className="text-blue-600/80">{formatTimeWindow(nextBooking.start, nextBooking.end)}</p>
              {nextBooking.notes && (
                <p className="mt-1 text-blue-600/70">Notes: {nextBooking.notes}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No upcoming bookings for this machine.</p>
          )}
        </section>
      </div>
    </article>
  );
};

export default LaundryTimer;
