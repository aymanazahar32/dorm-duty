# Aura Points System Implementation

## Overview
The aura points system rewards users for completing tasks and penalizes them for missing deadlines or reverting completed tasks.

## Features Implemented

### 1. **Points Award Based on Completion Time**

When a task is marked as completed, points are awarded based on timing:

- **3+ days early**: 100 aura points
- **1-2 days early**: 80 aura points  
- **Same day (on time)**: 60 aura points
- **No due date**: 50 aura points (base reward)
- **Overdue**: -10 aura points (penalty)

### 2. **Points Deduction for Missed Deadlines**

If a user completes a task after the deadline, they receive a **-10 point penalty** instead of earning points.

### 3. **Points Removal When Reverting to Pending**

When a task is marked as "In Progress" after being completed:
- The exact aura points that were awarded are deducted
- The system tracks the original award amount in the task's `aura_awarded` field
- User sees a notification: "Task marked as pending. -X aura points removed."

### 4. **Real-time Leaderboard Updates**

The leaderboard automatically reflects aura point changes:
- Points are stored in the `users` table (`aura_points` column)
- Rankings update when users complete or revert tasks
- Points cannot go below 0

## Technical Implementation

### Frontend Components Updated

1. **`frontend/src/pages/Tasks.jsx`**
   - Added `calculateAuraPoints()` function
   - Updated `handleToggleCompleted()` to award/deduct points
   - Stores actual points earned in `task.auraAwarded` field
   - Shows success/error messages with point changes

2. **`frontend/src/pages/Home.jsx`**
   - Added `calculateAuraPoints()` function
   - Updated `handleTaskStatusChange()` for dropdown status changes
   - Handles "Mark as Done" and "Mark as In Progress" options
   - Deducts points when reverting from completed to pending

3. **`frontend/src/utils/api.js`**
   - Added `updateUserAura()` function
   - Makes PATCH request to `/api/user/aura` endpoint

### Backend API

**New Endpoint**: `PATCH /api/user/aura`

Located at: `dormduty-web/src/app/api/user/aura/route.ts`

**Request Body**:
```json
{
  "userId": "user-id",
  "roomId": "room-id",
  "auraChange": 80,
  "reason": "Completed task: Clean Kitchen"
}
```

**Response**:
```json
{
  "data": {
    "userId": "user-id",
    "aura_points": 180,
    "change": 80
  }
}
```

**Features**:
- Validates user membership in room
- Updates `users.aura_points` in Supabase
- Prevents aura points from going below 0
- Logs all point changes with reasons

## Database Schema

The `users` table includes:
```sql
aura_points INTEGER DEFAULT 0
```

The `tasks` table includes:
```sql
aura_awarded INTEGER DEFAULT 0
```

## User Experience

### Completing a Task
1. User clicks checkbox or selects "Mark as Done"
2. System calculates points based on due date
3. Points are awarded to the assigned user
4. Success message shows: "Task completed! +80 aura points earned! 🎉"
5. Leaderboard updates immediately

### Reverting a Task
1. User unchecks a completed task or selects "Mark as In Progress"
2. System looks up previously awarded points
3. Those exact points are deducted
4. Message shows: "Task marked as pending. -80 aura points removed."
5. Leaderboard updates immediately

### Completing Overdue Tasks
1. User completes a task past its due date
2. System applies -10 point penalty
3. Message shows: "Task completed but was overdue. -10 aura points."

## Benefits

✅ **Encourages early completion** - More points for finishing ahead of schedule
✅ **Fair penalties** - Overdue completion still gets recognized but with penalty
✅ **Prevents gaming** - Reverting tasks removes the earned points
✅ **Transparent** - Users see exactly how many points they earn/lose
✅ **Motivating** - Gamification encourages task completion and friendly competition

## Next Steps (Optional Enhancements)

- Add bonus multipliers for streak completion
- Implement achievement badges for milestones
- Add point history/transaction log
- Create weekly/monthly leaderboard resets
- Add notifications for point changes
