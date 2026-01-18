import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-red-50 to-orange-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
        <p className="text-gray-600 text-lg mb-8">
          Oops! The page you are looking for doesn&apos;t exist. It may have been moved or deleted.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded font-semibold hover:bg-blue-700 transition"
          >
            Go to Home
          </Link>
          <Link
            href="/dashboard"
            className="bg-green-600 text-white px-6 py-3 rounded font-semibold hover:bg-green-700 transition"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Common links suggestion */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4 font-semibold">Looking for something?</p>
          <ul className="text-blue-600 space-y-2">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:underline">
                Login
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/users" className="hover:underline">
                Users
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
