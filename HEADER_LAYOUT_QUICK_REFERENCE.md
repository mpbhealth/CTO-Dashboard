# Header Layout Quick Reference

## Current Header Structure

### **CTO Dashboard Header**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  [Logo] CTO Dashboard              [Nav Links]        [Badge] [Sign Out]    │
│         Vinnie Champion                                                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### **Layout Specs:**

**Container:**
- Max Width: `1400px`
- Padding: `px-4 sm:px-6 lg:px-8`
- Height: `h-16` (64px)
- Alignment: `flex justify-between items-center`

**Left Section:**
- Gap: `gap-4 lg:gap-6` (responsive)
- Contains: Logo, Title, Navigation

**Navigation Links:**
- Gap: `gap-1`
- Style: Rounded pills with hover states
- Active: Pink/Rose gradient (CEO) or Pink background (CTO)

**Right Section:**
- Gap: `gap-2`
- Contains: ViewingContextBadge, Sign Out

---

## Component Breakdown

### **1. Logo & Title Section**

```tsx
<div className="flex items-center gap-3">
  <img src="/MPB-Health-No-background.png" className="h-10" />
  <div>
    <h1>CTO Dashboard</h1>
    <p className="text-xs text-gray-500">{user.name}</p>
  </div>
</div>
```

### **2. Navigation Links**

```tsx
<div className="hidden md:flex items-center gap-1">
  {navItems.map(item => (
    <Link to={item.path} className="flex items-center gap-2 px-3 py-2">
      <Icon size={16} />
      {item.label}
    </Link>
  ))}
</div>
```

**Nav Items:**
- Home (`/ctod/home`)
- Files (`/ctod/files`)
- KPIs (`/ctod/kpis`)
- Engineering (`/ctod/engineering`)
- Compliance (`/ctod/compliance`)
- Shared (`/shared/overview`)

### **3. Right Section**

```tsx
<div className="flex items-center gap-2">
  <ViewingContextBadge />
  <button onClick={handleSignOut}>
    <LogOut size={16} />
    <span>Sign Out</span>
  </button>
</div>
```

---

## Color Schemes

### **When User is CEO (Viewing CTO Dashboard):**

**Active Link:**
```tsx
bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700
```

**Hover Link:**
```tsx
text-gray-600 hover:bg-pink-50 hover:text-pink-700
```

**Title:**
```tsx
bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent
```

### **When User is CTO:**

**Active Link:**
```tsx
bg-pink-50 text-pink-700
```

**Hover Link:**
```tsx
text-gray-600 hover:bg-gray-50 hover:text-gray-900
```

**Title:**
```tsx
text-gray-900
```

---

## Responsive Behavior

### **Desktop (lg and up):**
- Full navigation visible
- All labels shown
- Spacious gaps

### **Tablet (md to lg):**
- Navigation visible
- Sign Out text hidden
- Tighter gaps

### **Mobile (sm and below):**
- Navigation hidden (would need hamburger menu)
- Icons only
- Minimal gaps

---

## ViewingContextBadge

Shows the current viewing context with color-coded badges:

| Context | Icon | Color | Label |
|---------|------|-------|-------|
| Company | Building2 | Blue | Company View |
| Department | Building2 | Pink | Department View |
| Team | Users | Sky | Team View |
| Personal | Eye | Emerald | Personal View |

**Auto-Detection Logic:**
- `/departments/*` → Department View
- `/team/*` or `/members/*` → Team View
- `/home` or `/ceod/home` or `/ctod/home` → Personal View
- Everything else → Company View

---

## Common Issues & Solutions

### **Issue: Navigation items overlapping**
**Solution:** Increase max-width or adjust gap values
```tsx
max-w-[1400px]  // or max-w-[1600px]
gap-4 lg:gap-6  // or gap-3 lg:gap-5
```

### **Issue: Header too tall on mobile**
**Solution:** Use responsive height
```tsx
h-16 sm:h-14  // Shorter on small screens
```

### **Issue: Logo too large**
**Solution:** Adjust logo height
```tsx
h-10  // 40px (current)
h-8   // 32px (smaller)
```

### **Issue: Sign Out text always hidden**
**Solution:** Adjust responsive class
```tsx
hidden sm:inline  // Show on small+
hidden md:inline  // Show on medium+
hidden lg:inline  // Show on large+
```

---

## Adding New Navigation Items

### **Step 1: Add to navItems array**

```tsx
const navItems = [
  { path: '/ctod/home', label: 'Home', icon: Home },
  { path: '/ctod/files', label: 'Files', icon: FileText },
  // Add new item:
  { path: '/ctod/new-page', label: 'New Page', icon: NewIcon },
  ...
];
```

