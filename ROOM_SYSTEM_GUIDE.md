# 🏠 Room Creation & Management System

Complete guide to the room setup and user ID system.

---

## 🎯 Overview

The room system allows users to:
- ✅ View their Supabase User ID and Room ID
- ✅ Create new rooms for their dorm
- ✅ Join existing rooms with a room code
- ✅ Share room codes with roommates
- ✅ Manage room assignments
- ✅ Pull real chore data based on their room

---

## 📁 New Files Created

### 1. **RoomSetup.jsx** (`frontend/src/pages/RoomSetup.jsx`)
Complete room creation and joining interface with 4 modes:

#### Modes:
1. **Choice** - Create new room or join existing
2. **Create** - Form to create a new room
3. **Join** - Form to join with room code
4. **Has Room** - Shows user's current room info

#### Features:
- Beautiful UI with gradients and icons
- Copy-to-clipboard for User ID and Room ID
- Real-time backend integration
- Success/error messaging
- Auto-redirect after room setup

### 2. **Profile.jsx** (`frontend/src/pages/Profile.jsx`)
User profile page showing all account information:

#### Displays:
- User's display name and email
- Supabase User ID (with copy button)
- Room ID (with copy button)
- Account actions (change room, logout)
- Helpful information about IDs

### 3. **Updated Files**

#### App.js
- Added `/room-setup` route (protected, no navbar)
- Added `/profile` route (protected, with navbar)

#### Navbar.jsx
- Added "Profile" tab with User icon
- Now 5 tabs total

---

## 🚀 User Flow

### First-Time User

```
1. Sign up / Log in
   ↓
2. Authenticated by Supabase
   ↓
3. Backend calls /api/registerUser
   ↓
4. User created but no roomId yet
   ↓
5. User goes to /room-setup
   ↓
6. Choice: Create or Join room
   ↓
7. Room assigned → roomId stored
   ↓
8. Redirect to /home
   ↓
9. Can now see chores for their room!
```

### Returning User

```
1. Log in
   ↓
2. Already has roomId
   ↓
3. Goes directly to /home
   ↓
4. Sees their room's chores
```

---

## 🎨 Pages & Navigation

### 1. Room Setup Page (`/room-setup`)

**Access**: 
- Direct link: `http://localhost:3000/room-setup`
- From Profile page → "Join or Create Room" button
- From Profile page → "Change Room" button (if already has room)

**Features**:
```javascript
// If user has no room
- Show: "Create New Room" button
- Show: "Join Existing Room" button
- Display: User ID (copyable)

// If user has room
- Show: Current room info
- Show: User ID and Room ID (both copyable)
- Option: "Change Room"
- Option: "Go to Dashboard"
```

**Create Room Flow**:
```
1. Click "Create New Room"
2. Enter room name (e.g., "Dorm 301")
3. Click "Create Room"
4. Backend creates room
5. Returns new Room ID
6. Updates user's roomId
7. Success! Shows Room ID
8. Auto-redirects to /home
```

**Join Room Flow**:
```
1. Click "Join Existing Room"
2. Enter Room ID from roommate
3. Click "Join Room"
4. Backend verifies room exists
5. Updates user's roomId
6. Success!
7. Auto-redirects to /home
```

### 2. Profile Page (`/profile`)

**Access**: 
- Click "Profile" in bottom navbar
- Direct link: `http://localhost:3000/profile`

**Displays**:
```
📧 Email Address
👤 Display Name
🔐 Supabase User ID (copyable)
🏠 Room ID (copyable, or button to setup)

Actions:
- Change Room (goes to /room-setup)
- Logout
```

**Features**:
- Beautiful gradient cards for IDs
- One-click copy to clipboard
- Shows checkmark when copied
- Info panel explaining what IDs are for
- Direct links to room setup

---

## 🔧 Technical Implementation

### Backend API Endpoints Used

```javascript
// Create new room
POST /api/rooms
Body: { name: "Room Name", createdBy: "user-id" }
Response: { roomId: "room-123", name: "Room Name" }

// Update user's room
PUT /api/user/:userId/room
Body: { roomId: "room-123" }
Response: { success: true, user: {...} }

// Verify room exists
GET /api/rooms?roomId=room-123
Response: { room: {...} }
```

