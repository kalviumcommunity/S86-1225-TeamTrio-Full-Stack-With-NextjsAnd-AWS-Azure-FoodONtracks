/**
 * Security Demo Page
 *
 * Demonstrates XSS and SQL Injection prevention with before/after examples
 */

"use client";

import { useState } from "react";
import { hasDangerousContent, sanitizeToText } from "@/utils/encode";

interface TestResult {
  original: string;
  sanitized: string;
  dangerous: boolean;
  patterns: string[];
  report?: {
    wasSanitized: boolean;
    removedContent: boolean;
    suspicious: boolean;
    length?: {
      before: number;
      after: number;
    };
  };
  protection?: {
    method: string;
    action: string;
    safe: boolean;
    vulnerableExample?: string;
    safeExample?: string;
    explanation?: string;
  };
}

interface SQLResult extends TestResult {
  queryResult?: {
    executed: string;
    resultsFound: number;
    note: string;
  };
}

export default function SecurityDemoPage() {
  const [testInput, setTestInput] = useState("");
  const [results, setResults] = useState<TestResult | null>(null);
  const [sqlInput, setSqlInput] = useState("");
  const [sqlResults, setSqlResults] = useState<SQLResult | null>(null);

  // XSS Attack Examples
  const xssExamples = [
    {
      name: "Script Tag Injection",
      payload: '<script>alert("XSS Attack!")</script>',
      description: "Attempts to inject JavaScript code",
    },
    {
      name: "Event Handler Injection",
      payload: '<img src="x" onerror="alert(\'XSS\')">',
      description: "Uses image error event to execute code",
    },
    {
      name: "JavaScript Protocol",
      payload: "<a href=\"javascript:alert('XSS')\">Click me</a>",
      description: "Uses javascript: protocol in links",
    },
    {
      name: "Iframe Injection",
      payload: '<iframe src="http://evil.com/steal-cookies.html"></iframe>',
      description: "Embeds malicious iframe",
    },
    {
      name: "SVG Script Injection",
      payload: "<svg onload=\"alert('XSS')\"></svg>",
      description: "Uses SVG to execute scripts",
    },
  ];

  // SQL Injection Examples
  const sqlExamples = [
    {
      name: "OR 1=1 Attack",
      payload: "' OR 1=1 --",
      description: "Bypasses authentication by making condition always true",
    },
    {
      name: "UNION SELECT Attack",
      payload: "' UNION SELECT username, password FROM users --",
      description: "Extracts data from other tables",
    },
    {
      name: "DROP TABLE Attack",
      payload: "'; DROP TABLE users; --",
      description: "Attempts to delete database tables",
    },
    {
      name: "Stacked Queries",
      payload: "admin'; UPDATE users SET role='admin' WHERE id=1; --",
      description: "Executes multiple SQL statements",
    },
  ];

  const testXSS = async () => {
    try {
      const response = await fetch("/api/security/test-xss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: testInput }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error testing XSS:", error);
    }
  };

  const testSQL = async () => {
    try {
      const response = await fetch("/api/security/test-sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: sqlInput }),
      });

      const data = await response.json();
      setSqlResults(data);
    } catch (error) {
      console.error("Error testing SQL:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🔒 Security Demo - OWASP Vulnerability Prevention
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Demonstrating protection against XSS and SQL Injection attacks
          </p>
        </div>

        {/* XSS Prevention Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🚨 XSS (Cross-Site Scripting) Prevention
          </h2>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Common XSS Attack Patterns
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {xssExamples.map((example, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">
                    {example.name}
                  </h4>
                  <code className="block bg-gray-100 dark:bg-gray-900 p-2 rounded text-sm mb-2 overflow-x-auto">
                    {example.payload}
                  </code>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {example.description}
                  </p>
                  <button
                    onClick={() => setTestInput(example.payload)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Test This →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Test Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Test XSS Input (Try entering malicious code)
            </label>
            <textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              placeholder='Try: <script>alert("XSS")</script>'
            />
            {hasDangerousContent(testInput) && (
              <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400">
                ⚠️ Dangerous content detected! This will be sanitized.
              </div>
            )}
            <button
              onClick={testXSS}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Test XSS Protection
            </button>
          </div>

          {/* Results */}
          {results && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before Sanitization */}
              <div className="border-2 border-red-500 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">
                  ❌ BEFORE Sanitization (Vulnerable)
                </h3>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Original Input:
                  </p>
                  <code className="block bg-white dark:bg-gray-800 p-2 rounded text-sm mb-4 overflow-x-auto">
                    {results.original}
                  </code>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    If rendered without sanitization:
                  </p>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded text-sm text-red-600">
                    Would execute malicious code! ⚠️
                  </div>
                </div>
              </div>

              {/* After Sanitization */}
              <div className="border-2 border-green-500 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-3">
                  ✅ AFTER Sanitization (Protected)
                </h3>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Sanitized Output:
                  </p>
                  <code className="block bg-white dark:bg-gray-800 p-2 rounded text-sm mb-4 overflow-x-auto">
                    {results.sanitized}
                  </code>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Safe Rendering:
                  </p>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded text-sm">
                    {sanitizeToText(results.sanitized)}
                  </div>
                  {results.report && (
                    <div className="mt-4 text-sm">
                      {results.report.length && (
                        <p className="text-green-700 dark:text-green-300">
                          ✓ Removed{" "}
                          {results.report.length.before -
                            results.report.length.after}{" "}
                          dangerous characters
                        </p>
                      )}
                      {results.report.suspicious && (
                        <p className="text-yellow-700 dark:text-yellow-300">
                          ⚠️ Suspicious patterns detected and neutralized
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SQL Injection Prevention Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            💉 SQL Injection Prevention
          </h2>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Common SQL Injection Patterns
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sqlExamples.map((example, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">
                    {example.name}
                  </h4>
                  <code className="block bg-gray-100 dark:bg-gray-900 p-2 rounded text-sm mb-2 overflow-x-auto">
                    {example.payload}
                  </code>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {example.description}
                  </p>
                  <button
                    onClick={() => setSqlInput(example.payload)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Test This →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Test Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Test SQL Injection (Try entering malicious SQL)
            </label>
            <textarea
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Try: ' OR 1=1 --"
            />
            <button
              onClick={testSQL}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Test SQL Injection Protection
            </button>
          </div>

          {/* SQL Results */}
          {sqlResults && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vulnerable Query */}
              <div className="border-2 border-red-500 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">
                  ❌ String Concatenation (Vulnerable)
                </h3>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Dangerous Query:
                  </p>
                  <code className="block bg-white dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto">
                    {sqlResults.protection?.vulnerableExample ||
                      "SELECT * FROM users WHERE email = '" + sqlInput + "'"}
                  </code>
                  <p className="text-red-600 dark:text-red-400 mt-4 text-sm">
                    ⚠️ This query is vulnerable to SQL injection!
                  </p>
                </div>
              </div>

              {/* Parameterized Query */}
              <div className="border-2 border-green-500 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-3">
                  ✅ Parameterized Query (Protected)
                </h3>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Safe Query (Prisma):
                  </p>
                  <code className="block bg-white dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto">
                    {sqlResults.protection?.safeExample ||
                      "prisma.user.findMany({ where: { email: userInput } })"}
                  </code>
                  <p className="text-green-600 dark:text-green-400 mt-4 text-sm">
                    ✓ Input treated as data, not SQL code
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Best Practices */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-4">
            🛡️ Security Best Practices
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">✅ DO:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Sanitize ALL user inputs</li>
                <li>Use parameterized queries (Prisma)</li>
                <li>Encode outputs before rendering</li>
                <li>Validate data types and formats</li>
                <li>Use Content Security Policy (CSP)</li>
                <li>Keep dependencies updated</li>
                <li>Log security events</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">❌ DON&apos;T:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Trust user input ever</li>
                <li>Use string concatenation for SQL</li>
                <li>Disable React&apos;s auto-escaping</li>
                <li>Store sensitive data in localStorage</li>
                <li>Use eval() or innerHTML directly</li>
                <li>Ignore security warnings</li>
                <li>Skip input validation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
