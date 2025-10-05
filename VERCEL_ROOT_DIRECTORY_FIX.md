# Fix: Change Vercel Root Directory to Frontend

## Problem
Vercel is deploying `dormduty-web` (Next.js with only API routes) instead of `frontend` (your actual React app).

## Solution: Change Root Directory in Vercel Dashboard

### Step-by-Step Instructions:

1. **Go to Vercel Dashboard**
   - Open: https://vercel.com/dashboard
   - Click on your **dorm-duty** project

2. **Navigate to Settings**
   - At the top of the page, click the **"Settings"** tab
   - (It's next to Deployments, Analytics, etc.)

3. **Find Root Directory Setting**
   - In the left sidebar, click **"General"** (should be already selected)
   - Scroll down to the **"Root Directory"** section
   - You'll see a text input with a folder icon

4. **Change the Directory**
   - Click the **"Edit"** button next to Root Directory
   - In the input field, type: **`frontend`**
   - Click **"Save"**

5. **Redeploy**
   - Go back to the **"Deployments"** tab (at the top)
   - Find your latest deployment (the one showing the Next.js page)
   - Click the **"⋯"** (three dots) menu on the right
   - Click **"Redeploy"**
   - Confirm by clicking **"Redeploy"** again

6. **Monitor Build**
   - Wait 2-3 minutes for the build to complete
   - Once it shows "Ready", click "Visit" to see your site

---

## What This Does

- **Before:** Vercel builds from root → finds `dormduty-web` → deploys Next.js default page
- **After:** Vercel builds from `frontend/` → finds your React app → deploys your actual app

---

## Expected Build Output

Once changed, you should see:
```
> Build Command: npm run build
> Root Directory: frontend
> Framework: Create React App
> Output Directory: build
```

The deployed site will now show:
- ✅ Login/Auth page
- ✅ Home dashboard
- ✅ Tasks, Laundry, Split, Schedule pages
- ✅ Profile page

Instead of:
- ❌ Next.js default landing page

---

## Alternative: If Settings Don't Show Root Directory

If you don't see the "Root Directory" option:

1. Go to **Settings** → **General**
2. Look for **"Build & Development Settings"**
3. Click **"Override"** or **"Edit"**
4. Set:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Create React App`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
5. Click **"Save"**

---

## Verification

After redeployment, your URL should show:
- **Working:** Your login page with email/password inputs
- **Not Working:** Next.js logo and "Get started by editing" text

---

## Need Help?

If you still see the Next.js page after changing settings:
1. Clear the build cache: Settings → General → Scroll to bottom → "Clear Build Cache"
2. Redeploy again
3. Share a screenshot if issues persist

---

**Created:** 2025-10-05 10:45 CST  
**Status:** Awaiting Vercel dashboard configuration
