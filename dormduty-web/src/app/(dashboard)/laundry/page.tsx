/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";
import React, { useMemo, useState } from "react";
import {
  CalendarClock,
  Clock,
  PlusCircle,
  StickyNote,
  User,
  XCircle,
} from "lucide-react";
import LaundryTimer from "../../../components/LaundryTimer";

const machines = [
  { name: "Washer Machine", defaultMinutes: 30, currentUser: "Ayman" },
  { name: "Dryer Machine", defaultMinutes: 45, currentUser: "Salman" },
];

const initialBookings = [
  {
    id: 1,
    machine: "Washer Machine",
    user: "Yeaz",
    start: "2025-10-18T18:00",
    end: "2025-10-18T18:45",
    notes: "Quick refresh load",
  },
  {
    id: 2,
    machine: "Dryer Machine",
    user: "Anan",
    start: "2025-10-18T19:00",
    end: "2025-10-18T19:40",
    notes: "Sheets and towels",
  },
  {
    id: 3,
    machine: "Washer Machine",
    user: "Salman",
    start: "2025-10-19T08:15",
    end: "2025-10-19T08:55",
  },
];

const formatBookingRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Time pending";
  }

  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const sameDay = startDate.toDateString() === endDate.toDateString();
  if (sameDay) {
    return `${dayFormatter.format(startDate)} • ${timeFormatter.format(
      startDate
    )} – ${timeFormatter.format(endDate)}`;
  }

  return `${dayFormatter.format(startDate)} ${timeFormatter.format(
    startDate
  )} → ${dayFormatter.format(endDate)} ${timeFormatter.format(endDate)}`;
};

const Laundry = () => {
  const [bookings, setBookings] = useState(initialBookings);
  const [bookingForm, setBookingForm] = useState({
    machine: machines[0].name,
    user: "",
    start: "",
    end: "",
    notes: "",
  });
  const [error, setError] = useState("");

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      ),
    [bookings]
  );

  const now = new Date();

  const upcomingBookings = useMemo(
    () => sortedBookings.filter((booking) => new Date(booking.end) > new Date()),
    [sortedBookings]
  );

  const bookingsByMachine = useMemo(() => {
    const map = {};
    machines.forEach((machine) => {
      map[machine.name] = upcomingBookings.filter(
        (booking) => booking.machine === machine.name
      );
    });
    return map;
  }, [upcomingBookings]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setBookingForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleRemoveBooking = (id) => {
    setBookings((prev) => prev.filter((booking) => booking.id !== id));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const { machine, user, start, end, notes } = bookingForm;
    if (!machine || !user.trim() || !start || !end) {
      setError("Please complete all required fields.");
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate <= startDate
    ) {
      setError("End time must be after start time.");
      return;
    }

    const overlaps = bookings.some((booking) => {
      if (booking.machine !== machine) return false;
      const existingStart = new Date(booking.start);
      const existingEnd = new Date(booking.end);
      return existingStart < endDate && existingEnd > startDate;
    });

    if (overlaps) {
      setError("This machine is already booked during that window.");
      return;
    }

    setBookings((prev) => [
      ...prev,
      {
        id: Date.now(),
        machine,
        user: user.trim(),
        start,
        end,
        notes: notes.trim() || undefined,
      },
    ]);

    setBookingForm({
      machine,
      user: "",
      start: "",
      end: "",
      notes: "",
    });
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-emerald-100 p-6 pb-32">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="grid gap-6 lg:grid-cols-2">
          {machines.map((machine) => (
            <LaundryTimer
              key={machine.name}
              machineName={machine.name}
              initialTime={machine.defaultMinutes}
              currentUser={machine.currentUser}
              upcomingBookings={bookingsByMachine[machine.name] ?? []}
            />
          ))}
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-lg backdrop-blur-md">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex-1 space-y-4">
              <header className="flex items-center gap-3 text-blue-600">
                <CalendarClock className="h-6 w-6" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Upcoming bookings
                </h2>
              </header>

              <div className="space-y-3">
                {upcomingBookings.length ? (
                  upcomingBookings.map((booking) => {
                    const isOngoing =
                      new Date(booking.start) <= now && new Date(booking.end) >= now;
                    return (
                      <article
                        key={booking.id}
                        className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm transition hover:shadow-md ${
                          isOngoing
                            ? "border-emerald-200 bg-emerald-50/60"
                            : "border-gray-200 bg-gray-50/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-2 text-gray-700">
                            <Clock className="h-4 w-4 text-blue-500" />
                            {booking.machine}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBooking(booking.id)}
                            className="flex items-center gap-1 text-xs font-semibold text-gray-400 transition hover:text-red-500"
                            aria-label="Remove booking"
                          >
                            <XCircle className="h-4 w-4" /> Remove
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-gray-600">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                            <User className="h-4 w-4" /> {booking.user}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatBookingRange(booking.start, booking.end)}
                          </span>
                        </div>
                        {booking.notes && (
                          <p className="flex items-start gap-2 text-gray-600">
                            <StickyNote className="mt-0.5 h-4 w-4 text-amber-500" />
                            {booking.notes}
                          </p>
                        )}
                      </article>
                    );
                  })
                ) : (
                  <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-sm text-gray-500">
                    No bookings yet. Reserve a machine to keep laundry flowing smoothly.
                  </p>
                )}
              </div>
            </div>

            <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-gray-50/70 p-5">
              <header className="mb-4 flex items-center gap-2 text-gray-800">
                <PlusCircle className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-semibold">Schedule a booking</h3>
              </header>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Machine
                  </label>
                  <select
                    name="machine"
                    value={bookingForm.machine}
                    onChange={handleFormChange}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {machines.map((machine) => (
                      <option key={machine.name} value={machine.name}>
                        {machine.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Who&apos;s booking?
                  </label>
                  <input
                    type="text"
                    name="user"
                    value={bookingForm.user}
                    onChange={handleFormChange}
                    placeholder="Roommate name"
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Start
                    </label>
                    <input
                      type="datetime-local"
                      name="start"
                      value={bookingForm.start}
                      onChange={handleFormChange}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      End
                    </label>
                    <input
                      type="datetime-local"
                      name="end"
                      value={bookingForm.end}
                      onChange={handleFormChange}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Notes <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    name="notes"
                    value={bookingForm.notes}
                    onChange={handleFormChange}
                    placeholder="Detergent preference, reminders, etc."
                    rows={2}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                {error && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
                >
                  <PlusCircle className="h-5 w-5" /> Add booking
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Laundry;
