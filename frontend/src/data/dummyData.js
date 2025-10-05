// Dummy Roommates Data
export const roommates = [
  { id: 1, name: "Salman", aura: 25, avatar: "🧠" },
  { id: 2, name: "Ayman", aura: 40, avatar: "🔥" },
  { id: 3, name: "Anan", aura: 30, avatar: "💪" },
  { id: 4, name: "Yeaz", aura: 20, avatar: "⚡" },
];

// Dummy Task Data
export const tasks = [
  { id: 1, name: "Take out Trash", assignedTo: "Ayman", completed: true },
  { id: 2, name: "Do the Dishes", assignedTo: "Salman", completed: false },
  { id: 3, name: "Vacuum the Room", assignedTo: "Yeaz", completed: true },
  { id: 4, name: "Mop the Floor", assignedTo: "Anan", completed: false },
];

// Dummy Laundry Data
export const laundry = {
  washerUser: "Anan",
  dryerUser: "Yeaz",
  timerEnd: "2025-10-04T15:30:00Z",
};

// Dummy AI Insights (for Schedule Organizer)
export const aiInsights = {
  summary:
    "🧺 Best laundry time: 9–11 AM (Ayman free). 🍳 Common kitchen slot: 7–8 PM. 🌙 Quiet hours overlap: 11 PM–7 AM.",
  commonFree: ["7–8 PM"],
  laundrySlot: "9–11 AM",
  quietHours: "11 PM–7 AM",
};

// Dummy Splitwise-style Data
export const bills = [
  { id: 1, description: "Electricity", paidBy: "Salman", amount: 40, owedBy: ["Ayman", "Anan", "Yeaz"] },
  { id: 2, description: "Water Bill", paidBy: "Anan", amount: 30, owedBy: ["Salman", "Yeaz"] },
  { id: 3, description: "Internet", paidBy: "Ayman", amount: 50, owedBy: ["Salman", "Anan"] },
];
