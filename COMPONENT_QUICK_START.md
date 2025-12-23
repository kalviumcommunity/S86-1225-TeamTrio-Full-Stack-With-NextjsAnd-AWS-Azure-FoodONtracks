# 🚀 Component Architecture - Quick Start Guide

Get up and running with the new component system in 5 minutes.

---

## ⚡ 30-Second Overview

**What Changed**:
- ✅ Created 6 reusable components (Header, Sidebar, Button, Card, InputField, LayoutWrapper)
- ✅ Updated app/layout.tsx to use LayoutWrapper (automatic Header + Sidebar on all pages)
- ✅ Added barrel exports for clean imports
- ✅ Zero TypeScript errors

**What You Get**:
- 🎨 Consistent design across all pages
- 🔄 Reusable UI components
- ♿ Accessible components built-in
- 📚 Full documentation

---

## 🚀 Quick Start

### Step 1: Start Dev Server
```bash
cd foodontracks
npm run dev
```

### Step 2: Visit Application
```
http://localhost:3000
```

You should see:
- Header at top with navigation links
- Sidebar on left with navigation items
- Main content area in the middle

### Step 3: Use Components in Your Pages
```typescript
import { Button, Card, InputField } from '@/components';

export default function MyPage() {
  return (
    <Card title="Form Title">
      <InputField label="Name" />
      <Button label="Submit" variant="primary" />
    </Card>
  );
}
```

---

## 📦 Components Available

### Automatic (Every Page)
- **Header** — Top navigation bar
- **Sidebar** — Left navigation sidebar
- **LayoutWrapper** — Combines them (applied in root layout)

### For Your Pages
- **Button** — Actions with variants
- **Card** — Content containers
- **InputField** — Form inputs

---

## 💡 Common Patterns

### Login Form
```typescript
import { Card, Button, InputField } from '@/components';

export default function LoginPage() {
  return (
    <Card title="Login" variant="elevated">
      <InputField label="Email" type="email" required />
      <InputField label="Password" type="password" required />
      <Button label="Login" variant="primary" type="submit" />
    </Card>
  );
}
```

### Settings Page
```typescript
import { Card, Button, InputField } from '@/components';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card title="Profile">
        <InputField label="Name" />
        <InputField label="Email" type="email" />
        <Button label="Save" variant="primary" />
      </Card>

      <Card title="Danger Zone" variant="bordered">
        <Button label="Delete Account" variant="danger" />
      </Card>
    </div>
  );
}
```

### User Card
```typescript
import { Card } from '@/components';

export default function UserCard({ user }) {
  return (
    <Card variant="elevated">
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
    </Card>
  );
}
```

---

## 🎨 Component Props Cheat Sheet

### Button
```typescript
<Button 
  label="Click Me"
  variant="primary" | "secondary" | "danger"
  onClick={() => {}}
  disabled={false}
  type="button" | "submit"
/>
```

### Card
```typescript
<Card 
  title="Optional Title"
  variant="default" | "bordered" | "elevated"
>
  {/* Content */}
</Card>
```

### InputField
```typescript
<InputField 
  label="Field Name"
  type="text" | "email" | "password" | "textarea"
  placeholder="Enter text"
  value={value}
  onChange={(newValue) => {}}
  required={false}
  error="Error message"
/>
```

---

## 🎯 Button Variants

```
Primary (Blue)       Secondary (Gray)     Danger (Red)
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Click Me      │  │   Click Me      │  │   Delete        │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**When to use**:
- **Primary**: Main actions, form submission
- **Secondary**: Alternate actions, cancel buttons
- **Danger**: Destructive actions, delete buttons

---

## 🎨 Card Variants

```
Default          Bordered         Elevated
(Simple border)  (Thick border)   (Shadow)
┌─────────────┐  ┌┐───────────┐┐  ╭─────────────╮
│ Content     │  ┃│ Content   ││  │ Content     │ ╱╱
└─────────────┘  └┘───────────┘┘  ╰─────────────╯
```

**When to use**:
- **Default**: Regular content
- **Bordered**: Emphasized content
- **Elevated**: Important content, emphasis

---

## 📝 InputField Types

```
Text          Email              Password       Textarea
[Username]    [user@email.com]   [••••••]       [Multi
                                               line
                                               text]
