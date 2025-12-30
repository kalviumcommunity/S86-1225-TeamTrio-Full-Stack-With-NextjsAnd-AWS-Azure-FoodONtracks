/**
 * Security Test Suite
 *
 * Tests input sanitization and SQL injection prevention
 */

import {
  sanitizeHtmlInput,
  sanitizeStrictInput,
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizeUrl,
  sanitizeSqlInput,
  sanitizeObject,
  sanitizeFilename,
  isSuspiciousInput,
} from "../src/utils/sanitize";

// Test results tracking
interface TestResult {
  passed: number;
  failed: number;
  total: number;
  tests: Array<{
    name: string;
    status: "PASS" | "FAIL";
    message?: string;
  }>;
}

const results: TestResult = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: [],
};

// Test helper
function test(name: string, fn: () => boolean, expectedMessage?: string) {
  results.total++;
  try {
    const passed = fn();
    if (passed) {
      results.passed++;
      results.tests.push({ name, status: "PASS" });
      console.log(`✅ PASS: ${name}`);
    } else {
      results.failed++;
      results.tests.push({ name, status: "FAIL", message: expectedMessage });
      console.log(`❌ FAIL: ${name}`);
    }
  } catch (error) {
    results.failed++;
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.tests.push({ name, status: "FAIL", message: errorMessage });
    console.log(`❌ FAIL: ${name} - ${errorMessage}`);
  }
}

console.log("\n🔒 Security Test Suite\n");
console.log("=".repeat(60));
console.log("\n📝 Testing Input Sanitization\n");

// XSS Prevention Tests
console.log("\n🚨 XSS Prevention Tests:");

test("Should remove script tags", () => {
  const input = '<script>alert("XSS")</script>';
  const result = sanitizeStrictInput(input);
  return result === "";
});

test("Should remove event handlers", () => {
  const input = '<img src="x" onerror="alert(\'XSS\')">';
  const result = sanitizeStrictInput(input);
  return !result.includes("onerror");
});

test("Should remove javascript protocol", () => {
  const input = "<a href=\"javascript:alert('XSS')\">Click</a>";
  const result = sanitizeStrictInput(input);
  return !result.includes("javascript:");
});

test("Should remove iframe tags", () => {
  const input = '<iframe src="http://evil.com"></iframe>';
  const result = sanitizeStrictInput(input);
  return !result.includes("<iframe");
});

test("Should remove SVG script injection", () => {
  const input = "<svg onload=\"alert('XSS')\"></svg>";
  const result = sanitizeStrictInput(input);
  return !result.includes("onload");
});

test("Should allow safe HTML with sanitizeHtmlInput", () => {
  const input = "<p>Safe <strong>text</strong> with <em>formatting</em></p>";
  const result = sanitizeHtmlInput(input);
  return (
    result.includes("<p>") &&
    result.includes("<strong>") &&
    !result.includes("<script>")
  );
});

test("Should preserve plain text", () => {
  const input = "Hello, World!";
  const result = sanitizeStrictInput(input);
  return result === input;
});

// SQL Injection Prevention Tests
console.log("\n💉 SQL Injection Prevention Tests:");

test("Should detect OR 1=1 pattern", () => {
  const input = "' OR 1=1 --";
  return isSuspiciousInput(input);
});

test("Should detect UNION SELECT", () => {
  const input = "' UNION SELECT * FROM users --";
  return isSuspiciousInput(input);
});

test("Should detect DROP TABLE", () => {
  const input = "'; DROP TABLE users; --";
  return isSuspiciousInput(input);
});

test("Should detect stacked queries", () => {
  const input = "'; UPDATE users SET role='admin'; --";
  return isSuspiciousInput(input);
});

test("Should sanitize SQL special characters", () => {
  const input = "admin' --";
  const result = sanitizeSqlInput(input);
  return !result.includes("--");
});

test("Should allow normal SQL-like text", () => {
  const input = "Select your favorite option";
  return !isSuspiciousInput(input);
});

// Email Sanitization Tests
console.log("\n📧 Email Sanitization Tests:");

test("Should validate valid email", () => {
  const result = sanitizeEmail("user@example.com");
  return result === "user@example.com";
});

test("Should normalize email to lowercase", () => {
  const result = sanitizeEmail("User@Example.COM");
  return result === "user@example.com";
});

test("Should reject invalid email", () => {
  const result = sanitizeEmail("not-an-email");
  return result === "";
});

test("Should remove XSS from email", () => {
  const result = sanitizeEmail("user@example.com<script>alert(1)</script>");
  return result !== null && !result.includes("<script>");
});

