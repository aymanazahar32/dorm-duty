/**
 * Mock Backend Server for DormDuty Frontend Testing
 * Run with: node server.js
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - Configure CORS to allow credentials
app.use(cors({
  origin: 'http://localhost:3000', // Frontend origin
  credentials: true, // Allow credentials (cookies, authorization headers)
}));
app.use(express.json());

// In-memory storage (replace with real database)
const users = new Map();
const rooms = new Map();
const tasks = new Map();
const laundryData = new Map();

// Initialize some test rooms
rooms.set('room-1', { id: 'room-1', name: 'Room 301', members: [] });
rooms.set('room-2', { id: 'room-2', name: 'Room 302', members: [] });

/**
 * POST /api/registerUser
 * Register or fetch user after Supabase authentication
 */
app.post('/api/registerUser', (req, res) => {
  try {
    const { email, userId, name } = req.body;

    if (!email || !userId) {
      return res.status(400).json({ error: 'Email and userId are required' });
    }

    // Check if user already exists
    if (users.has(userId)) {
      const existingUser = users.get(userId);
      console.log('✅ User already exists:', existingUser);
      return res.json(existingUser);
    }

    // Create new user
    const newUser = {
      userId: userId,
      email: email,
      name: name || email.split('@')[0],
      roomId: 'room-1', // Assign to default room for now
      createdAt: new Date().toISOString(),
    };

    users.set(userId, newUser);

    // Add user to room
    const room = rooms.get('room-1');
    if (room && !room.members.includes(userId)) {
      room.members.push(userId);
    }

    console.log('✅ New user registered:', newUser);
    res.status(201).json(newUser);

  } catch (error) {
    console.error('❌ Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/user/:userId
 * Get user details
 */
app.get('/api/user/:userId', (req, res) => {
  const { userId } = req.params;

  if (!users.has(userId)) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(users.get(userId));
});

/**
 * GET /api/room/:roomId
 * Get room details
 */
app.get('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;

  if (!rooms.has(roomId)) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const room = rooms.get(roomId);
  const roomMembers = room.members.map(memberId => users.get(memberId));

  res.json({
    ...room,
    members: roomMembers,
  });
});

/**
 * PUT /api/user/:userId/room
 * Update user's room assignment
 */
app.put('/api/user/:userId/room', (req, res) => {
  const { userId } = req.params;
  const { roomId } = req.body;

  if (!users.has(userId)) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!rooms.has(roomId)) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const user = users.get(userId);
  const oldRoomId = user.roomId;

  // Remove from old room
  if (oldRoomId && rooms.has(oldRoomId)) {
    const oldRoom = rooms.get(oldRoomId);
    oldRoom.members = oldRoom.members.filter(id => id !== userId);
  }

  // Add to new room
  const newRoom = rooms.get(roomId);
  if (!newRoom.members.includes(userId)) {
    newRoom.members.push(userId);
  }

  // Update user
  user.roomId = roomId;
  users.set(userId, user);

  console.log(`✅ User ${userId} moved to room ${roomId}`);
  res.json(user);
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    users: users.size,
    rooms: rooms.size,
  });
});

/**
 * GET /api/rooms
 * Get all rooms
 */
app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map(room => ({
    ...room,
    memberCount: room.members.length,
  }));
  res.json(roomList);
});

/**
 * POST /api/rooms
 * Create a new room
 */
app.post('/api/rooms', (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Room name is required' });
  }

  const roomId = `room-${Date.now()}`;
  const newRoom = {
    id: roomId,
    name: name,
    members: [],
    createdAt: new Date().toISOString(),
  };

  rooms.set(roomId, newRoom);
  console.log('✅ New room created:', newRoom);
  res.status(201).json({ roomId: roomId, ...newRoom });
});

/**
 * GET /api/tasks
 * Get tasks filtered by roomId (shows all room tasks for collaboration)
 * userId is used for authentication but not for filtering
 */
app.get('/api/tasks', (req, res) => {
  const { roomId, onlyIncomplete } = req.query;
  
  let filteredTasks = Array.from(tasks.values());
  
  // Filter by room to show all tasks for roommates
  if (roomId) {
    filteredTasks = filteredTasks.filter(task => task.room_id === roomId);
  }
  
  if (onlyIncomplete === 'true') {
    filteredTasks = filteredTasks.filter(task => !task.completed);
  }
  
  res.json({ data: filteredTasks });
});

