"use client";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";
import { LayoutWrapper } from "@/components";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UIProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
          <Toaster position="top-right" richColors />
        </UIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
