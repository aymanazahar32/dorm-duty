# 🔐 Supabase Authentication Setup Guide

## ✅ What Was Implemented

Replaced the faux `AuthContext` with **real Supabase authentication** including:
- ✅ Magic link (passwordless) login
- ✅ Email/password authentication  
- ✅ Session persistence
- ✅ Automatic `/api/registerUser` call post-login
- ✅ Room ID and User ID exposed throughout app
- ✅ Route guards based on Supabase session

---

## 📋 Prerequisites

1. **Supabase Project**: Create one at [supabase.com](https://supabase.com)
2. **Backend API**: Running at `http://localhost:8000` with `/api/registerUser` endpoint
3. **Environment Variables**: Supabase URL and Anon Key

---

## 🚀 Quick Setup

### Step 1: Install Supabase (if not installed)

```bash
cd frontend
npm install @supabase/supabase-js
```

### Step 2: Create `.env` File

Create `.env` in the `frontend` folder:

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API
REACT_APP_API_URL=http://localhost:8000

# Gemini AI (if using AI features)
REACT_APP_GEMINI_API_KEY=your-gemini-key-here
```

### Step 3: Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon public** key → `REACT_APP_SUPABASE_ANON_KEY`

### Step 4: Configure Supabase Email Templates (Optional)

For magic links to work properly:

1. Go to **Authentication** → **Email Templates**
2. Customize the "Magic Link" template
3. Ensure redirect URL is set correctly

### Step 5: Run the App

```bash
npm start
```

Visit: `http://localhost:3000/auth`

---

## 🎯 Features Implemented

### 1. **AuthContext.jsx** - Supabase Integration

**What changed:**
- Replaced fake localStorage auth with Supabase
- Added `session`, `userId`, and `roomId` state
- Integrated with backend `/api/registerUser`

**New Methods:**
```javascript
const {
  // User data
  user,              // Supabase user object
  session,           // Supabase session
  userId,            // Backend user ID
  roomId,            // User's room ID
  
  // Auth status
  isAuthenticated,   // Boolean
  loading,           // Loading state
  
  // Auth methods
  login,             // Email/password login
  signUp,            // Create account
  sendMagicLink,     // Passwordless login
  logout,            // Sign out
  
  // Utility
  updateRoom,        // Update room assignment
} = useAuth();
```

### 2. **Auth.jsx** - Enhanced Login Page

**Features:**
- ✅ Magic link login (passwordless)
- ✅ Email/password login
- ✅ Sign up with name
- ✅ Loading states
- ✅ Error messages
- ✅ Success messages
- ✅ Beautiful UI with Lucide icons

**Three Auth Modes:**
1. **Login** - Traditional email/password
2. **Sign Up** - Create new account
3. **Magic Link** - Passwordless login

### 3. **Route Guards**

Routes are now protected based on **Supabase session**:

```javascript
// Protected routes (require authentication)
/home
/tasks
/laundry
/schedule
/split

// Public route
/auth
```

### 4. **Backend Integration**

After successful Supabase login, the app automatically calls:

```javascript
POST /api/registerUser
{
  "email": "user@example.com",
  "userId": "supabase-user-id",
  "name": "John Doe"
}
```

**Backend should return:**
```javascript
{
  "userId": "backend-user-id",
  "roomId": "room-123",
  "name": "John Doe",
  "email": "user@example.com"
}
```

---

## 📊 Authentication Flow

### Magic Link Flow
```
1. User enters email
   ↓
2. Click "Send Magic Link"
   ↓
3. Supabase sends email
   ↓
4. User clicks link in email
   ↓
5. Redirected to /home
   ↓
6. AuthContext calls /api/registerUser
   ↓
7. Room and User IDs stored
   ↓
8. User authenticated!
```

### Email/Password Flow
```
1. User enters email + password
   ↓
2. Click "Sign In" or "Create Account"
   ↓
3. Supabase authenticates
   ↓
4. AuthContext calls /api/registerUser
   ↓
5. Room and User IDs stored
   ↓
6. Redirect to /home
   ↓
7. User authenticated!
```

---

## 🔧 How It Works

### Session Persistence

Sessions are automatically persisted by Supabase:
- Stored in browser's localStorage
- Survives page refreshes
- Auto-refreshed before expiration
- Multi-tab support

### AuthContext Initialization

```javascript
useEffect(() => {
  // Check existing session
  supabase.auth.getSession()
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      // User logged in
      handleUserRegistration(session.user)
    } else {
      // User logged out
      clearLocalData()
    }
  })
}, [])
```

### Backend Registration

```javascript
const handleUserRegistration = async (supabaseUser) => {
  const response = await fetch('/api/registerUser', {
    method: 'POST',
    body: JSON.stringify({
      email: supabaseUser.email,
      userId: supabaseUser.id,
      name: supabaseUser.user_metadata?.name
    })
  })
  
  const data = await response.json()
  
  // Store room and user IDs
  setRoomId(data.roomId)
  setUserId(data.userId)
  localStorage.setItem('dorm_room_id', data.roomId)
  localStorage.setItem('dorm_user_id', data.userId)
}
```

---

## 🎨 UI Screenshots

### Login Page
```
┌────────────────────────────────────┐
│        [Email Icon]                │
│      Welcome Back                  │
│   Sign in to continue              │
├────────────────────────────────────┤
│                                    │
│  Email Address                     │
│  [📧 your@email.com]               │
│                                    │
│  Password                          │
│  [🔒 ••••••••]                     │
│                                    │
│  [Sign In Button]                  │
│                                    │
│  Or use magic link instead →       │
│                                    │
│  ───── Already have account? ───── │
│                                    │
│  Create an account                 │
└────────────────────────────────────┘
```

### Magic Link Page
```
┌────────────────────────────────────┐
│        [Email Icon]                │
│       Magic Link                   │
│  We'll send you a login link       │
├────────────────────────────────────┤
│                                    │
│  Email Address                     │
│  [📧 your@email.com]               │
│                                    │
│  [Send Magic Link]                 │
│                                    │
│  ✅ Magic link sent!               │
│     Check your email.              │
│                                    │
│  ───── Already have account? ───── │
│                                    │
│  Sign in with password             │
└────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### "Supabase URL not configured"

**Solution:**
```bash
# Add to .env file
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### "Failed to register user"

**Causes:**
- Backend not running
- Wrong API URL
- Backend `/api/registerUser` endpoint missing

**Solution:**
```bash
# Check backend is running
curl http://localhost:8000/api/registerUser

# Update API_URL in .env if different
REACT_APP_API_URL=http://localhost:3000
```

### Magic Link Not Working

**Causes:**
- Email not sent
- Spam folder
- Wrong redirect URL

**Solutions:**
1. Check Supabase logs
2. Check spam/junk folder
3. Verify email templates in Supabase dashboard
4. Ensure redirect URL matches your app URL

### Session Not Persisting

**Solution:**
- Clear browser cache
- Check localStorage not disabled
- Verify Supabase client initialized correctly

---

## 🔒 Security Best Practices

### Environment Variables
✅ Never commit `.env` to git
✅ Use `.env.example` for templates
✅ Different keys for dev/prod

### API Keys
✅ Use `anon` key (not `service_role`)
✅ Enable Row Level Security (RLS) in Supabase
✅ Validate on backend

### Session Management
✅ Auto-refresh enabled
✅ Secure cookie storage
✅ HTTPS in production

---

## 📚 Backend API Requirements

Your backend must implement:

### POST `/api/registerUser`

**Request:**
```json
{
  "email": "user@example.com",
  "userId": "supabase-uuid",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "userId": "backend-user-id",
  "roomId": "room-123",
  "name": "John Doe",
  "email": "user@example.com",
  "createdAt": "2025-01-05T00:00:00Z"
}
```

**Behavior:**
- If user exists: Return existing data
- If new user: Create and return data
- If error: Return 400/500 with error message

---

## 🧪 Testing

### Test Magic Link
```bash
1. Go to /auth
2. Click "Or use magic link instead"
3. Enter email
4. Click "Send Magic Link"
5. Check email
6. Click link
7. Should redirect to /home
```

### Test Email/Password
```bash
1. Go to /auth
2. Click "Create an account"
3. Enter name, email, password
4. Click "Create Account"
5. Check email for verification (if enabled)
6. Login with credentials
7. Should redirect to /home
```

### Test Session Persistence
```bash
1. Login
2. Refresh page
3. Should still be logged in
4. Close tab, reopen
5. Should still be logged in
```

---

## ✅ Checklist

Before deploying:
- [ ] Supabase project created
- [ ] Environment variables set
- [ ] Backend `/api/registerUser` implemented
- [ ] Email templates configured
- [ ] Magic links tested
- [ ] Login/signup tested
- [ ] Session persistence verified
- [ ] Route guards working
- [ ] Room/User IDs exposed
- [ ] Logout working

---

## 🎉 Success!

Authentication is now fully integrated with Supabase!

**Key Features:**
- ✅ Magic link (passwordless)
- ✅ Email/password auth
- ✅ Session persistence
- ✅ Backend integration
- ✅ Route protection
- ✅ Room/User ID tracking

**Next Steps:**
1. Start backend server
2. Configure `.env` file
3. Test authentication
4. Build your features!

Happy coding! 🚀
