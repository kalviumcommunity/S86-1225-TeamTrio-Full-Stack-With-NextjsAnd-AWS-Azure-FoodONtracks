import type { Metadata } from "next";
import { LayoutWrapper } from "@/components";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";
import { Toaster } from "sonner";
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
      <body className="bg-gray-50">
        <AuthProvider>
          <UIProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
            <Toaster position="top-right" richColors />
          </UIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
