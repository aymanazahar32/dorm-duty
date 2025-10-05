import React, { useEffect, useMemo, useState } from "react";
import { CalendarClock, PlusCircle, StickyNote, User, XCircle } from "lucide-react";
import LaundryTimer from "../components/LaundryTimer";

const currentUser = "Salman";

const machines = [
  { name: "Washer Machine", defaultMinutes: 30, currentUser: "Ayman" },
  { name: "Dryer Machine", defaultMinutes: 45, currentUser: "Salman" },
];

const initialBookings = [
  { id: 1, machine: "Washer Machine", user: "Yeaz", start: "2025-10-18T18:00", end: "2025-10-18T18:45" },
  { id: 2, machine: "Dryer Machine", user: "Anan", start: "2025-10-18T19:00", end: "2025-10-18T19:45" },
  { id: 3, machine: "Washer Machine", user: "Md Salman Farse", start: "2025-10-19T08:15", end: "2025-10-19T09:00" },
];

const Laundry = () => {
  const [bookings, setBookings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("laundry_bookings") || "null");
      return Array.isArray(saved) ? saved : initialBookings;
    } catch {
      return initialBookings;
    }
  });
  const [form, setForm] = useState({ machine: machines[0].name, dateTime: "", notes: "" });
  const [error, setError] = useState("");

  const upcomingBookings = useMemo(
    () => bookings.filter((b) => new Date(b.start) > new Date()),
    [bookings]
  );

  const bookingsByMachine = useMemo(() => {
    const map = {};
    machines.forEach((m) => {
      map[m.name] = upcomingBookings.filter((b) => b.machine === m.name);
    });
    return map;
  }, [upcomingBookings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.dateTime) return setError("Please select date and time.");
    const end = new Date(new Date(form.dateTime).getTime() + 45 * 60000).toISOString();
    setBookings((prev) => [
      ...prev,
      { id: Date.now(), machine: form.machine, user: currentUser, start: form.dateTime, end, notes: form.notes },
    ]);
    setForm({ machine: machines[0].name, dateTime: "", notes: "" });
    setError("");
  };

  // Persist bookings for Profile view
  useEffect(() => {
    try {
      localStorage.setItem("laundry_bookings", JSON.stringify(bookings));
    } catch {}
  }, [bookings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-emerald-100 p-6 pb-32">
      <div className="mx-auto w-full max-w-6xl flex flex-col gap-10">
        {/* Timers */}
        <section className="grid gap-8 lg:grid-cols-2">
          {machines.map((m) => (
            <LaundryTimer
              key={m.name}
              machineName={m.name}
              initialTime={m.defaultMinutes}
              currentUser={m.currentUser}
              upcomingBookings={bookingsByMachine[m.name] ?? []}
            />
          ))}
        </section>

        {/* Booking Management */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upcoming Bookings */}
          <section className="rounded-3xl border border-gray-100 bg-white/90 shadow-lg p-6">
            <header className="flex items-center gap-3 mb-4 text-blue-600">
              <CalendarClock className="h-6 w-6" />
              <h2 className="text-2xl font-semibold text-gray-900">Upcoming Bookings</h2>
            </header>

            <div className="space-y-3">
              {upcomingBookings.length ? (
                upcomingBookings.map((b) => (
                  <div key={b.id} className="rounded-xl border border-gray-200 p-4 bg-gray-50 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-800">{b.machine}</span>
                      <button onClick={() => setBookings((prev) => prev.filter((bk) => bk.id !== b.id))}>
                        <XCircle className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-500" /> {b.user}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(b.start).toLocaleString()} -{" "}
                      {new Date(b.end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </p>
                    {b.notes && (
                      <p className="mt-1 text-xs flex items-center gap-1 text-gray-500">
                        <StickyNote className="h-3 w-3 text-amber-500" /> {b.notes}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No bookings yet. Add one below.</p>
              )}
            </div>
          </section>

          {/* Schedule Booking */}
          <section className="rounded-3xl border border-gray-100 bg-white/90 shadow-lg p-6">
            <header className="flex items-center gap-2 mb-4 text-indigo-600">
              <PlusCircle className="h-6 w-6" />
              <h3 className="text-xl font-semibold text-gray-900">Schedule a Booking</h3>
            </header>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <select
                name="machine"
                value={form.machine}
                onChange={(e) => setForm({ ...form, machine: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
              >
                {machines.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>

              <input
                type="datetime-local"
                name="dateTime"
                value={form.dateTime}
                onChange={(e) => setForm({ ...form, dateTime: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
              />

              <textarea
                name="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Add optional notes..."
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
              />

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 text-white py-2 text-sm font-semibold hover:bg-indigo-700"
              >
                Add Booking
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Laundry;
