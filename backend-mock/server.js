/**
 * Mock Backend Server for DormDuty Frontend Testing
 * Run with: node server.js
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (replace with real database)
const users = new Map();
const rooms = new Map();

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
  res.status(201).json(newRoom);
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
║   Running on: http://localhost:${PORT}  ║
╚════════════════════════════════════════╝

Available endpoints:
  POST   /api/registerUser
  GET    /api/user/:userId
  GET    /api/room/:roomId
  PUT    /api/user/:userId/room
  GET    /api/rooms
  POST   /api/rooms
  GET    /health

Test with:
  curl http://localhost:${PORT}/health
  `);
});

module.exports = app;