### Frontend State Management

**AuthContext provides**:
```javascript
{
  user: {
    id: "supabase-uuid",      // From Supabase auth
    roomId: "room-123",       // From backend
    email: "user@email.com",
    name: "User Name"
  },
  updateProfile: (updates) => void  // Update user object
}
```

**RoomSetup uses**:
```javascript
const { user, updateProfile } = useAuth();

// After creating/joining room
updateProfile({ roomId: newRoomId });

// This updates:
// 1. Context state
// 2. localStorage
// 3. Propagates to all components
```

---

## 💡 How It Works

### User ID (Supabase UUID)

**What**: Unique identifier from Supabase authentication
**Format**: `91d2e8f8-8de4-4e8d-aac4-8e98e4613a42`
**Source**: Created when user signs up
**Purpose**: 
- Identifies user in all API calls
- Used as foreign key in database
- Never changes

**Where it's shown**:
- Profile page (main display)
- Room Setup page (small info box)

### Room ID

**What**: Identifier linking users in the same dorm
**Format**: Custom string (e.g., `room-123`, `dorm-301`)
**Source**: 
- Created when user creates a room
- Copied when user joins a room
**Purpose**:
- Groups users in same dorm together
- Filters chores/tasks by room
- Enables room-based features

**Where it's shown**:
- Profile page (main display if exists)
- Room Setup page (after creation/join)
- Can be shared with roommates

---

## 🎯 Use Cases

### Case 1: Creating a New Dorm Room

**Scenario**: First student in dorm wants to set up chores

```
1. Student A signs up
2. Goes to Profile → sees no room
3. Clicks "Set Up Room"
4. Chooses "Create New Room"
5. Names it "Apartment 5B"
6. Gets Room ID: "apt-5b-uuid"
7. Shares Room ID with roommates
```

### Case 2: Joining Existing Room

**Scenario**: Roommate wants to join established room

```
1. Student B signs up
2. Goes to Profile
3. Clicks "Set Up Room"
4. Chooses "Join Existing Room"
5. Pastes Room ID from Student A
6. Clicks "Join Room"
7. Now in same room as Student A
8. Sees shared chores
```

### Case 3: Viewing IDs for API Testing

**Scenario**: Developer needs IDs for testing backend

```
1. Log in
2. Go to Profile page
3. See User ID clearly displayed
4. Click copy button
5. Paste into API testing tool (Postman, curl)
6. Test backend endpoints
```

### Case 4: Moving to New Room

**Scenario**: Student moves to different dorm

```
1. Go to Profile
2. Click "Change Room"
3. Goes to Room Setup
4. Shows current room info
5. Click "Change Room" button
6. Can join new room or create one
7. Old room association removed
8. New room becomes active
```

---

## 🎨 UI/UX Features

### Visual Design

**Color Coding**:
- 🟦 **Indigo/Blue** - User ID (authentication)
- 🟪 **Purple** - Room ID (room/group)
- 🟩 **Green** - Success states
- 🟥 **Red** - Errors

**Icons** (from lucide-react):
- 🏠 `Home` - Room/dorm related
- 👤 `User` - Profile/user related  
- 📋 `Copy` - Clipboard actions
- ✓ `Check` - Copied confirmation
- ➕ `Plus` - Create actions
- 👥 `Users` - Join/group actions

### Interactive Elements

**Copy to Clipboard**:
- Hover shows tooltip
- Click copies to clipboard
- Icon changes to checkmark
- Auto-reverts after 2 seconds

**Loading States**:
- Button shows spinner when processing
- Disabled during API calls
- Text changes to "Creating..." / "Joining..."

**Success Messages**:
- Green background with checkmark icon
- Shows Room ID after creation
- Auto-redirect after 2 seconds

**Error Handling**:
- Red background with alert icon
- Clear error messages
- Doesn't redirect on error
- User can try again

---

## 📱 Responsive Design

All pages work on:
- ✅ Mobile (320px+)
- ✅ Tablet (768px+)
- ✅ Desktop (1024px+)

**Key responsive features**:
- Flexible layouts with `max-w-2xl` containers
- Touch-friendly buttons (minimum 44px height)
- Readable text sizes
- Proper spacing on all screen sizes

