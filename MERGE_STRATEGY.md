# 🔄 Merge Strategy - Anan + Ayman Integration

## 📊 Current Situation

### Ayman's Changes (main branch)
✅ **Created API Client** (`utils/api.js`)
- Connects to Next.js API routes (`/api/tasks`, `/api/leaderboard`, `/api/laundry`)
- Uses Supabase JWT for authentication
- Comprehensive CRUD operations

✅ **Updated Pages**
- Home.jsx - Live leaderboard/aura stats
- Tasks.jsx - Full task management with optimistic updates
- TaskCard.jsx - Enhanced UI

✅ **Temporary Auth** (until magic link fully wired)
- Manual userId + roomId input
- localStorage persistence
- Simple AuthContext

### Anan's Changes (anan-backup branch)
✅ **Full Supabase Authentication**
- Real magic link (passwordless) login
- Email/password authentication
- Session persistence
- Backend `/api/registerUser` integration
- Automatic userId/roomId tracking

✅ **Mock Express Backend**
- Testing server on port 8000
- User registration endpoint

## 🎯 Integration Strategy

### Goal
Combine Ayman's API client + live pages with Anan's full Supabase auth.

### Approach
1. ✅ Keep Ayman's API client and page updates (main feature work)
2. ✅ Replace his temporary auth with full Supabase implementation
3. ✅ Update AuthContext to provide userId/roomId for API calls
4. ✅ Point API_BASE_URL to Next.js backend (not Express)
5. ✅ Test integration

## 📝 Step-by-Step Merge Plan

### Step 1: Merge main into anan-backup
```bash
git checkout anan-backup
git merge origin/main
```

### Step 2: Resolve Conflicts

#### A. `AuthContext.jsx` - Use hybrid approach
**Keep**:
- Ayman's API structure (user object with id, roomId, email, name)
- My Supabase auth implementation
- Session management
- Auto userId/roomId from Supabase

**Result**: Full Supabase auth that provides data in Ayman's expected format

#### B. `Auth.jsx` - Use my version
**Keep**:
- My full auth UI with magic link
- Remove manual userId/roomId input
- Supabase will provide these automatically

#### C. `App.js` - Merge both
**Keep**:
- My ProtectedRoute logic
- Ayman's route structure if different

### Step 3: Update Configuration

#### A. Environment Variables
Update `.env` to include:
```bash
# Supabase (from Anan)
REACT_APP_SUPABASE_URL=https://zoufmhqphhitpkcmckgi.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...

# Next.js Backend API (from Ayman)
REACT_APP_API_BASE_URL=http://localhost:3001

# Gemini (from Anan)
REACT_APP_GEMINI_API_KEY=AIzaSyC...
```

**Note**: Change from Express (port 8000) to Next.js backend

#### B. Update api.js if needed
Check if it properly uses Supabase tokens

### Step 4: Test Integration

#### Test 1: Authentication
1. Start frontend: `npm start`
2. Go to `/auth`
3. Try magic link login
4. Verify userId and roomId are set

#### Test 2: API Calls
1. After login, go to `/tasks`
2. Try creating a task
3. Verify API client uses correct userId/roomId
4. Check authorization header has Supabase JWT

#### Test 3: Pages
1. Check Home page shows leaderboard
2. Check Tasks page works
3. Verify all CRUD operations

## 🔧 Key Integration Points

### AuthContext Must Provide:
```javascript
{
  user: {
    id: "supabase-uuid",      // From Supabase auth
    roomId: "room-123",       // From backend registration
    email: "user@email.com",
    name: "User Name"
  },
  isAuthenticated: true,
  login: fn,
  logout: fn,
  updateProfile: fn (if Ayman uses it)
}
```

### API Client Expects:
- `user.id` for userId parameter
- `user.roomId` for roomId parameter  
- Supabase JWT in Authorization header
- API_BASE_URL pointing to Next.js backend

## ⚠️ Potential Issues

### Issue 1: Backend Mismatch
**Problem**: My code expects Express backend, Ayman expects Next.js
**Solution**: Update REACT_APP_API_BASE_URL to Next.js backend URL

### Issue 2: User Object Structure
**Problem**: Different user object shapes
**Solution**: Ensure AuthContext returns user with { id, roomId, email, name }

### Issue 3: No Backend `/api/registerUser`
**Problem**: My auth calls this, but it's not in Next.js
**Solution**: Either add it to Next.js or remove the call and use Supabase data directly

## ✅ Verification Checklist

After merge:
- [ ] Code compiles without errors
- [ ] Auth flow works (magic link + password)
- [ ] userId and roomId available in context
- [ ] API client makes successful calls
- [ ] Home page shows leaderboard
- [ ] Tasks CRUD operations work
- [ ] No console errors
- [ ] Build succeeds (`npm run build`)

## 🚀 Next Steps After Merge

1. **Test thoroughly** with Next.js backend running
2. **Update documentation** to reflect integration
3. **Create unified .env.example**
4. **Deploy to Vercel** (both frontend + backend)
5. **Create PR** if needed

## 📞 Questions to Resolve

1. **Where is the Next.js backend?**
   - Is it in `dormduty-web` folder?
   - What port does it run on?
   - Does it have the API routes Ayman mentioned?

2. **Backend `/api/registerUser` endpoint**
   - Does Next.js backend have this?
   - Or should we remove it from AuthContext?

3. **Room Assignment**
   - How are users assigned to rooms?
   - Is it manual or automatic?

## 💡 Recommendation

**Merge in this order:**
1. First, understand where Next.js backend is
2. Start Next.js backend
3. Merge the branches
4. Resolve conflicts favoring Ayman's API work + my auth
5. Test end-to-end
6. Document the complete setup

**Priority**: Get Ayman's API integration working with proper auth!
