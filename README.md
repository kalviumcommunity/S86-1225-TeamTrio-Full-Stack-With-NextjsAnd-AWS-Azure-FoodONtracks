# 🚆 FoodONtracks — Digital Food Traceability System

FoodONtracks is a **Batch Number–based traceability platform** designed to improve food safety in Indian Railway catering.  
Each food batch receives a unique Batch ID, and suppliers, kitchens, vendors, and admins log every step — enabling transparent, trackable, and safe food handling.

---

## 📁 Folder Structure (Sprint-1)

foodontracks/
│
└── app/ # Next.js App Router
├── layout.tsx # Root layout
├── page.tsx # Homepage
│
├── components/ # Reusable UI components
│ └── Button.tsx
│
├── lib/ # Helpers, utilities, axios instance
│ └── api.ts
│
├── services/ # Business logic wrappers for API calls
│ └── batchService.ts
│
├── hooks/ # Custom React hooks (future)
│
├── types/ # TypeScript models
│ └── index.d.ts
│
└── styles/ # Styling (future)
│
└── public/
└── screenshots/ # Screenshot of local run

## 📸 Local Development Screenshot

![RuralLite Homepage Running Locally](./foodontracks//public/screenshots/local-dev-screenshot.png)

*Screenshot showing the FoodONtracks homepage running on localhost:3000*

---

---

## 📂 Explanation of Each Directory

| Folder | Purpose |
|--------|---------|
| **app/** | Main routing structure using Next.js App Router |
| **layout.tsx** | Global layout wrapper shared across all pages |
| **page.tsx** | Homepage of the project |
| **components/** | Reusable UI components such as Button |
| **lib/** | Utility files such as API configuration |
| **services/** | Wrapper functions for interacting with backend APIs |
| **types/** | TypeScript interfaces for batches, logs, users |
| **styles/** | Placeholder for global styles |
| **public/screenshots/** | Stores screenshot of local run for submission |

---

## ⚙️ Setup Instructions

### 1️⃣ Install dependencies
```bash
npm install
