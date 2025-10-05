# Pre-Deployment Checklist

Run these checks **before pushing to production branches** to avoid Vercel build failures.

## 🔍 Automated Checks

### 1. TypeScript Type Checking
```bash
cd dormduty-web
npm run build
```
✅ Should complete without errors

### 2. ESLint Validation
```bash
cd dormduty-web
npx next lint
```
✅ Should pass or show only warnings

### 3. Local Build Test
```bash
cd dormduty-web
npm run build
```
✅ Should create `.next` directory successfully

---

## 📋 Manual Checklist

### TypeScript Errors to Watch For:
- [ ] **No `any` types** - Replace with proper types or `unknown`
- [ ] **Unused variables** - Remove or prefix with `_`
- [ ] **Error handling** - All `catch` blocks use `unknown` not `any`
  ```typescript
  catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
  }
  ```

### Next.js 15 Specific Issues:
- [ ] **Dynamic routes use Promise params**
  ```typescript
  export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params; // Must await!
  }
  ```
- [ ] **Metadata exports are properly typed**
- [ ] **Server actions use proper types**

### Environment Variables:
- [ ] All required env vars are in Vercel dashboard
- [ ] `NEXT_PUBLIC_*` prefix for client-side vars
- [ ] No hardcoded secrets in code

### API Routes:
- [ ] CORS headers added to all routes
- [ ] Authentication verified where needed
- [ ] Error responses follow consistent format
- [ ] All async operations properly awaited

### Supabase Integration:
- [ ] RLS policies tested
- [ ] Admin client only used where necessary
- [ ] Database schema matches code expectations

---

## 🚨 Common Build Failures & Fixes

### 1. TypeScript/ESLint `any` Type Error
**Error:** `Unexpected any. Specify a different type.`

**Fix:**
```typescript
// ❌ Bad
catch (err: any) { 
  console.error(err.message);
}

// ✅ Good
catch (err: unknown) {
  const errorMessage = err instanceof Error ? err.message : "Unknown error";
}
```

### 2. Next.js 15 Params Error
**Error:** `Types of property 'params' are incompatible`

**Fix:**
```typescript
// ❌ Bad (Next.js 14 style)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
}

// ✅ Good (Next.js 15 style)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### 3. Missing Environment Variables
**Error:** Build succeeds but runtime errors

**Fix:**
1. Check `.env.local` locally
2. Add all vars to Vercel dashboard: Project Settings → Environment Variables
3. Ensure vars are set for: Production, Preview, Development

### 4. Import/Module Errors
**Error:** `Module not found` or `Cannot find module`

**Fix:**
```bash
cd dormduty-web
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 🧪 Local Testing Commands

### Test Full Build Pipeline
```bash
# 1. Install dependencies
cd dormduty-web
npm install

# 2. Run type checking
npx tsc --noEmit

# 3. Run linter
npx next lint

# 4. Build for production
npm run build

# 5. Test production build locally
npm start
```

### Quick Validation
```bash
cd dormduty-web
npm run build 2>&1 | grep -i "error\|failed"
```
✅ Should return no matches

---

## 📤 Before Pushing to GitHub

1. [ ] Run `npm run build` locally - must succeed
2. [ ] Commit message is descriptive
3. [ ] All console.logs for debugging removed (or kept intentionally)
4. [ ] Test critical paths (login, create room, add task)
5. [ ] Check git diff for accidental changes
6. [ ] Push to branch (not directly to `main`)

---

## 🚀 After Pushing

1. [ ] Monitor Vercel deployment dashboard
2. [ ] Check build logs for warnings
3. [ ] Test deployed URL immediately
4. [ ] Verify environment variables are loaded
5. [ ] Test on mobile device if possible

---

## 📝 Notes

- **Next.js 15** introduced breaking changes - see [migration guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- **Vercel build timeout:** 15 minutes max (rarely an issue)
- **Build cache:** Vercel caches node_modules - occasionally clear in dashboard if issues persist
- **Preview deployments:** Every branch gets its own URL automatically

---

## 🆘 Emergency: Build is Failing

1. **Check recent commits** - what changed?
2. **Roll back if needed:**
   ```bash
   git revert HEAD
   git push origin anan-backend-backup
   ```
3. **Check Vercel logs** - exact error message
4. **Compare with working branch**
5. **Ask for help** - share exact error message

---

**Last Updated:** 2025-10-05  
**Created by:** Cascade AI Assistant
