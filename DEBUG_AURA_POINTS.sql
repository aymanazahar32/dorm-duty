-- Diagnostic queries to debug aura points issue
-- Run these in Supabase SQL Editor

-- 1. Check all users and their aura points
SELECT id, name, email, aura_points, room_id
FROM users
ORDER BY name;

-- 2. Check all tasks and who they're assigned to
SELECT 
  t.id,
  t.task_name,
  t.user_id as assigned_to_user_id,
  u.name as assigned_to_name,
  t.completed,
  t.aura_awarded,
  t.due_date,
  t.room_id
FROM tasks t
LEFT JOIN users u ON t.user_id = u.id
ORDER BY t.created_at DESC;

-- 3. Check if Ayman's user ID exists in the users table
SELECT id, name, email, aura_points
FROM users
WHERE name ILIKE '%ayman%' OR email ILIKE '%ayman%';

-- 4. Check tasks assigned to Ayman (replace with actual user ID if needed)
SELECT 
  t.id,
  t.task_name,
  t.user_id,
  t.completed,
  t.aura_awarded,
  t.due_date
FROM tasks t
WHERE t.user_id IN (SELECT id FROM users WHERE name ILIKE '%ayman%');

-- 5. Manually award points to a specific user (EXAMPLE - UPDATE WITH ACTUAL USER ID)
-- Uncomment and replace 'AYMAN_USER_ID_HERE' with Ayman's actual user ID
/*
UPDATE users 
SET aura_points = aura_points + 60
WHERE id = 'AYMAN_USER_ID_HERE';
*/
