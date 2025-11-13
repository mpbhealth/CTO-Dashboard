# White Screen Diagnostic Quick Reference

## 🚨 Quick Fix Commands

Open browser console (F12) and run:

```javascript
// Run full diagnostics
diagnoseWhiteScreen()

// Clear everything and reload
clearAllCaches()

// Clear only auth data
clearAuthCache()
```

## 📊 Diagnostic Dashboard

**URL**: `/diagnostics/system`

Access a visual dashboard with:
- Real-time health checks
- Status indicators
- Quick action buttons
- Detailed error reports

## 🔍 Common Issues & Fixes

| Issue | Symptom | Quick Fix |
|-------|---------|-----------|
| **Login Loop** | Redirects back to login | `clearAuthCache()` |
| **Stale Cache** | Old data showing | `clearAllCaches()` |
| **White Screen** | Blank page | `diagnoseWhiteScreen()` then check failed items |
| **Profile Missing** | Cannot load dashboard | Check database for profile with correct role |
| **Env Vars Missing** | Connection errors | Verify `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |

## 📋 Diagnostic Categories

1. **Environment Configuration** - Check env vars
2. **Supabase Connection** - Test database access
3. **Authentication** - Verify session and profile
4. **Browser APIs** - Confirm API availability
5. **Cache and Storage** - Analyze cache usage
6. **DOM and Assets** - Verify page loading
7. **Routing** - Check navigation state

## ✅ Interpreting Results

- **✅ Green (Pass)**: Working correctly
- **⚠️ Yellow (Warning)**: May cause issues
- **❌ Red (Fail)**: Critical problem - fix this

## 🛠️ Troubleshooting Steps

### Step 1: Run Diagnostics
```javascript
diagnoseWhiteScreen()
```

### Step 2: Identify Failed Checks
Look for ❌ in the console output

### Step 3: Apply Fix Based on Category

**Environment Issues** → Check `.env` file
**Auth Issues** → Clear cache or check database
**Cache Issues** → Run `clearAllCaches()`
**Database Issues** → Check Supabase dashboard

### Step 4: Verify Fix
Run diagnostics again to confirm all checks pass

## 🌐 Browser-Specific

### Chrome/Edge
- Incognito mode: Ctrl+Shift+N
- Clear data: F12 → Application → Clear Storage

### Firefox
- Private mode: Ctrl+Shift+P
- Clear data: Ctrl+Shift+Del

### Safari
- Private mode: Cmd+Shift+N
- Clear data: Safari → Clear History

## 📞 When to Escalate

Contact support if:
- All diagnostics pass but still have white screen
- Supabase connection fails repeatedly
- Authentication errors persist after clearing cache
- Multiple failed checks with no clear solution

## 📚 Full Documentation

- **Detailed Guide**: `WHITE_SCREEN_TROUBLESHOOTING.md`
- **Implementation**: `WHITE_SCREEN_FIX_SUMMARY.md`
- **Code**: `src/lib/whiteScreenDiagnostics.ts`

## 💡 Pro Tips

1. **Test in incognito first** - Rules out cache issues
2. **Check console always** - Errors show up there first
3. **Verify Supabase status** - Project may be paused
4. **Clear cache after updates** - Prevents stale code
5. **Use diagnostic dashboard** - Visual and easier to share

## 🔗 Quick Links

- Diagnostic Dashboard: `/diagnostics/system`
- Auth Diagnostics: `/diagnostics`
- Login Page: `/login`
- CEO Dashboard: `/ceod/home`
- CTO Dashboard: `/ctod/home`
