# Database Health Check Results

**Date:** 2025-12-15  
**Environment:** Pending Production Check  
**Status:** Ready to Run

---

## How to Run

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor
4. Copy and paste contents from `health_check.sql`
5. Run each section and document results below

---

## Results (To Be Filled In)

### 1. Tables Without RLS Enabled
```
-- Run query 1 and paste results here
```
**Status:** ⏳ Pending

---

### 2. Tables With Zero Policies
```
-- Run query 2 and paste results here
```
**Status:** ⏳ Pending

---

### 3. Policies Referencing user_metadata (Anti-pattern)
```
-- Run query 3 and paste results here
```
**Expected:** No results (all policies should use profiles table)  
**Status:** ⏳ Pending

---

### 4. Notes Table Schema
```
-- Run query 4 and paste results here
```
**Expected columns:**
- id, content, created_at, updated_at
- user_id, created_by
- title, owner_role, created_for_role
- is_shared, is_collaborative
- category, tags, is_pinned

**Status:** ⏳ Pending

---

### 5. Quick Links Table Schema
```
-- Run query 5 and paste results here
```
**Expected columns:**
- id, name (NOT title), url, description
- category, icon, is_favorite, click_count
- created_by, created_at, updated_at

**Status:** ⏳ Pending

---

### 6. Profiles Table Schema
```
-- Run query 6 and paste results here
```
**Expected columns:**
- id (PK), user_id (references auth.users)
- email, full_name, display_name
- role, org_id
- Other profile fields...

**Status:** ⏳ Pending

---

### 7. Missing Foreign Key Indexes
```
-- Run query 7 and paste results here
```
**Expected:** Empty or minimal results  
**Status:** ⏳ Pending

---

### 8. Notes-Related Tables Exist
```
-- Run query 8 and paste results here
```
**Required tables:**
- notes ✅
- note_shares ✅
- note_notifications ✅

**Status:** ⏳ Pending

---

### 9. RLS Policies on Notes Table
```
-- Run query 9 and paste results here
```
**Expected policies after migration:**
- notes_select_own
- notes_select_shared
- notes_select_role_shared
- notes_insert
- notes_update_own
- notes_update_collaborative
- notes_delete

**Status:** ⏳ Pending

---

### 10. Outlook Config Table Exists
```
-- Run query 10 and paste results here
```
**Status:** ⏳ Pending

---

### 11. Row Counts in Key Tables
```
-- Run query 11 and paste results here
```
**Status:** ⏳ Pending

---

### 12. Required Functions Exist
```
-- Run query 12 and paste results here
```
**Required functions:**
- share_note_with_role
- handle_new_user

**Status:** ⏳ Pending

---

## Summary

| Check | Status | Issues Found |
|-------|--------|--------------|
| RLS Enabled | ⏳ | - |
| Policies Exist | ⏳ | - |
| No user_metadata | ⏳ | - |
| Notes Schema | ⏳ | - |
| Quick Links Schema | ⏳ | - |
| Profiles Schema | ⏳ | - |
| FK Indexes | ⏳ | - |
| Required Tables | ⏳ | - |
| Notes RLS Policies | ⏳ | - |
| Required Functions | ⏳ | - |

---

## Action Items

After running health checks, document any issues found here and create corresponding migration files to fix them.

### Issues Found
1. (To be filled after running checks)

### Migrations Created
1. `20251215000001_fix_notes_500_errors.sql` - Fixes notes RLS and schema
2. `20251215000002_fix_quick_links_400_error.sql` - Fixes quick_links schema

