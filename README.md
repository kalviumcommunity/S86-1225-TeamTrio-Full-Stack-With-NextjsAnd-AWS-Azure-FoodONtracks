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