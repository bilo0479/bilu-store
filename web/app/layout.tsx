import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bilu Store - Local Marketplace',
  description: 'Buy and sell locally on Bilu Store — Ethiopia\'s local marketplace.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <html lang="en" className={inter.variable}>
          <body className="min-h-screen font-sans">{children}</body>
        </html>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
