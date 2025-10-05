# 🎯 Complete Integration Guide - Merging Anan + Ayman's Work

## ✅ Good News!

The Next.js backend (`dormduty-web`) already has `/api/registerUser`, so our implementations are compatible!

---

## 📊 What We Have

### Backend (dormduty-web - Next.js)
```
dormduty-web/src/app/api/
├── registerUser/    ✅ For Anan's auth
├── tasks/           ✅ For Ayman's features
├── leaderboard/     ✅ For Ayman's features
└── laundry/         ✅ For Ayman's features
```

### Frontend (frontend - React)
- **Anan**: Full Supabase auth + session management
- **Ayman**: API client + live pages (Home, Tasks)

---

## 🚀 Integration Steps

### Step 1: Understand Backend Setup

First, check if Next.js backend is configured:

```bash
cd dormduty-web
cat .env.local  # Or .env
```

Should have:
```bash
SUPABASE_URL=https://zoufmhqphhitpkcmckgi.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
DATABASE_URL=your-database-url
```

### Step 2: Merge the Branches

```bash
# Make sure you're on anan-backup
git checkout anan-backup

# Merge main (Ayman's work)
git merge origin/main
```

You'll get conflicts in:
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/pages/Auth.jsx`
- `frontend/src/App.js`

### Step 3: Resolve AuthContext.jsx Conflict

Use this hybrid version that combines both approaches:

```javascript
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";

