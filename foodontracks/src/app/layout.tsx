import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

// Validate environment variables on server startup
import '@/lib/validateEnv';

export const metadata: Metadata = {
  title: "FoodONtracks - Food Traceability System",
  description: "A comprehensive batch traceability system for food management",
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