---

## 🧪 Testing Guide

### Test 1: Create Room

```bash
# 1. Start both servers
cd dormduty-web && npm run dev     # Terminal 1
cd frontend && npm start            # Terminal 2

# 2. Test flow
- Go to http://localhost:3000/auth
- Sign up as new user
- After login, go to /room-setup
- Click "Create New Room"
- Enter name: "Test Dorm 123"
- Click "Create Room"
- Should show success with Room ID
- Should redirect to /home

# 3. Verify
- Go to /profile
- See Room ID displayed
- Click copy button
- Should copy to clipboard
```

### Test 2: Join Room

```bash
# 1. Get Room ID from Test 1

# 2. Test flow
- Open incognito window
- Go to http://localhost:3000/auth
- Sign up as different user
- Go to /room-setup
- Click "Join Existing Room"
- Paste Room ID from Test 1
- Click "Join Room"
- Should show success
- Should redirect to /home

# 3. Verify
- Go to /profile
- See same Room ID as Test 1
- Both users in same room!
```

### Test 3: Copy IDs

```bash
# Test copying User ID
- Go to /profile
- Click copy button next to User ID
- Open text editor
- Paste (Ctrl+V)
- Should see UUID

# Test copying Room ID
- Click copy button next to Room ID
- Paste in text editor
- Should see room ID
- Button should show checkmark briefly
```

---

## 🐛 Troubleshooting

### Issue: "Failed to create room"

**Symptoms**: Error when clicking "Create Room"

**Causes**:
1. Backend not running
2. API endpoint doesn't exist
3. Network error

**Solutions**:
```bash
# Check backend is running
curl http://localhost:3001/api/rooms

# Check backend logs
# Look for POST /api/rooms request

# Restart backend
cd dormduty-web
npm run dev
```

### Issue: "Room not found"

**Symptoms**: Error when joining room

**Causes**:
1. Room ID doesn't exist
2. Typo in room code
3. Room was deleted

**Solutions**:
- Verify Room ID is correct
- Ask roommate to re-share ID
- Create new room instead

### Issue: Room ID not showing

**Symptoms**: Profile shows "No room" after joining

**Causes**:
1. API call failed
2. Context didn't update
3. localStorage not synced

**Solutions**:
```bash
# Check localStorage
# Open Console (F12)
localStorage.getItem('smartdorm_user')
# Should show roomId

# Force refresh
- Logout
- Login again
- Room ID should appear
```

### Issue: Copy button doesn't work

**Symptoms**: Nothing happens when clicking copy

**Causes**:
1. Browser doesn't support clipboard API
2. Page not served over HTTPS (in production)
3. Permissions blocked

**Solutions**:
- Try different browser
- Check browser console for errors
- Manually select and copy text

---

## 🚀 Future Enhancements

### Planned Features

1. **Room Management**:
   - View all members in room
   - Remove members (admin only)
   - Rename room
   - Delete room

2. **Invitations**:
   - Generate shareable invite links
   - QR code for room
   - Email invites

3. **Room Settings**:
   - Custom room names
   - Room profile pictures
   - Room description

4. **Analytics**:
   - See room activity
   - Member contributions
   - Chore completion stats

---

## 📚 Related Documentation

- **Authentication**: See `SUPABASE_AUTH_SETUP.md`
- **API Integration**: See `INTEGRATION_GUIDE.md`
- **Complete Setup**: See `MERGE_COMPLETE.md`
- **Backend APIs**: See `dormduty-web/src/app/api/`

---

## ✅ Summary

The room system provides:
- ✅ Complete room creation workflow
- ✅ Easy room joining with codes
- ✅ Clear display of User ID and Room ID
- ✅ Copy-to-clipboard functionality
- ✅ Profile management
- ✅ Beautiful, intuitive UI
- ✅ Full backend integration
- ✅ Mobile-responsive design

**Users can now**:
1. See their Supabase User ID
2. See their Room ID
3. Create rooms for their dorm
4. Join existing rooms
5. Share room codes
6. Pull real chore data for their room

**Perfect for**:
- Multi-roommate dorms
- Apartment living
- Group houses
- Any shared living space

---

**The room system is complete and ready to use!** 🎉🏠✨
