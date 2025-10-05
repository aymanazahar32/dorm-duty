# Debugging Aura Points Issue for Ayman

## Problem
Ayman completed a task but didn't receive aura points, while other users (Yeaz: 80, ananrh123: 60) did receive points.

## How to Debug

### Step 1: Check Browser Console Logs

1. Open the app in your browser
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Complete a task and look for these messages:

**Expected logs:**
```
🎯 Awarding 60 points to user: <user-id> for task: <task-name>
✅ Aura points successfully awarded to: <user-id>
```

**Error logs to watch for:**
```
❌ Failed to update aura for user: <user-id> Error: ...
```

### Step 2: Verify User ID in Database

Run this query in Supabase SQL Editor:

```sql
-- Find Ayman's user record
SELECT id, name, email, aura_points, room_id
FROM users
WHERE name ILIKE '%ayman%' OR email ILIKE '%ayman%';
```

**Copy Ayman's user ID** from the results.

### Step 3: Check Task Assignment

Run this query (replace `AYMAN_USER_ID` with the actual ID from Step 2):

```sql
-- Check what tasks are assigned to Ayman
SELECT 
  id,
  task_name,
  user_id,
  completed,
  aura_awarded,
  due_date
FROM tasks
WHERE user_id = 'AYMAN_USER_ID';
```

**Look for:**
- Is the task's `user_id` matching Ayman's actual user ID?
- Does the completed task show `aura_awarded` value?

### Step 4: Common Issues & Fixes

#### Issue 1: Task Not Assigned to Ayman
**Symptom:** The task's `user_id` doesn't match Ayman's user ID

**Fix:** Reassign the task:
```sql
UPDATE tasks 
SET user_id = 'AYMAN_USER_ID'
WHERE id = 'TASK_ID';
```

#### Issue 2: API Error (Check Console)
**Symptom:** Console shows `❌ Failed to update aura` error

**Possible causes:**
- User not in the room
- Invalid room_id
- Network error

**Fix:** Check the error message details in console

#### Issue 3: Task Completed Before Code Update
**Symptom:** Task was completed before aura system was implemented

**Fix:** Manually award points:
```sql
UPDATE users 
SET aura_points = aura_points + 60
WHERE id = 'AYMAN_USER_ID';
```

### Step 5: Manual Point Award (If Needed)

If the task was legitimately completed but points weren't awarded:

1. Calculate points based on when completed:
   - 3+ days early = 100 points
   - 1-2 days early = 80 points
   - On time (same day) = 60 points
   - Overdue = -10 points

2. Run this query:
```sql
UPDATE users 
SET aura_points = aura_points + 60  -- Adjust points as needed
WHERE id = 'AYMAN_USER_ID';
```

### Step 6: Test Again

1. Create a new test task assigned to Ayman
2. Complete the task
3. Check console for logs
4. Verify points were updated in the leaderboard

## Quick Diagnostic Script

Run `DEBUG_AURA_POINTS.sql` in Supabase SQL Editor - it has all the queries you need.

## Need More Help?

If the issue persists:
1. Share the console logs (both success and error messages)
2. Share the results from the SQL queries
3. Confirm which page/method was used to complete the task (Tasks page checkbox or Home page dropdown)