### **Step 2: Import icon**

```tsx
import { Home, FileText, NewIcon } from 'lucide-react';
```

### **Step 3: Create the page route** (in routing configuration)

That's it! The navigation will automatically render the new item with proper styling.

---

## Customization Examples

### **Change Active Link Color:**

```tsx
// In the Link className:
isActive
  ? 'bg-blue-50 text-blue-700'  // Blue instead of pink
  : 'text-gray-600 hover:bg-blue-50'
```

### **Add Icon to Title:**

```tsx
<h1 className="flex items-center gap-2">
  <Shield className="w-5 h-5" />
  CTO Dashboard
</h1>
```

### **Add User Avatar:**

```tsx
<div className="flex items-center gap-3">
  <img src="/MPB-Health-No-background.png" />
  <div>
    <h1>CTO Dashboard</h1>
    <p>{user.name}</p>
  </div>
  <img
    src={user.avatar}
    className="w-8 h-8 rounded-full"
    alt="Avatar"
  />
</div>
```

### **Add Notification Bell:**

```tsx
<div className="flex items-center gap-2">
  <button className="relative">
    <Bell size={20} />
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
      3
    </span>
  </button>
  <ViewingContextBadge />
  <button onClick={handleSignOut}>...</button>
</div>
```

---

## Layout Variants

### **Two-Row Header:**

```tsx
<nav className="bg-white border-b">
  {/* Row 1: Logo + Title + Actions */}
  <div className="border-b border-gray-100">
    <div className="max-w-[1400px] mx-auto px-4 h-16">
      <div className="flex justify-between items-center h-full">
        <div>Logo + Title</div>
        <div>Badge + Sign Out</div>
      </div>
    </div>
  </div>

  {/* Row 2: Navigation */}
  <div>
    <div className="max-w-[1400px] mx-auto px-4 h-12">
      <nav>Navigation Links</nav>
    </div>
  </div>
</nav>
```

### **Compact Header (Single Row, Smaller):**

```tsx
<nav className="bg-white border-b">
  <div className="max-w-[1400px] mx-auto px-4 h-12">
    <div className="flex justify-between items-center h-full">
      <div className="flex items-center gap-2">
        <img src="/logo.png" className="h-6" />
        <h1 className="text-sm font-bold">CTO</h1>
      </div>
      <nav className="flex gap-1">
        {/* Compact nav items */}
      </nav>
      <button>Sign Out</button>
    </div>
  </div>
</nav>
```

---

## Performance Tips

### **Optimize Logo Loading:**

```tsx
<img
  src="/MPB-Health-No-background.png"
  alt="MPB Health Logo"
  className="h-10 w-auto object-contain"
  loading="eager"  // Load immediately
  decoding="async" // Decode async
/>
```

### **Memoize Navigation Items:**

```tsx
const navItems = useMemo(() => [
  { path: '/ctod/home', label: 'Home', icon: Home },
  // ...
], []);
```

### **Reduce Re-renders:**

```tsx
const MemoizedHeader = memo(CTODashboardLayout);
```

---

## Accessibility

### **Keyboard Navigation:**

All links and buttons are keyboard accessible by default. Ensure:
- Links use `<Link>` component
- Buttons use `<button>` element
- Interactive elements have visible focus states

### **Screen Readers:**

```tsx
<nav aria-label="Main navigation">
  <Link to="/ctod/home" aria-current={isActive ? 'page' : undefined}>
    Home
  </Link>
</nav>

<button onClick={handleSignOut} aria-label="Sign out of account">
  <LogOut size={16} />
  <span>Sign Out</span>
</button>
```

### **Focus Styles:**

```tsx
className="focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
```

---

## Testing Checklist

- [ ] Logo loads and displays correctly
- [ ] Title shows correct text for role (CTO vs CEO)
- [ ] User name displays
- [ ] All navigation links are clickable
- [ ] Active link highlights correctly
- [ ] Hover states work
- [ ] ViewingContextBadge shows correct context
- [ ] Sign Out button works
- [ ] Header is responsive on mobile
- [ ] No console errors
- [ ] Keyboard navigation works
- [ ] Focus states visible

---

## Quick Troubleshooting

| Problem | Check | Fix |
|---------|-------|-----|
| Items overlapping | Container width | Increase max-w value |
| Logo not showing | Image path | Verify `/public/` path |
| Nav not visible | Responsive class | Check `hidden md:flex` |
| Wrong colors | Role check | Verify `profile?.role === 'ceo'` |
| Badge wrong context | URL path | Check route matching logic |
| Sign Out fails | Auth context | Verify `useAuth()` hook |

---

**Need to modify the header? Start here and follow the patterns above!**
