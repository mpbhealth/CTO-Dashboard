# 📱 Where to Find Microsoft Teams Integration

## Quick Navigation Guide

### **1. Go to Assignments Page**

In your dashboard sidebar, click on:
```
📋 Assignments
```

### **2. Look for Action Buttons on Each Assignment Card**

On **EVERY assignment card**, you'll see 5 action buttons in the top-right corner:

#### Kanban View:
```
┌─────────────────────────────────────────┐
│ Assignment Title           [📱][✉️][📋][✏️][🗑️] │
│ Description here...                     │
│ 🏢 Project Name                        │
│ 📅 Due: Oct 20, 2025                   │
└─────────────────────────────────────────┘
```

#### List View:
```
┌────────────────────────────────────────────────────────────────┐
│ ● Assignment Title                      [Status] [📱][✉️][📋][✏️][🗑️] │
│   Description text...                                          │
│   🏢 Project  📅 Due Date  👤 Employee                         │
└────────────────────────────────────────────────────────────────┘
```

### **3. Button Functions**

| Icon | Color | Function | What It Does |
|------|-------|----------|--------------|
| 📱 MessageSquare | Purple | **Microsoft Teams** | Sends assignment via Teams message |
| ✉️ Mail | Blue | **Email** | Opens email client with assignment details |
| 📋 Copy | Green | **Copy to Clipboard** | Copies assignment text to clipboard |
| ✏️ Edit | Indigo | **Edit** | Opens edit modal |
| 🗑️ Trash | Red | **Delete** | Deletes assignment |

### **4. How to Test**

#### Option A: Create an Assignment Manually
1. Click **"+ New Assignment"** button (top right)
2. Fill in the form:
   - Title: "Test Teams Integration"
   - Description: "Testing the communication features"
   - Status: To Do
   - Due Date: Any future date
3. Click **Create Assignment**
4. You'll now see the assignment card with all 5 buttons!

#### Option B: Use SQL Script
1. Open Supabase SQL Editor
2. Run the script from `test-assignment.sql`
3. Refresh the Assignments page
4. You'll see the test assignment with all buttons

### **5. Using the Teams Integration**

#### To Send via Microsoft Teams:
1. **Hover** over the assignment card
2. **Click** the **purple 📱 button** (MessageSquare icon)
3. A loading spinner appears
4. Success notification shows: "Assignment sent via Microsoft Teams to [employee name]!"

#### To Send via Email:
1. **Hover** over the assignment card
2. **Click** the **blue ✉️ button** (Mail icon)
3. Your email client opens with pre-filled content
4. Review and click Send

#### To Copy to Clipboard:
1. **Click** the **green 📋 button**
2. Success notification shows: "Assignment details copied to clipboard!"
3. Paste anywhere (Ctrl+V / Cmd+V)

---

## 🎨 Visual Button Reference

### What the Buttons Look Like:

**Kanban View (Compact):**
- Small square buttons with icons only
- Hover to see tooltips
- Buttons stack horizontally

**List View (Expanded):**
- Slightly larger buttons
- More spacing between buttons
- Easier to click on larger screens

### Hover Effects:
- **Teams Button**: Purple background on hover
- **Email Button**: Blue background on hover
- **Copy Button**: Green background on hover
- **Edit Button**: Indigo background on hover
- **Delete Button**: Red background on hover

---

## ❓ Troubleshooting

### "I don't see any assignments"
1. Create a new assignment using the **"+ New Assignment"** button
2. Or run the SQL script provided in `test-assignment.sql`

### "I see assignments but no buttons"
1. Make sure you're on the latest version
2. Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R)
3. Clear browser cache
4. Check browser console for errors (F12)

### "The buttons don't do anything"
1. Check browser console for errors
2. Make sure the assignment has an assigned employee with an email
3. Verify Supabase connection is working

### "Teams message doesn't send"
1. Teams webhook URL needs to be configured in `.env`:
   ```env
   VITE_TEAMS_WEBHOOK_URL=your-webhook-url
   ```
2. Without webhook URL, you'll see a message that Teams integration needs setup

---

## 📸 Screenshot Locations

Look for the buttons here:

### In Kanban View:
- Location: **Top-right corner of each card**
- View: All columns (To Do, In Progress, Done)
- Size: Small, compact icons

### In List View:
- Location: **Right side of each row**
- Next to: Status badge
- Size: Slightly larger, easier to click

---

## 🚀 Quick Test Steps

1. ✅ Navigate to **Assignments** page
2. ✅ Create a test assignment (or run SQL script)
3. ✅ Look for 5 buttons in top-right of assignment card
4. ✅ Click the **purple Teams button** (📱)
5. ✅ See success notification appear
6. ✅ Click the **blue Email button** (✉️)
7. ✅ Email client opens
8. ✅ Click the **green Copy button** (📋)
9. ✅ Paste into notepad to verify

---

## 💡 Pro Tips

- **Keyboard shortcut**: Hover over buttons to see tooltips with descriptions
- **Bulk actions**: Send multiple assignments by clicking each Teams button
- **Mobile friendly**: Buttons work on touch devices too
- **Loading states**: Buttons show spinners while sending
- **Error handling**: Clear error messages if something goes wrong

---

**Need help?** Check the browser console (F12) for detailed error messages.

**Last Updated:** October 13, 2025

