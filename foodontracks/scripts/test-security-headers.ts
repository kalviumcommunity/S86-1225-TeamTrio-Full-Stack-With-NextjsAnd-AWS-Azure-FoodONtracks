/**
 * Security Headers Test Script
 * Verifies that HTTPS and security headers are properly configured
 * 
 * Usage: npx ts-node scripts/test-security-headers.ts
 */

import https from "https";
import http from "http";

interface SecurityHeadersTest {
  name: string;
  header: string;
  expectedPattern?: RegExp;
  critical: boolean;
}

const SECURITY_TESTS: SecurityHeadersTest[] = [
  {
    name: "HSTS (HTTP Strict Transport Security)",
    header: "strict-transport-security",
    expectedPattern: /max-age=\d+/,
    critical: true,
  },
  {
    name: "Content Security Policy",
    header: "content-security-policy",
    expectedPattern: /default-src/,
    critical: true,
  },
  {
    name: "X-Content-Type-Options",
    header: "x-content-type-options",
    expectedPattern: /nosniff/,
    critical: true,
  },
  {
    name: "X-Frame-Options",
    header: "x-frame-options",
    expectedPattern: /SAMEORIGIN/,
    critical: true,
  },
  {
    name: "X-XSS-Protection",
    header: "x-xss-protection",
    expectedPattern: /1; mode=block/,
    critical: false,
  },
  {
    name: "Referrer-Policy",
    header: "referrer-policy",
    expectedPattern: /strict-origin-when-cross-origin/,
    critical: true,
  },
  {
    name: "Permissions-Policy",
    header: "permissions-policy",
    critical: false,
  },
];

async function testHeaders(url: string): Promise<void> {
  console.log(`\n🔒 Testing Security Headers for: ${url}\n`);
  console.log("=" + "=".repeat(79));

  return new Promise((resolve) => {
    const protocol = url.startsWith("https") ? https : http;
    const requestUrl = new URL(url);

    const options = {
      hostname: requestUrl.hostname,
      port: requestUrl.port,
      path: requestUrl.pathname || "/",
      method: "GET",
      headers: {
        "User-Agent": "Security-Headers-Test/1.0",
      },
    };

    const request = protocol.request(options, (res) => {
      console.log(`📊 Status Code: ${res.statusCode}\n`);

      let passedTests = 0;
      let failedTests = 0;

      SECURITY_TESTS.forEach((test) => {
        const headerValue = res.headers[test.header];
        const hasPassed =
          headerValue !== undefined &&
          (!test.expectedPattern || test.expectedPattern.test(String(headerValue)));

        const icon = hasPassed ? "✅" : test.critical ? "❌" : "⚠️";
        const status = hasPassed ? "PASS" : test.critical ? "FAIL" : "WARNING";

        console.log(`${icon} [${status}] ${test.name}`);
        if (headerValue) {
          const displayValue =
            String(headerValue).length > 70
              ? String(headerValue).substring(0, 67) + "..."
              : headerValue;
          console.log(`   Value: ${displayValue}`);
        } else {
          console.log(`   ⚠️  Header not found`);
        }
        console.log();

        if (hasPassed) passedTests++;
        else if (test.critical) failedTests++;
      });

      console.log("=" + "=".repeat(79));
      console.log(
        `\n📈 Summary: ${passedTests}/${SECURITY_TESTS.length} tests passed`
      );

      if (failedTests > 0) {
        console.log(`\n⚠️  ${failedTests} critical test(s) failed`);
        console.log(
          "\nRecommendations:"
        );
        console.log("1. Verify next.config.ts has correct headers configuration");
        console.log("2. Ensure application is running in production mode");
        console.log("3. Check that headers are being served by the web server");
        console.log("4. Review security header documentation");
      } else {
        console.log("\n✨ All security headers are properly configured!");
      }

      console.log("\n");
      resolve();
    });

    request.on("error", (error) => {
      console.error(`❌ Error testing headers: ${error.message}`);
      console.log(
        "\nNote: Make sure your Next.js application is running on the specified URL"
      );
      console.log("Try running: npm run dev\n");
      resolve();
    });

    request.end();
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let testUrl = args[0] || "http://localhost:3000";

  // Ensure URL has protocol
  if (!testUrl.startsWith("http://") && !testUrl.startsWith("https://")) {
    testUrl = `http://${testUrl}`;
  }

  console.log("🔐 Security Headers Test Suite");
  console.log("================================\n");

  try {
    await testHeaders(testUrl);

    console.log("💡 Additional Security Checks:");
    console.log("  • Use HTTPS in production (HSTS enforces this)");
    console.log("  • Regularly update Content-Security-Policy");
    console.log("  • Monitor security header compliance");
    console.log("  • Use tools like securityheaders.com for external audits\n");
  } catch (error) {
    console.error("Error running security tests:", error);
    process.exit(1);
  }
}

main();
