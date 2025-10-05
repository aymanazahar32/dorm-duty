# Add Environment Variables to Vercel for React App

## Problem
Your React app is deployed but showing "supabaseUrl is required" error because environment variables are missing.

## Solution: Add Environment Variables in Vercel

### Step 1: Go to Environment Variables Settings
1. Open **Vercel Dashboard**: https://vercel.com/dashboard
2. Click on your **dorm-duty** project
3. Click **"Settings"** tab (at the top)
4. In the left sidebar, click **"Environment Variables"**

### Step 2: Add These Variables

Add the following environment variables (click "Add New" for each):

#### Required Variables:

**1. REACT_APP_SUPABASE_URL**
- **Name:** `REACT_APP_SUPABASE_URL`
- **Value:** Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- **Environments:** Check all three: ✅ Production ✅ Preview ✅ Development
- Click "Save"

**2. REACT_APP_SUPABASE_ANON_KEY**
- **Name:** `REACT_APP_SUPABASE_ANON_KEY`
- **Value:** Your Supabase anon/public key
- **Environments:** Check all three: ✅ Production ✅ Preview ✅ Development
- Click "Save"

#### Optional Variables:

**3. REACT_APP_GEMINI_API_KEY** (for AI features)
- **Name:** `REACT_APP_GEMINI_API_KEY`
- **Value:** Your Google Gemini API key
- **Environments:** Check all three: ✅ Production ✅ Preview ✅ Development
- Click "Save"

---

## Where to Find Your Supabase Values

### Option 1: From Your Local .env File
Check your local file: `frontend/.env`
- Copy the values after `REACT_APP_SUPABASE_URL=`
- Copy the values after `REACT_APP_SUPABASE_ANON_KEY=`

### Option 2: From Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your **dorm-duty** project
3. Click **Settings** (gear icon in left sidebar)
4. Click **API** in the left menu
5. Copy:
   - **URL** → Use for `REACT_APP_SUPABASE_URL`
   - **anon public** key → Use for `REACT_APP_SUPABASE_ANON_KEY`

---

## Step 3: Redeploy

After adding all variables:

1. Go back to **Deployments** tab
2. Find your latest deployment
3. Click the **"⋯"** (three dots) menu
4. Click **"Redeploy"**
5. Confirm by clicking **"Redeploy"** again

**Important:** The new build will include the environment variables!

---

## Verification

After redeployment completes:

1. Visit your deployed URL
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. You should NOT see "supabaseUrl is required" error
5. The login page should load properly

---

## Quick Reference: Environment Variables Format

```bash
# In Vercel Dashboard, add these:
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
REACT_APP_GEMINI_API_KEY=AIzaSyxxxxx (optional)
```

**Note:** 
- ✅ Use `REACT_APP_` prefix (for Create React App)
- ❌ NOT `NEXT_PUBLIC_` prefix (that's for Next.js only)

---

## Troubleshooting

### Still seeing "supabaseUrl is required"?
- Make sure you clicked "Save" for each variable
- Make sure all three environments are checked
- Wait for redeploy to complete (2-3 minutes)
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

### Variables not loading?
- Check variable names are spelled exactly: `REACT_APP_SUPABASE_URL` (case-sensitive)
- No spaces in variable names
- Variables must start with `REACT_APP_` for Create React App

---

**Created:** 2025-10-05 10:52 CST  
**Status:** Awaiting environment variables configuration in Vercel
