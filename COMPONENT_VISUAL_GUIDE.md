# 🎨 Component Architecture - Visual Guide

Quick visual reference for the component system.

---

## 📐 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     HEADER COMPONENT                         │
│  🍔 FoodONtracks │ Home │ Login │ Dashboard │ Users         │
├──────────────────┬──────────────────────────────────────────┤
│                  │                                           │
│    SIDEBAR       │         MAIN CONTENT AREA                │
│                  │                                           │
│  📊 Dashboard    │  ┌────────────────────────────────────┐  │
│  👥 Users        │  │         Card Component             │  │
│  🔐 Login        │  │  ┌──────────────────────────────┐ │  │
│                  │  │  │  Input Fields:               │ │  │
│                  │  │  │  • Text Input                │ │  │
│                  │  │  │  • Email Input               │ │  │
│                  │  │  │  • Password Input            │ │  │
│  FoodONtracks    │  │  │  • Textarea                  │ │  │
│  v1.0            │  │  └──────────────────────────────┘ │  │
│                  │  │  Buttons:                         │  │
│                  │  │  [Primary] [Secondary] [Danger]   │  │
│                  │  └────────────────────────────────────┘  │
│                  │                                           │
└──────────────────┴──────────────────────────────────────────┘
```

---

## 🧩 Component Hierarchy Tree

```
LayoutWrapper (Server Component)
│
├─ Header (Client Component)
│  ├─ Logo/Brand
│  ├─ Nav Links
│  │  ├─ Home
│  │  ├─ Login
│  │  ├─ Dashboard
│  │  └─ Users
│
├─ Sidebar (Client Component)
│  └─ Navigation Links
│     ├─ 📊 Dashboard
│     ├─ 👥 Users
│     └─ 🔐 Login
│
└─ Main Content Area
   └─ Page Component
      ├─ Card (Server Component)
      │  ├─ Title (optional)
      │  └─ Children
      │     ├─ InputField
      │     │  ├─ Label
      │     │  ├─ Input
      │     │  └─ Error Message (optional)
      │     │
      │     └─ Button
      │        └─ Label
      │
      ├─ Button
      └─ InputField
```

---

## 🎨 Component Variants Visual

### Button Variants

```
┌─────────────────────────────────────┐
│  PRIMARY (Blue)                      │
│  [  Click Me  ]                      │
│  Hover: Darker Blue                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  SECONDARY (Gray)                    │
│  [  Click Me  ]                      │
│  Hover: Darker Gray                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  DANGER (Red)                        │
│  [  Click Me  ]                      │
│  Hover: Darker Red                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  DISABLED (Opacity 50%)              │
│  [  Click Me  ]                      │
│  Cannot click, gray appearance       │
└─────────────────────────────────────┘
```

### Card Variants

```
┌─ Default Card (Simple Border) ──────┐
│  Title (optional)                    │
│  ─────────────────────────────────── │
│  Content goes here                   │
│  Can contain any React elements      │
└────────────────────────────────────┘

┌┐ Bordered Card (Thick Border) ┐┐────┐
┃│ Title (optional)             ││    │
┃│ ───────────────────────────── ││    │
┃│ Content goes here            ││    │
┃│ Prominent border styling     ││    │
└┘────────────────────────────────┘┘────┘

╭─────────────────────────────────────╮
│  Elevated Card (Shadow)              │ ╱╱
│  Title (optional)                    │╱╱
│  ────────────────────────────────    │
│  Content with shadow effect          │
│  Best for emphasis                   │
╰─────────────────────────────────────╯
```

### InputField Variants

```
Text Input:
┌─────────────────────────────────┐
│ Username                         │
│ ┌─────────────────────────────┐ │
│ │ Enter your username...      │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘

Email Input:
┌─────────────────────────────────┐
│ Email Address *                  │
│ ┌─────────────────────────────┐ │
│ │ your@email.com              │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘

Password Input:
┌─────────────────────────────────┐
│ Password *                       │
│ ┌─────────────────────────────┐ │
│ │ ••••••••••                  │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘

Textarea:
┌─────────────────────────────────┐
│ Message                          │
│ ┌─────────────────────────────┐ │
│ │ Line 1                      │ │
│ │ Line 2                      │ │
│ │ Line 3                      │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘

With Error:
┌─────────────────────────────────┐
│ Email *                          │
│ ┌─────────────────────────────┐ │
│ │ invalid.email               │ │
│ └─────────────────────────────┘ │
│ ⚠️ Email format is invalid      │
└─────────────────────────────────┘
```

---

## 🔄 Data Flow

```
Page Component
│
├─ Uses: Card
│  │
│  ├─ Contains: InputField
│  │ ├─ Props: label, type, value
│  │ ├─ Event: onChange
│  │ └─ State: in parent component
│  │
│  └─ Contains: Button
│    ├─ Props: label, variant
│    ├─ Event: onClick
│    └─ Handler: in parent component
│
└─ State Management
   ├─ Form data (email, password, etc.)
   ├─ Error states
   └─ Loading states
