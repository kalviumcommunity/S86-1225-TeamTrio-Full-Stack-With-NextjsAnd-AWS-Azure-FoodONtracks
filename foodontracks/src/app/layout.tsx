import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "FoodONtracks - Food Traceability System",
  description: "A comprehensive batch traceability system for food management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 dark:bg-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
