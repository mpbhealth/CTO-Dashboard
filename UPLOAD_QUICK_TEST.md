# 🚀 Quick Upload Test - 2 Minutes

## ✅ Fast Verification of Document Upload

Run this quick test to verify everything works:

---

## Test 1: CEO Upload (30 seconds)

```
1. Login as CEO
2. Go to: /ceod/files
3. Click "Choose File"
4. Select any file (< 5MB recommended)
5. Click "Upload" (pink button)
6. ✅ Should see file in grid immediately
```

**Expected:**
- Status changes to "Uploading..."
- File appears in grid
- Can click "Download" to verify

---

## Test 2: CTO Upload (30 seconds)

```
1. Login as CTO (or switch role)
2. Go to: /ctod/files
3. Click "Choose File"
4. Select different file
5. Click "Upload" (blue button)
6. ✅ Should see: "✅ File uploaded successfully!"
```

**Expected:**
- See status: "⏳ Uploading file to CTO workspace..."
- Success message with checkmark
- File appears in grid with blue theme
- Shows "Your Files (1)"

---

## Test 3: Workspace Isolation (30 seconds)

```
1. As CEO at /ceod/files:
   ✅ Should see only CEO files

2. As CTO at /ctod/files:
   ✅ Should see only CTO files

3. Files should NOT be visible across dashboards
```

**Expected:**
- CEO sees files uploaded by CEO only
- CTO sees files uploaded by CTO only
- Complete workspace isolation maintained

---

## Test 4: Download & Delete (30 seconds)

```
1. Click "Download" on any file
   ✅ File should open in new tab or download

2. Click trash icon on a file
   ✅ Confirmation dialog appears

3. Confirm deletion
   ✅ File removed from grid immediately
```

**Expected:**
- Download generates signed URL and opens file
- Delete shows confirmation
- File disappears after deletion

---

## ❌ What Should NOT Happen

**These are errors - report if seen:**

- ❌ Upload button stays disabled after file selection
- ❌ Console error: "row-level security policy"
- ❌ Console error: "Failed to fetch"
- ❌ File uploaded but doesn't appear in grid
- ❌ Download button does nothing
- ❌ CEO can see CTO files (or vice versa)
- ❌ Upload succeeds but shows error message

---

## 🐛 Quick Troubleshooting

**Upload button disabled?**
→ Refresh page, ensure logged in

**"Row-level security" error?**
→ Check migration applied: `fix_rls_policies_corrected`

**File doesn't appear?**
→ Refresh page manually, check console logs

**Download fails?**
→ Check storage bucket exists and has policies

---

## ✅ Success Checklist

After running all 4 tests:

- [ ] CEO uploaded file successfully
- [ ] CTO uploaded file successfully
- [ ] Files are isolated by workspace
- [ ] Download works
- [ ] Delete works
- [ ] No console errors
- [ ] UI themes correct (pink CEO, blue CTO)

---

## 📊 Console Check

**Good (no action needed):**
```
[MPB Health] Production build initialized
[MPB Health] Supabase configured: true
[CEOFiles] Upload successful
[CTOFiles] Upload successful
```

**Bad (needs attention):**
```
[PRODUCTION ERROR] Error uploading file
[ERROR] Auth timeout
Failed to load resource: 500
```

---

## 🎯 2-Minute Test Script

```bash
# Exactly what to do:

1. Open browser to dashboard
2. Login as CEO
3. Navigate to Files section
4. Upload test file (test-ceo.pdf)
5. Verify appears in grid
6. Download it
7. Switch to CTO role (or logout/login as CTO)
8. Navigate to Files section
9. Should NOT see CEO's file
10. Upload test file (test-cto.pdf)
11. Verify appears with blue theme
12. Download it
13. Delete both test files
14. Done! ✅
```

**Time:** ~2 minutes
**Result:** Know immediately if uploads work

---

## 🚨 Stop & Report If You See

**Critical Issues:**
- Upload fails every time
- Console shows security policy errors
- Files never appear after upload
- Can see other role's files

**Minor Issues:**
- UI theme incorrect
- Status messages missing
- Slow upload (> 10 seconds for small file)

---

**Quick Test Complete?**
✅ All tests passed = System working perfectly!
❌ Any test failed = Check `DOCUMENT_UPLOAD_TESTING_GUIDE.md`

---

**Last Updated:** 2025-11-19
**Status:** ✅ Ready for testing
