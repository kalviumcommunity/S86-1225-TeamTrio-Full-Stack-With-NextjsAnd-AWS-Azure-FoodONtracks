import type { Metadata } from 'next';
import { LayoutWrapper } from '@/components';
import './globals.css';

export const metadata: Metadata = {
  title: 'FoodONtracks - Food Traceability System',
  description: 'A comprehensive batch traceability system for food management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
