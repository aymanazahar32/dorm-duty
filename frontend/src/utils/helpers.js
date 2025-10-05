// Format timestamp nicely
export function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Calculate weekly completion percentage
export function calcCompletionRate(tasks) {
  if (!tasks?.length) return 0;
  const done = tasks.filter((t) => t.completed).length;
  return Math.round((done / tasks.length) * 100);
}

// Assign aura points (for fun leaderboards)
export function calcAuraPoints(tasks) {
  return tasks.filter((t) => t.completed).length * 10; // 10 aura per completed task
}

// Get Dorm Master (max aura)
export function findDormMaster(users) {
  return users.reduce((max, user) => (user.aura > max.aura ? user : max), users[0]);
}
