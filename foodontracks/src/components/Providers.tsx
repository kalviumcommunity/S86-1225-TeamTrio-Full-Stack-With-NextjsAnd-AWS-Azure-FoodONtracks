"use client";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";
import { CartProvider } from "@/context/CartContext";
import { LayoutWrapper } from "@/components";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UIProvider>
          <CartProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
            <Toaster position="top-right" richColors />
          </CartProvider>
        </UIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
