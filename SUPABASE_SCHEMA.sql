-- =====================================================
-- DormDuty Supabase Database Schema
-- Run this in Supabase SQL Editor to create tables
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ROOMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON rooms(created_at DESC);

-- =====================================================
-- USERS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  aura_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_room_id ON users(room_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- TASKS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  task_name TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  aura_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_tasks_room_id ON tasks(room_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Rooms policies
DROP POLICY IF EXISTS "Users can view their own room" ON rooms;
CREATE POLICY "Users can view their own room" ON rooms
  FOR SELECT USING (
    id IN (SELECT room_id FROM users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Room creators can update their rooms" ON rooms;
CREATE POLICY "Room creators can update their rooms" ON rooms
  FOR UPDATE USING (created_by = auth.uid());

-- Users policies
DROP POLICY IF EXISTS "Users can view users in their room" ON users;
CREATE POLICY "Users can view users in their room" ON users
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert themselves" ON users;
CREATE POLICY "Users can insert themselves" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- Tasks policies
DROP POLICY IF EXISTS "Users can view tasks in their room" ON tasks;
CREATE POLICY "Users can view tasks in their room" ON tasks
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create tasks in their room" ON tasks;
CREATE POLICY "Users can create tasks in their room" ON tasks
  FOR INSERT WITH CHECK (
    room_id IN (SELECT room_id FROM users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update tasks in their room" ON tasks;
CREATE POLICY "Users can update tasks in their room" ON tasks
  FOR UPDATE USING (
    room_id IN (SELECT room_id FROM users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete tasks in their room" ON tasks;
CREATE POLICY "Users can delete tasks in their room" ON tasks
  FOR DELETE USING (
    room_id IN (SELECT room_id FROM users WHERE id = auth.uid())
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM rooms LIMIT 5;
-- SELECT * FROM users LIMIT 5;
-- SELECT * FROM tasks LIMIT 5;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Uncomment to insert sample data:
/*
INSERT INTO rooms (name, created_by) VALUES
  ('Test Dorm 101', (SELECT id FROM auth.users LIMIT 1)),
  ('Apartment 5B', (SELECT id FROM auth.users LIMIT 1));
*/
