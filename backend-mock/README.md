# 🚀 DormDuty Mock Backend Server

Simple Express.js backend for testing the DormDuty frontend authentication.

## Quick Start

### 1. Install Dependencies

```bash
cd backend-mock
npm install
```

### 2. Run Server

```bash
npm start
```

Server will run on `http://localhost:8000`

## API Endpoints

### POST /api/registerUser
Register or fetch user after Supabase authentication.

**Request:**
```json
{
  "email": "user@example.com",
  "userId": "supabase-user-id",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "userId": "supabase-user-id",
  "email": "user@example.com",
  "name": "John Doe",
  "roomId": "room-1",
  "createdAt": "2025-01-05T00:00:00.000Z"
}
```

### GET /api/user/:userId
Get user details.

### GET /api/room/:roomId
Get room details with members.

### PUT /api/user/:userId/room
Update user's room assignment.

### GET /api/rooms
List all rooms.

### POST /api/rooms
Create a new room.

### GET /health
Health check endpoint.

## Features

- ✅ In-memory storage (no database needed for testing)
- ✅ CORS enabled
- ✅ Auto-assigns users to default room
- ✅ RESTful API design
- ✅ Error handling

## Testing

```bash
# Health check
curl http://localhost:8000/health

# Register user (simulate frontend call)
curl -X POST http://localhost:8000/api/registerUser \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","userId":"test-123","name":"Test User"}'

# Get user
curl http://localhost:8000/api/user/test-123

# Get room
curl http://localhost:8000/api/room/room-1
```

## Frontend Integration

The frontend is already configured to use this backend:
- URL: `http://localhost:8000`
- Set in `.env`: `REACT_APP_API_URL=http://localhost:8000`

## Production

For production, replace this with a real backend using:
- Database (PostgreSQL, MongoDB, etc.)
- Proper authentication
- Supabase integration
- Rate limiting
- Error logging
