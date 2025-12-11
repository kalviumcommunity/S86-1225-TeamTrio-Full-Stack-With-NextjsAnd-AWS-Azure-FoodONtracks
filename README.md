# 🚆 FoodONtracks — Digital Food Traceability System

FoodONtracks is a **Batch Number–based traceability platform** designed to improve food safety in Indian Railway catering.  
Each food batch receives a unique Batch ID, and suppliers, kitchens, vendors, and admins log every step — enabling transparent, trackable, and safe food handling.

---

## 📁 Folder Structure (Sprint-1)

```
foodontracks/
│
└── app/ # Next.js App Router
    ├── layout.tsx # Root layout
    ├── page.tsx # Homepage
    │
    ├── components/ # Reusable UI components
    │   └── Button.tsx
    │
    ├── lib/ # Helpers, utilities, axios instance
    │   └── api.ts
    │
    ├── services/ # Business logic wrappers for API calls
    │   └── batchService.ts
    │
    ├── hooks/ # Custom React hooks (future)
    │
    ├── types/ # TypeScript models
    │   └── index.d.ts
    │
    └── styles/ # Styling (future)
│
└── public/
    └── screenshots/ # Screenshot of local run
```

## 📸 Local Development Screenshot

![RuralLite Homepage Running Locally](./foodontracks//public/screenshots/local-dev-screenshot.png)

*Screenshot showing the FoodONtracks homepage running on localhost:3000*

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
cd foodontracks
npm install
```

### 2️⃣ Run development server
```bash
npm run dev
```

### 3️⃣ Open browser
Navigate to `http://localhost:3000`

---

## 🛠️ TypeScript & ESLint Configuration

### Strict TypeScript Mode

The project uses strict TypeScript configuration to catch potential errors early and improve code quality. The following compiler options are enabled in `tsconfig.json`:

- **`strict: true`** - Enables all strict type-checking options
- **`noImplicitAny: true`** - Ensures all variables have explicit types, preventing undefined type bugs
- **`noUnusedLocals: true`** - Flags unused local variables to keep code clean
- **`noUnusedParameters: true`** - Warns about unused function parameters
- **`forceConsistentCasingInFileNames: true`** - Prevents casing mismatches in file imports
- **`skipLibCheck: true`** - Speeds up compilation by skipping type checking of library files

**Why Strict Mode?**
- Catches runtime bugs at compile time
- Improves code maintainability and readability
- Enforces best practices across the team
- Reduces technical debt by preventing poorly typed code

### ESLint & Prettier Configuration

The project uses ESLint with Prettier integration for consistent code formatting and quality enforcement.

**ESLint Rules:**
- **`no-console: "warn"`** - Warns about console statements (should use proper logging in production)
- **`semi: ["error", "always"]`** - Enforces semicolons at the end of statements
- **`quotes: ["error", "double"]`** - Enforces double quotes for consistency

**Prettier Configuration:**
- **`singleQuote: false`** - Uses double quotes
- **`semi: true`** - Adds semicolons
- **`tabWidth: 2`** - Uses 2 spaces for indentation
- **`trailingComma: "es5"`** - Adds trailing commas where valid in ES5

**Why ESLint + Prettier?**
- Ensures consistent code style across the team
- Automatically fixes formatting issues
- Catches common programming errors
- Reduces code review time by automating style checks

### Pre-Commit Hooks with Husky

The project uses Husky and lint-staged to automatically run ESLint and Prettier on staged files before each commit.

**Configuration:**
- Pre-commit hook runs `lint-staged` automatically
- Lint-staged runs ESLint with `--fix` and Prettier on all staged `.ts`, `.tsx`, `.js`, and `.jsx` files
- Prevents committing code that violates linting rules

**How It Works:**
1. Developer stages files with `git add`
2. Developer commits with `git commit`
3. Husky triggers the pre-commit hook
4. Lint-staged runs ESLint and Prettier on staged files
5. If errors are found, the commit is blocked
6. Developer fixes issues and commits again

**Benefits:**
- Ensures all committed code meets quality standards
- Catches issues before they reach code review
- Maintains consistent code style automatically
- Improves team collaboration and code quality

### Testing the Setup

✅ **Successful Lint Check:**
```bash
npx eslint app/**/*.tsx
# No output = all files pass
```

✅ **Pre-Commit Hook Working:**
```bash
git add .
git commit -m "test: TypeScript and ESLint configuration"
# ✔ Running tasks for staged files...
# ✔ Applying modifications from tasks...
# ✔ Cleaning up temporary files...
```

---

## 🎯 Environment Variables

Environment variables are managed securely using `.env.local` for local development:

```env
# Example .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

**Why Environment Variables?**
- Keep sensitive information out of source control
- Easy configuration across different environments
- Secure API keys and credentials

---

## 📦 Tech Stack

- **Frontend:** Next.js 16 with App Router, React 19, TypeScript 5
- **Styling:** Tailwind CSS 4
- **Code Quality:** ESLint 9, Prettier 3, Husky, lint-staged
- **Type Safety:** TypeScript with strict mode enabled

---

## 🚀 Sprint Progress

### ✅ Sprint 1 - Project Initialization & Configuration (Completed)

- [x] Project folder structure setup
- [x] Environment variable management
- [x] Strict TypeScript configuration
- [x] ESLint + Prettier integration
- [x] Pre-commit hooks with Husky
- [x] Code quality automation

---

## 👥 Team

**Team Trio** - Building a safer food supply chain for Indian Railways

---

## 📝 License

This project is part of the Kalvium Full Stack Development Program.

## Environment Variables & Secrets

This app uses environment variables for credentials and configuration.

### Files
- `.env.example` — template with placeholder values (committed).
- `.env.local` — developer local file with real values (gitignored, do not commit).

### Required variables (examples)
**Server-only (do not expose to client)**
- `DATABASE_URL` — Postgres connection string.
- `REDIS_URL` — Redis connection string.
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — AWS credentials for S3.
- `S3_BUCKET` — S3 bucket name.

**Client (safe)**
- `NEXT_PUBLIC_API_BASE_URL` — base URL used by client.

### Local setup
1. Copy template:
   ```bash
   cp .env.example .env.local

