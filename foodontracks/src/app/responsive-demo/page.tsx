"use client";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";

export default function ResponsiveDemo() {
  const { theme } = useTheme();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Hero Section - Responsive */}
      <section className="p-4 md:p-8 lg:p-12 bg-gradient-to-br from-brand-light to-brand dark:from-brand-dark dark:to-brand text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4">
            Responsive Design Demo
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl">
            This page demonstrates responsive layouts with Tailwind CSS and
            light/dark theme support. Resize your browser or check on different
            devices!
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button className="px-6 py-3 bg-white text-brand rounded-lg font-semibold hover:bg-gray-100 transition">
              Get Started
            </button>
            <button className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-brand transition">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Current Theme Info */}
      <section className="p-4 md:p-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Current Theme: {theme === "light" ? "☀️ Light" : "🌙 Dark"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Click the toggle button in the top-right to switch themes
              </p>
            </div>
            <div className="flex gap-4">
              <div className="px-4 py-2 bg-brand-light dark:bg-brand-dark text-gray-900 dark:text-white rounded-lg">
                Brand Light
              </div>
              <div className="px-4 py-2 bg-brand text-white rounded-lg">
                Brand
              </div>
              <div className="px-4 py-2 bg-brand-dark text-white rounded-lg">
                Brand Dark
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Breakpoint Indicator */}
      <section className="p-4 md:p-8 bg-gray-100 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Current Breakpoint
          </h2>
          <div className="flex gap-2 flex-wrap">
            <span className="block sm:hidden px-4 py-2 bg-red-500 text-white rounded-lg font-semibold">
              📱 Mobile (&lt; 640px)
            </span>
            <span className="hidden sm:block md:hidden px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold">
              📱 Small (640px - 767px)
            </span>
            <span className="hidden md:block lg:hidden px-4 py-2 bg-green-500 text-white rounded-lg font-semibold">
              💻 Medium (768px - 1023px)
            </span>
            <span className="hidden lg:block xl:hidden px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold">
              🖥️ Large (1024px - 1279px)
            </span>
            <span className="hidden xl:block px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold">
              🖥️ Extra Large (≥ 1280px)
            </span>
          </div>
        </div>
      </section>

      {/* Responsive Grid */}
      <section className="p-4 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            Responsive Card Grid
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="w-12 h-12 bg-brand dark:bg-brand-light rounded-full flex items-center justify-center text-white dark:text-gray-900 font-bold mb-4">
                  {item}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  Card {item}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  This card adapts to different screen sizes. Try resizing your
                  browser!
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="p-4 md:p-8 lg:p-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            Responsive Features
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 dark:border-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Breakpoint
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Width
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Grid Columns
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Padding
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr className="bg-white dark:bg-gray-800">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    Mobile
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    &lt; 640px
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    1 column
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    p-4
                  </td>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-900">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    SM
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    ≥ 640px
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    2 columns
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    p-4
                  </td>
                </tr>
                <tr className="bg-white dark:bg-gray-800">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    MD
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    ≥ 768px
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    2 columns
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    p-8
                  </td>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-900">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    LG
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    ≥ 1024px
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    3 columns
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    p-12
                  </td>
                </tr>
                <tr className="bg-white dark:bg-gray-800">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    XL
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    ≥ 1280px
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    4 columns
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    p-12
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Typography Scale */}
      <section className="p-4 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            Responsive Typography
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs mb-2 text-gray-500 dark:text-gray-400">
                Heading 1
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
                The quick brown fox
              </h1>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs mb-2 text-gray-500 dark:text-gray-400">
                Heading 2
              </p>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                Jumps over the lazy dog
              </h2>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs mb-2 text-gray-500 dark:text-gray-400">
                Body Text
              </p>
              <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300">
                This is a paragraph that adjusts its size based on the screen
                width. It remains readable across all devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testing Instructions */}
      <section className="p-4 md:p-8 lg:p-12 bg-brand text-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Testing Instructions
          </h2>
          <ul className="space-y-2 text-sm md:text-base">
            <li>✅ Resize your browser window to see breakpoint changes</li>
            <li>✅ Toggle dark mode using the button in top-right</li>
            <li>✅ Open DevTools and use Device Toolbar (Ctrl+Shift+M)</li>
            <li>✅ Test on real devices: phone, tablet, desktop</li>
            <li>✅ Check color contrast in both themes</li>
            <li>✅ Verify all text is readable at different sizes</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
