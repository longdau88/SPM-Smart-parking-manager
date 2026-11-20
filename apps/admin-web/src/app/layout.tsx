import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SPM Enterprise Admin | Smart Parking Management',
  description: 'AI-Powered Smart Parking Platform - Centralized Multi-tenant Control Center',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-navy-base text-neutral-100 min-h-screen antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