```

---

## 🔗 Component Imports

### Clean Import (Recommended)
```typescript
import { Button, Card, InputField } from '@/components';
```

### Individual Imports (Works Too)
```typescript
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
```

---

## 📁 Where Files Are Located

```
foodontracks/src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx          ← Top navigation
│   │   ├── Sidebar.tsx         ← Left navigation
│   │   └── LayoutWrapper.tsx    ← Combines them
│   ├── ui/
│   │   ├── Button.tsx          ← Reusable button
│   │   ├── Card.tsx            ← Container component
│   │   └── InputField.tsx      ← Form input
│   └── index.ts                ← Barrel exports
│
└── app/
    └── layout.tsx              ← Uses LayoutWrapper
```

---

## ✅ Verification Checklist

After running `npm run dev`, verify:

- [ ] **Header visible**: Top navigation bar shows
- [ ] **Sidebar visible**: Left sidebar shows with nav links
- [ ] **Main content**: Center area has content
- [ ] **Navigation works**: Click nav links navigate correctly
- [ ] **Responsive**: Layout looks good on different screen sizes
- [ ] **Components render**: No errors in console

---

## 🧪 Test Components in a Page

Create a test page to verify components work:

```typescript
// app/test/page.tsx
'use client';

import { Button, Card, InputField } from '@/components';
import { useState } from 'react';

export default function TestPage() {
  const [input, setInput] = useState('');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Component Test</h1>

      {/* Test Card */}
      <Card title="Test Card">
        <p>This is a test card component</p>
      </Card>

      {/* Test Button */}
      <div className="flex gap-3">
        <Button label="Primary" variant="primary" />
        <Button label="Secondary" variant="secondary" />
        <Button label="Danger" variant="danger" />
      </div>

      {/* Test InputField */}
      <InputField
        label="Test Input"
        value={input}
        onChange={setInput}
        placeholder="Type something..."
      />

      <p>Input value: {input}</p>
    </div>
  );
}
```

Visit `http://localhost:3000/test` to see all components in action.

---

## 🎓 Learning Resources

For more details:
- 📖 [README.md](./README.md#-layout-and-component-architecture) — Component architecture section
- 📘 [COMPONENT_ARCHITECTURE.md](./COMPONENT_ARCHITECTURE.md) — Complete guide
- 🎨 [COMPONENT_VISUAL_GUIDE.md](./COMPONENT_VISUAL_GUIDE.md) — Visual reference
- ✅ [COMPONENT_IMPLEMENTATION_SUMMARY.md](./COMPONENT_IMPLEMENTATION_SUMMARY.md) — Implementation details

---

## 💬 Common Questions

**Q: How do I add a new component?**
```
1. Create file in src/components/ui/ or src/components/layout/
2. Export in src/components/index.ts
3. Use in your pages
```

**Q: How do I customize component styling?**
```typescript
// Use className prop
<Button label="Custom" className="text-lg font-bold" />
```

**Q: Can I add new props to components?**
```typescript
// Yes! Update the Props interface and component
interface ButtonProps {
  // Add new prop here
  size?: 'small' | 'large';
}
```

**Q: How does Header/Sidebar appear on all pages?**
```
app/layout.tsx uses LayoutWrapper
LayoutWrapper includes Header + Sidebar
All pages wrapped by RootLayout get both automatically
```

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Components not showing | Check `npm run dev` is running |
| Import errors | Verify path: `from '@/components'` |
| Styling looks wrong | Check Tailwind CSS is configured |
| No Header/Sidebar | Check `src/app/layout.tsx` imports LayoutWrapper |
| TypeScript errors | Check component Props interfaces match usage |

---

## 📊 Component Summary

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| **Header** | Top navigation | Automatic on all pages |
| **Sidebar** | Left navigation | Automatic on all pages |
| **LayoutWrapper** | Page structure | Already in root layout |
| **Button** | Actions | Everywhere you need a button |
| **Card** | Content container | Group related content |
| **InputField** | Form input | Forms, login, settings |

---

## 🎉 You're Ready!

Everything is set up and ready to use. Start building pages with the new component system:

```typescript
import { Card, Button, InputField } from '@/components';

export default function YourPage() {
  return (
    <div className="space-y-6">
      <h1>Your Page Title</h1>
      <Card title="Form">
        <InputField label="Name" />
        <Button label="Submit" variant="primary" />
      </Card>
    </div>
  );
}
```

**Happy building! 🚀**

---

**Quick Links**:
- 🏠 Home: http://localhost:3000
- 📖 Docs: [COMPONENT_ARCHITECTURE.md](./COMPONENT_ARCHITECTURE.md)
- 🎨 Visuals: [COMPONENT_VISUAL_GUIDE.md](./COMPONENT_VISUAL_GUIDE.md)

---

**Date**: December 23, 2025  
**Status**: ✅ Ready to Use  
**Errors**: 0
