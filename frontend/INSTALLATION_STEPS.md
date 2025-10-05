# 🚀 Installation Steps - Anan Branch

## Quick Setup (5 minutes)

### Step 1: Install Supabase Client

```bash
cd frontend
npm install @supabase/supabase-js
```

### Step 2: Create Environment File

Create `.env` in `frontend/` folder:

```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_API_URL=http://localhost:8000
```

### Step 3: Get Supabase Credentials

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (or create one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon public key** → `REACT_APP_SUPABASE_ANON_KEY`

### Step 4: Run the App

```bash
npm start
```

### Step 5: Test Authentication

1. Visit `http://localhost:3000/auth`
2. Try magic link or email/password
3. Should redirect to `/home` on success

---

## Full Command Sequence

```bash
# 1. Install dependencies
cd frontend
npm install @supabase/supabase-js

# 2. Create .env file
cat > .env << EOL
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GEMINI_API_KEY=your-gemini-key-here
EOL

# 3. Start the app
npm start
```

---

## ✅ Verification Checklist

After setup:
- [ ] App starts without errors
- [ ] Can navigate to `/auth`
- [ ] Auth page displays correctly
- [ ] No console errors
- [ ] Supabase client initialized

---

## 🐛 Common Issues

### "Cannot find module '@supabase/supabase-js'"

**Solution:**
```bash
npm install @supabase/supabase-js
```

### "REACT_APP_SUPABASE_URL is undefined"

**Solution:**
- Create `.env` file in `frontend/` folder
- Add required variables
- Restart `npm start`

### Backend not responding

**Solution:**
- Ensure backend is running on port 8000
- Update `REACT_APP_API_URL` if different
- Check backend has `/api/registerUser` endpoint

---

## 📦 Package Info

**@supabase/supabase-js**
- Latest version: ^2.x
- Size: ~100KB
- No additional dependencies needed
- Works with React out of the box

---

## ✨ You're All Set!

Once installed, the auth system is ready to use!

**Next:** Test authentication flows
**Then:** Start building features with `userId` and `roomId`