// Backend API URL
const API_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session) {
        // Load user from localStorage if exists
        const storedUser = localStorage.getItem("smartdorm_user");
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error("Failed to parse stored user");
          }
        }
      }
      
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session) {
        // Register user with backend
        await handleUserRegistration(session.user);
      } else {
        // Clear user data on logout
        setUser(null);
        localStorage.removeItem("smartdorm_user");
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Register or fetch user from backend after Supabase auth
   */
  const handleUserRegistration = async (supabaseUser) => {
    try {
      const response = await fetch(`${API_URL}/api/registerUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: supabaseUser.email,
          userId: supabaseUser.id,
          name: supabaseUser.user_metadata?.full_name || 
                supabaseUser.user_metadata?.name || 
                supabaseUser.email?.split("@")[0] || 
                "Roommate",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store user in format Ayman's code expects
        const userPayload = {
          id: supabaseUser.id,          // Supabase UUID
          roomId: data.roomId || null,   // From backend
          email: supabaseUser.email,
          name: data.name || supabaseUser.user_metadata?.full_name || "Roommate",
        };
        
        setUser(userPayload);
        localStorage.setItem("smartdorm_user", JSON.stringify(userPayload));
        
        console.log("✅ User registered:", userPayload);
      } else {
        console.error("Failed to register user:", await response.text());
      }
    } catch (error) {
      console.error("Error registering user:", error);
    }
  };

  /**
   * Send magic link for passwordless login
   */
  const sendMagicLink = async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: window.location.origin + "/home",
        },
      });

      if (error) throw error;

      return { success: true, message: "Magic link sent! Check your email." };
    } catch (error) {
      console.error("Magic link error:", error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Sign in with email and password
   */
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Sign up with email and password
   */
  const signUp = async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            name: name,
          },
          emailRedirectTo: window.location.origin + "/home",
        },
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("smartdorm_user");
    setUser(null);
    setSession(null);
  }, []);

  /**
   * Update profile (for Ayman's code compatibility)
   */
  const updateProfile = useCallback((partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem("smartdorm_user", JSON.stringify(next));
      return next;
    });
  }, []);

  const value = {
    user,                           // { id, roomId, email, name }
    session,
    login,
    signUp,
    sendMagicLink,
    logout,
    updateProfile,
    isAuthenticated: !!session && !!user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
```

### Step 4: Resolve Auth.jsx Conflict

Use my full auth UI (from anan-backup) - it's better than the temporary manual input:

```bash
# During merge, choose anan-backup version
git checkout --ours frontend/src/pages/Auth.jsx
```

### Step 5: Resolve App.js Conflict

Merge both carefully - keep routing from both versions.

### Step 6: Update Environment Variables

Create `frontend/.env`:

```bash
# Supabase (from Anan)
REACT_APP_SUPABASE_URL=https://zoufmhqphhitpkcmckgi.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdWZtaHFwaGhpdHBrY21ja2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MDAxMzksImV4cCI6MjA3NTE3NjEzOX0.2182xHs0H-HPqTa1X-slGZ3_3V65FlXJE6Gy5AEwfAg

# Next.js Backend API (from Ayman)
REACT_APP_API_BASE_URL=http://localhost:3001

# Gemini AI (from Anan - optional)
REACT_APP_GEMINI_API_KEY=AIzaSyC9Il8RQTErVIHjvCz8c4RoFqnKwDj9X-k
```

---

## 🧪 Testing the Integration

### Terminal 1: Start Next.js Backend

```bash
cd dormduty-web
npm run dev
```

Should run on `http://localhost:3001`

### Terminal 2: Start React Frontend

```bash
cd frontend
npm start
```

Should run on `http://localhost:3000`

### Test Flow

1. **Test Auth**:
   ```
   - Go to http://localhost:3000/auth
   - Try magic link login
   - OR try email/password
   - Should redirect to /home
   ```

2. **Verify User Data**:
   ```
   - Open Console (F12)
   - Type: localStorage.getItem('smartdorm_user')
   - Should see: {"id":"uuid","roomId":"room-id","email":"...","name":"..."}
   ```

3. **Test API Integration**:
   ```
   - Go to /tasks
   - Try creating a task
   - Should work with backend
   - Check Network tab for API calls
   ```

4. **Test Home Page**:
   ```
   - Go to /home
   - Should show leaderboard
   - Should show aura stats
   ```

---

## 🔍 Verification Checklist

- [ ] Frontend compiles without errors
- [ ] Backend runs on port 3001
- [ ] Can log in with magic link
- [ ] Can log in with email/password
- [ ] `user.id` and `user.roomId` are set after login
- [ ] Tasks page loads
- [ ] Can create/update/delete tasks
- [ ] Home page shows leaderboard
- [ ] API calls include Authorization header
- [ ] No console errors
- [ ] `npm run build` succeeds

---

## 📝 Quick Commands

```bash
# 1. Merge branches
git checkout anan-backup
git merge origin/main

# 2. Resolve conflicts (manually or use the guide above)

# 3. Complete the merge
git add .
git commit -m "feat: Integrate Anan's Supabase auth with Ayman's API client and live pages"

# 4. Push
git push origin anan-backup

# 5. Test locally
cd dormduty-web && npm run dev  # Terminal 1
cd frontend && npm start          # Terminal 2
```

---

## 🎉 Expected Result

After successful integration:

✅ **Authentication**: Full Supabase auth (magic link + password)  
✅ **User Management**: Automatic userId/roomId from backend  
✅ **API Integration**: All CRUD operations working  
✅ **Pages**: Home and Tasks with live data  
✅ **No Manual Input**: No need to paste UUIDs manually  

---

## 🚨 If Something Breaks

### Issue: "Cannot resolve conflicts"
**Solution**: Use the AuthContext code I provided above

### Issue: "API calls fail"
**Solution**: 
- Check Next.js backend is running
- Verify REACT_APP_API_BASE_URL points to correct port
- Check Network tab for actual error

### Issue: "User is null after login"
**Solution**:
- Check `/api/registerUser` returns roomId
- Verify localStorage has user data
- Check console for registration errors

### Issue: "Tasks page crashes"
**Solution**:
- Ensure user.id and user.roomId exist
- Check API client is getting correct data
- Verify backend API routes work

---

## 💡 Pro Tips

1. **Test backend first**: Make sure `http://localhost:3001/api/tasks` works
2. **Check Supabase**: Verify users are in Supabase dashboard
3. **Use DevTools**: Network tab shows API calls, Console shows errors
4. **Clear cache**: Sometimes localStorage gets stale - clear it
5. **Read logs**: Both frontend console and backend logs are helpful

---

##  Next Steps After Integration

1. ✅ Test thoroughly
2. ✅ Update README.md with new setup instructions
3. ✅ Create unified .env.example
4. ✅ Deploy to Vercel (both Next.js + React)
5. ✅ Celebrate! 🎉

**You've got this!** 🚀
