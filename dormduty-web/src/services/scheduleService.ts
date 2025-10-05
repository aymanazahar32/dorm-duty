"use client";

/**
 * Simple schedule storage helper using localStorage.
 * Mirrors the behaviour of the CRA implementation so existing components work.
 */

export type TimeSlot = {
  id?: string;
  day: string;
  startTime: string;
  endTime: string;
  isBusy: boolean;
  activity?: string;
};

export type Schedule = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  userName: string;
  userEmail?: string;
  roomNumber?: string;
  preferences?: string;
  timeSlots: TimeSlot[];
};

const STORAGE_KEY = "dormduty_schedules";
const SUGGESTIONS_KEY = "dormduty_suggestions";

class ScheduleService {
  private safeParse<T>(value: string | null, fallback: T): T {
    if (!value) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error("Error parsing stored schedules", error);
      return fallback;
    }
  }

  getSchedules(): Schedule[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return this.safeParse<Schedule[]>(data, []);
  }

  saveSchedules(schedules: Schedule[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
  }

  addSchedule(schedule: Omit<Schedule, "id" | "createdAt">) {
    const schedules = this.getSchedules();
    const newSchedule: Schedule = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...schedule,
    };
    schedules.push(newSchedule);
    this.saveSchedules(schedules);
    return newSchedule;
  }

  updateSchedule(id: string, updates: Partial<Schedule>) {
    const schedules = this.getSchedules();
    const index = schedules.findIndex((s) => s.id === id);
    if (index === -1) return null;

    schedules[index] = {
      ...schedules[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveSchedules(schedules);
    return schedules[index];
  }

  deleteSchedule(id: string) {
    const schedules = this.getSchedules();
    const filtered = schedules.filter((s) => s.id !== id);
    this.saveSchedules(filtered);
    return filtered.length < schedules.length;
  }

  getScheduleByUser(userEmail: string) {
    const schedules = this.getSchedules();
    return schedules.find((s) => s.userEmail === userEmail) ?? null;
  }

  saveSuggestions<T = unknown>(suggestions: T) {
    if (typeof window === "undefined") return;
    const payload = { suggestions, timestamp: new Date().toISOString() };
    localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(payload));
  }

  getSuggestions<T = unknown>() {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem(SUGGESTIONS_KEY);
    return this.safeParse<{ suggestions: T; timestamp?: string } | null>(data, null);
  }

  clearAllSchedules() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SUGGESTIONS_KEY);
  }

  validateSchedule(schedule: Partial<Schedule>) {
    const errors: string[] = [];

    if (!schedule.userName || schedule.userName.trim() === "") {
      errors.push("User name is required");
    }

    const slots = schedule.timeSlots ?? [];
    if (slots.length === 0) {
      errors.push("At least one time slot is required");
    }

    slots.forEach((slot, index) => {
      if (!slot.day) {
        errors.push(`Time slot ${index + 1}: Day is required`);
      }
      if (!slot.startTime) {
        errors.push(`Time slot ${index + 1}: Start time is required`);
      }
      if (!slot.endTime) {
        errors.push(`Time slot ${index + 1}: End time is required`);
      }
      if (slot.startTime && slot.endTime && slot.startTime >= slot.endTime) {
        errors.push(`Time slot ${index + 1}: End time must be after start time`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  getStatistics() {
    const schedules = this.getSchedules();
    const totalTimeSlots = schedules.reduce((sum, s) => sum + s.timeSlots.length, 0);
    const totalFreeSlots = schedules.reduce(
      (sum, s) => sum + s.timeSlots.filter((slot) => !slot.isBusy).length,
      0
    );
    const totalBusySlots = schedules.reduce(
      (sum, s) => sum + s.timeSlots.filter((slot) => slot.isBusy).length,
      0
    );

    return {
      totalUsers: schedules.length,
      totalTimeSlots,
      totalFreeSlots,
      totalBusySlots,
    };
  }

  exportSchedules() {
    if (typeof window === "undefined") return;
    const schedules = this.getSchedules();
    const dataStr = JSON.stringify(schedules, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dormduty-schedules-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importSchedules(jsonData: string) {
    try {
      const imported = JSON.parse(jsonData);
      if (!Array.isArray(imported)) {
        throw new Error("Invalid format: expected an array of schedules");
      }

      imported.forEach((schedule) => {
        const validation = this.validateSchedule(schedule);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(", "));
        }
      });

      this.saveSchedules(imported as Schedule[]);
      return { success: true, count: imported.length };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

const scheduleService = new ScheduleService();
export default scheduleService;
