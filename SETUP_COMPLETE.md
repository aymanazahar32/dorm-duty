# ✅ Complete Setup Guide - DormDuty with Supabase Auth

## 🎉 What's Been Set Up

### ✅ 1. Frontend `.env` File Created

Location: `frontend/.env`

Contains:
```bash
REACT_APP_SUPABASE_URL=https://zoufmhqphhitpkcmckgi.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GEMINI_API_KEY=AIzaSyC9Il8RQTErVIHjvCz8c4RoFqnKwDj9X-k
```

### ✅ 2. Mock Backend Server Created

Location: `backend-mock/`

Provides all necessary API endpoints for testing:
- `POST /api/registerUser` - User registration
- `GET /api/user/:userId` - Get user
- `GET /api/room/:roomId` - Get room
- `PUT /api/user/:userId/room` - Update room
- `GET /health` - Health check

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Backend Dependencies

```bash
cd backend-mock
npm install
```

### Step 2: Start Backend Server

```bash
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║   🚀 DormDuty Mock Backend Server     ║
║   Running on: http://localhost:8000   ║
╚════════════════════════════════════════╝
```

### Step 3: Start Frontend (New Terminal)

```bash
cd frontend
npm start
```

---

## 🧪 Test the Setup

### 1. Test Backend is Running

```bash
curl http://localhost:8000/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-01-05T...",
  "users": 0,
  "rooms": 2
}
```

### 2. Test Frontend Auth

1. Visit `http://localhost:3000/auth`
2. You should see the beautiful auth page
3. Try these auth methods:

#### **Option A: Magic Link**
```
1. Click "Or use magic link instead"
2. Enter your email
3. Click "Send Magic Link"
4. Check your email
5. Click the link
6. Should redirect to /home
```

#### **Option B: Email/Password Signup**
```
1. Click "Create an account"
2. Enter name, email, password
3. Click "Create Account"
4. Check email for verification
5. Should be logged in
```

#### **Option C: Email/Password Login**
```
1. Enter email and password
2. Click "Sign In"
3. Should redirect to /home
```

### 3. Verify Backend Integration

After logging in, check browser console (F12):
- Should see: `✅ User registered/fetched: {...}`
- Backend should log: `✅ New user registered: {...}`

---

## 📊 Architecture Overview

```
Frontend (React)
    ↓
Supabase Auth
    ↓
AuthContext
    ↓
POST /api/registerUser
    ↓
Backend (Express)
    ↓
Return roomId & userId
    ↓
Store in Context + localStorage
    ↓
User authenticated!
```

---

## 🔧 Configuration

### Frontend Environment Variables

File: `frontend/.env`

```bash
# Your Supabase project
REACT_APP_SUPABASE_URL=https://zoufmhqphhitpkcmckgi.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend API (change if using different port)
REACT_APP_API_URL=http://localhost:8000

# AI Features (optional)
REACT_APP_GEMINI_API_KEY=AIzaSyC9Il8RQTErVIHjvCz8c4RoFqnKwDj9X-k
```

### Backend Configuration

File: `backend-mock/server.js`

```javascript
const PORT = 8000; // Change if needed
```

---

## 🎯 What Each Component Does

### Frontend (`frontend/`)

**AuthContext** (`src/context/AuthContext.jsx`):
- Manages Supabase authentication
- Handles session persistence
- Calls backend `/api/registerUser`
- Exposes `user`, `session`, `userId`, `roomId`

**Auth Page** (`src/pages/Auth.jsx`):
- Beautiful login/signup UI
- Three auth modes (Login, Signup, Magic Link)
- Loading states and error handling

**Protected Routes** (`src/App.js`):
- Guards all app routes
- Redirects to `/auth` if not authenticated

### Backend (`backend-mock/`)

**Express Server** (`server.js`):
- RESTful API endpoints
- In-memory storage (for testing)
- CORS enabled
- User and room management

---

## 📝 Common Tasks

### Create New Room

```bash
curl -X POST http://localhost:8000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"name":"Room 303"}'
```

### Assign User to Room

```bash
curl -X PUT http://localhost:8000/api/user/USER_ID/room \
  -H "Content-Type: application/json" \
  -d '{"roomId":"room-2"}'
```

### List All Rooms

```bash
curl http://localhost:8000/api/rooms
```

---

## 🐛 Troubleshooting

### Frontend Shows "API Key Not Configured"