/**
 * POST /api/tasks
 * Create a new task
 */
app.post('/api/tasks', (req, res) => {
  const { userId, roomId, taskName, dueDate, auraAwarded, assignedUserId } = req.body;
  
  if (!taskName) {
    return res.status(400).json({ error: 'Task name is required' });
  }
  
  const taskId = `task-${Date.now()}`;
  const newTask = {
    id: taskId,
    task_name: taskName,
    user_id: assignedUserId || userId,
    room_id: roomId,
    due_date: dueDate,
    aura_awarded: auraAwarded || 0,
    completed: false,
    created_at: new Date().toISOString(),
  };
  
  tasks.set(taskId, newTask);
  console.log('✅ Task created:', newTask);
  res.status(201).json({ data: newTask });
});

/**
 * PATCH /api/tasks
 * Update a task
 */
app.patch('/api/tasks', (req, res) => {
  const { taskId, updates } = req.body;
  
  if (!tasks.has(taskId)) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const task = tasks.get(taskId);
  const updatedTask = { ...task, ...updates };
  tasks.set(taskId, updatedTask);
  
  console.log('✅ Task updated:', updatedTask);
  res.json({ data: updatedTask });
});

/**
 * DELETE /api/tasks
 * Delete a task
 */
app.delete('/api/tasks', (req, res) => {
  const { taskId } = req.body;
  
  if (!tasks.has(taskId)) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  tasks.delete(taskId);
  console.log('✅ Task deleted:', taskId);
  res.json({ success: true });
});

/**
 * GET /api/leaderboard
 * Get leaderboard data
 */
app.get('/api/leaderboard', (req, res) => {
  const { userId, roomId, limit = 5, page = 1 } = req.query;
  
  // Get all users in the room
  let roomUsers = Array.from(users.values());
  
  if (roomId) {
    roomUsers = roomUsers.filter(user => user.roomId === roomId);
  }
  
  // Calculate aura points based on completed tasks
  const leaderboard = roomUsers.map(user => {
    const userTasks = Array.from(tasks.values()).filter(
      task => task.user_id === user.userId && task.completed
    );
    
    const auraPoints = userTasks.reduce((sum, task) => sum + (task.aura_awarded || 0), 0);
    
    return {
      id: user.userId,
      name: user.name,
      email: user.email,
      aura_points: auraPoints,
    };
  });
  
  // Sort by aura points descending
  leaderboard.sort((a, b) => b.aura_points - a.aura_points);
  
  // Add rank
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedLeaderboard = leaderboard.slice(startIndex, endIndex);
  
  res.json({
    data: paginatedLeaderboard,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: leaderboard.length,
    },
  });
});

/**
 * GET /api/laundry
 * Get laundry data for a user/room
 */
app.get('/api/laundry', (req, res) => {
  const { userId, roomId } = req.query;
  
  const key = roomId || userId;
  const data = laundryData.get(key) || {
    room_id: roomId,
    user_id: userId,
    machines: [],
  };
  
  res.json({ data });
});

/**
 * PATCH /api/laundry
 * Update laundry data
 */
app.patch('/api/laundry', (req, res) => {
  const { userId, roomId, updates } = req.body;
  
  const key = roomId || userId;
  const existing = laundryData.get(key) || {
    room_id: roomId,
    user_id: userId,
  };
  
  const updated = { ...existing, ...updates };
  laundryData.set(key, updated);
  
  console.log('✅ Laundry data updated:', updated);
  res.json({ data: updated });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 DormDuty Mock Backend Server     ║
║   Running on: http://localhost:${PORT}   ║
╚════════════════════════════════════════╝

Available endpoints:
  POST   /api/registerUser
  GET    /api/user/:userId
  PUT    /api/user/:userId/room
  GET    /api/rooms
  POST   /api/rooms
  GET    /api/room/:roomId
  GET    /api/tasks
  POST   /api/tasks
  PATCH  /api/tasks
  DELETE /api/tasks
  GET    /api/leaderboard
  GET    /api/laundry
  PATCH  /api/laundry
  GET    /health

Test with:
  curl http://localhost:${PORT}/health
  `);
});

module.exports = app;
