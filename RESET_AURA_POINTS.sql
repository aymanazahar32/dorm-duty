-- Reset all user aura points to 0
-- Run this in Supabase SQL Editor

UPDATE users 
SET aura_points = 0
WHERE aura_points IS NOT NULL OR aura_points != 0;

-- Verify the reset
SELECT id, name, email, aura_points 
FROM users 
ORDER BY name;