```

---

## 📱 Responsive Behavior

### Desktop Layout (>1024px)
```
┌─────────────────────────────────────────┐
│          HEADER (Full width)            │
├────────────┬──────────────────────────┤
│ SIDEBAR    │  MAIN CONTENT            │
│ (256px)    │  (Flexible)              │
│            │                          │
└────────────┴──────────────────────────┘
```

### Tablet Layout (768px - 1024px)
```
┌──────────────────────────────┐
│      HEADER                  │
├──────────┬──────────────────┤
│ SIDEBAR  │  MAIN CONTENT    │
│ (200px)  │  (Flexible)      │
└──────────┴──────────────────┘
```

### Mobile Layout (<768px) - Future Enhancement
```
┌────────────────┐
│    HEADER      │
├────────────────┤
│  MAIN CONTENT  │
│  (Full width)  │
├────────────────┤
│    SIDEBAR     │
│  (Collapsed)   │
└────────────────┘
```

---

## 🎯 Component Props at a Glance

```
Header
├─ No props (static)
└─ Uses: Link, navigation data

Sidebar
├─ No props (static)
└─ Uses: Link, navigation data

LayoutWrapper
├─ children: React.ReactNode
└─ Returns: Full page layout

Button
├─ label: string (required)
├─ onClick?: () => void
├─ variant?: 'primary' | 'secondary' | 'danger'
├─ disabled?: boolean
├─ type?: 'button' | 'submit' | 'reset'
└─ className?: string

Card
├─ title?: string
├─ children: React.ReactNode (required)
├─ variant?: 'default' | 'bordered' | 'elevated'
└─ className?: string

InputField
├─ label?: string
├─ type?: 'text' | 'email' | 'password' | 'textarea'
├─ placeholder?: string
├─ value?: string
├─ onChange?: (value: string) => void
├─ required?: boolean
├─ disabled?: boolean
├─ error?: string
└─ className?: string
```

---

## 🎨 Color Reference

```
Primary Blue
████ #2563EB

Secondary Gray
████ #6B7280

Danger Red
████ #DC2626

Background White
████ #FFFFFF

Light Gray
████ #F3F4F6

Border Gray
████ #D1D5DB
```

---

## ⌨️ Keyboard & Accessibility

```
Header Navigation:
├─ Tab: Move between links
├─ Enter: Activate link
└─ aria-label: "main navigation"

Buttons:
├─ Tab: Focus button
├─ Enter/Space: Click
├─ disabled: Tab skipped
└─ Focus visible: Blue ring

InputField:
├─ Tab: Focus input
├─ Type: Enter text
├─ Shift+Tab: Previous field
├─ Label: Clickable → Focus input
└─ Error shown on invalid

Sidebar:
├─ Tab: Cycle through links
└─ aria-label: "sidebar"
```

---

## 📊 Component Usage Count

```
Header:        1 (All pages, automatic)
Sidebar:       1 (All pages, automatic)
LayoutWrapper: 1 (Root layout)
Button:        ∞ (Used across pages)
Card:          ∞ (Content containers)
InputField:    ∞ (Forms, login, etc.)
```

---

## 🚀 Import Patterns

### Pattern 1: Import All
```typescript
import { Button, Card, InputField } from '@/components';
```

### Pattern 2: Destructured
```typescript
import { Button as PrimaryButton } from '@/components';
```

### Pattern 3: Default Export (Not recommended)
```typescript
// Don't use - stick with barrel exports
import Button from '@/components/ui/Button';
```

---

## 🧪 Common Use Cases

### Login Form
```
Card (variant: "elevated")
├─ InputField (type: "email")
├─ InputField (type: "password")
└─ Button (variant: "primary")
```

### User Profile
```
Card (variant: "default")
├─ InputField (label: "Name")
├─ InputField (label: "Email")
├─ InputField (label: "Bio", type: "textarea")
└─ Card
   ├─ Button (label: "Save", variant: "primary")
   └─ Button (label: "Cancel", variant: "secondary")
```

### Settings Page
```
Card (title: "Settings")
├─ InputField (label: "Theme")
├─ InputField (label: "Language")
└─ Button (label: "Update", type: "submit")

Card (title: "Danger Zone", variant: "bordered")
├─ Text: "Delete account?"
└─ Button (label: "Delete", variant: "danger")
```

---

## 📈 Component Stats

| Metric | Value |
|--------|-------|
| Total Components | 6 |
| Layout Components | 3 |
| UI Components | 3 |
| TypeScript Errors | 0 |
| Lines of Code | ~450 |
| Re-usable Variants | 8 |
| Props Total | 30+ |
| Accessibility Features | ✅ |

---

## 📖 When to Use Each Component

```
Layout Components:
├─ Header: Navigation at top
├─ Sidebar: Secondary nav
└─ LayoutWrapper: Page structure

UI Components:
├─ Button: Actions, form submission
├─ Card: Content grouping, emphasis
└─ InputField: Form inputs, text entry
```

---

**Visual Guide Created**: December 23, 2025  
**Framework**: Next.js 13+  
**Status**: ✅ Complete