// Phone Number Sanitization Tests
console.log("\n📱 Phone Number Sanitization Tests:");

test("Should format phone number", () => {
  const result = sanitizePhoneNumber("(123) 456-7890");
  // Should keep only digits and spaces
  return result.replace(/\s/g, "") === "1234567890";
});

test("Should remove non-numeric characters", () => {
  const result = sanitizePhoneNumber("123-ABC-7890");
  return !result.includes("ABC");
});

test("Should handle international format", () => {
  const result = sanitizePhoneNumber("+1 (123) 456-7890");
  return result.startsWith("+1");
});

// URL Sanitization Tests
console.log("\n🔗 URL Sanitization Tests:");

test("Should allow HTTPS URLs", () => {
  const result = sanitizeUrl("https://example.com");
  return result === "https://example.com";
});

test("Should allow HTTP URLs", () => {
  const result = sanitizeUrl("http://example.com");
  return result === "http://example.com";
});

test("Should block javascript protocol", () => {
  const result = sanitizeUrl("javascript:alert(1)");
  return result === "";
});

test("Should block data protocol", () => {
  const result = sanitizeUrl("data:text/html,<script>alert(1)</script>");
  return result === "";
});

test("Should block file protocol", () => {
  const result = sanitizeUrl("file:///etc/passwd");
  return result === "";
});

// Filename Sanitization Tests
console.log("\n📁 Filename Sanitization Tests:");

test("Should allow safe filename", () => {
  const result = sanitizeFilename("document.pdf");
  return result === "document.pdf";
});

test("Should remove path traversal", () => {
  const result = sanitizeFilename("../../../etc/passwd");
  return !result.includes("..");
});

test("Should remove special characters", () => {
  const result = sanitizeFilename("file<>:|?.txt");
  return !result.includes("<") && !result.includes(">");
});

test("Should preserve file extension", () => {
  const result = sanitizeFilename("my-file.txt");
  return result.endsWith(".txt");
});

// Object Sanitization Tests
console.log("\n📦 Object Sanitization Tests:");

test("Should sanitize nested objects", () => {
  const input = {
    name: "John<script>alert(1)</script>",
    profile: {
      bio: '<iframe src="evil.com"></iframe>',
    },
  };
  const result = sanitizeObject(input);
  return (
    !result.name.includes("<script>") &&
    !result.profile.bio.includes("<iframe>")
  );
});

test("Should sanitize arrays", () => {
  const input = {
    tags: ["safe", "<script>xss</script>", "also-safe"],
  };
  const result = sanitizeObject(input);
  return !result.tags[1].includes("<script>");
});

test("Should preserve clean data", () => {
  const input = {
    name: "John Doe",
    age: 30,
    active: true,
  };
  const result = sanitizeObject(input);
  return (
    result.name === "John Doe" && result.age === 30 && result.active === true
  );
});

// Suspicious Input Detection Tests
console.log("\n🔍 Suspicious Input Detection Tests:");

test("Should detect XSS patterns", () => {
  return isSuspiciousInput("<script>alert(1)</script>");
});

test("Should detect SQL injection patterns", () => {
  return isSuspiciousInput("' OR '1'='1");
});

test("Should detect encoded attacks", () => {
  return isSuspiciousInput("%3Cscript%3Ealert%281%29%3C%2Fscript%3E");
});

test("Should not flag normal text", () => {
  return !isSuspiciousInput("This is a normal comment about my order");
});

test("Should not flag normal HTML", () => {
  return !isSuspiciousInput("I love <3 your restaurant!");
});

// Print Results
console.log("\n" + "=".repeat(60));
console.log("\n📊 Test Results:\n");
console.log(`Total Tests: ${results.total}`);
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(
  `Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%\n`
);

if (results.failed > 0) {
  console.log("\n❌ Failed Tests:");
  results.tests
    .filter((t) => t.status === "FAIL")
    .forEach((t) => {
      console.log(`  - ${t.name}`);
      if (t.message) {
        console.log(`    ${t.message}`);
      }
    });
}

console.log("\n" + "=".repeat(60));
console.log("\n✨ Security Notes:\n");
console.log("1. Input sanitization provides defense-in-depth");
console.log("2. Prisma ORM prevents SQL injection via parameterized queries");
console.log("3. DOMPurify provides client-side XSS protection");
console.log("4. Always validate and sanitize user input");
console.log("5. Use Content Security Policy (CSP) headers");
console.log("6. Regularly update security dependencies");
console.log("\n" + "=".repeat(60) + "\n");

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