**Solution:**
```bash
# Check .env file exists
cd frontend
ls .env

# If missing, recreate it with the provided keys
# See INSTALLATION_STEPS.md
```

### Backend Not Responding

**Solution:**
```bash
# Check if backend is running
curl http://localhost:8000/health

# If not running:
cd backend-mock
npm install
npm start
```

### "Cannot find module 'express'"

**Solution:**
```bash
cd backend-mock
npm install
```

### Supabase Magic Link Not Working

**Possible Issues:**
1. Check spam folder
2. Verify email in Supabase dashboard
3. Check Supabase email templates configured
4. Ensure redirect URL is correct

**Solution:**
- Go to Supabase Dashboard → Authentication → Email Templates
- Verify "Magic Link" template is enabled
- Check redirect URL: `{{ .ConfirmationURL }}`

### Session Not Persisting

**Solution:**
- Clear browser cache
- Check localStorage is enabled
- Restart frontend server
- Try incognito mode

---

## 📚 File Structure

```
dorm-duty/
├── frontend/
│   ├── .env                         ✅ Created
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx     ✅ Updated
│   │   ├── pages/
│   │   │   └── Auth.jsx            ✅ Updated
│   │   └── App.js                  ✅ Updated
│   └── package.json
│
├── backend-mock/                    ✅ Created
│   ├── server.js                   ✅ Created
│   ├── package.json                ✅ Created
│   └── README.md                   ✅ Created
│
└── Documentation/
    ├── SUPABASE_AUTH_SETUP.md
    ├── ANAN_BRANCH_COMPLETE.md
    ├── INSTALLATION_STEPS.md
    └── SETUP_COMPLETE.md           ← You are here
```

---

## ✅ Verification Checklist

Before you start developing:

### Backend
- [ ] `cd backend-mock`
- [ ] `npm install` completed
- [ ] `npm start` running
- [ ] `curl http://localhost:8000/health` works

### Frontend
- [ ] `cd frontend`
- [ ] `.env` file exists with correct keys
- [ ] `npm start` running
- [ ] Can access `http://localhost:3000/auth`

### Authentication
- [ ] Auth page displays correctly
- [ ] Can send magic link (check email)
- [ ] Can sign up with email/password
- [ ] Can log in with credentials
- [ ] Session persists on refresh
- [ ] Logout works correctly

### Integration
- [ ] Backend receives `/api/registerUser` calls
- [ ] `userId` and `roomId` stored in frontend
- [ ] Browser console shows no errors
- [ ] Can access protected routes after login

---

## 🎉 You're All Set!

Everything is configured and ready to use:

1. ✅ **Frontend** - React app with Supabase auth
2. ✅ **Backend** - Express API with user/room management
3. ✅ **Environment** - All variables configured
4. ✅ **Authentication** - 3 auth methods working
5. ✅ **Integration** - Frontend ↔ Backend connected

---

## 🚀 Next Steps

### For Development

**Anan (Auth - You)**:
- ✅ Auth complete
- ✅ Session management working
- ✅ Backend integration done
- ✅ Ready to merge or continue

**Ayman (Frontend Wiring)**:
- Use `useAuth()` hook in components
- Access `userId` and `roomId` from context
- Make API calls to backend
- Wire up Tasks, Laundry, Split pages

### Running Both Servers

**Terminal 1 (Backend):**
```bash
cd backend-mock
npm start
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```

---

## 🔒 Security Notes

### Development (Current)
- Using mock backend (in-memory storage)
- Supabase anon key exposed (safe for client-side)
- API_URL points to localhost

### Production (Future)
- Replace mock backend with real database
- Use Supabase Row Level Security (RLS)
- Add backend authentication middleware
- Use environment-specific keys
- Enable HTTPS

---

## 📞 Support

### Documentation
- `SUPABASE_AUTH_SETUP.md` - Complete auth guide
- `ANAN_BRANCH_COMPLETE.md` - Implementation details
- `backend-mock/README.md` - Backend API docs

### Testing
- Backend health: `http://localhost:8000/health`
- Frontend auth: `http://localhost:3000/auth`

---

## 🎊 Success!

Your DormDuty app now has:
- ✅ Real Supabase authentication
- ✅ Magic link (passwordless) login
- ✅ Session persistence
- ✅ Backend API integration
- ✅ User and room tracking
- ✅ Protected routes

**Start developing!** 🚀🔐✨
