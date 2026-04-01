import type { Metadata } from 'next';
import './globals.css';
import AuthProvider from '@/components/ui/AuthProvider';

export const metadata: Metadata = {
  title: 'SEO GEO Platform',
  description: 'AI platforma za GitHub optimizacije',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Ovde govorimo aplikaciji da prati da li smo ulogovani */}
        <AuthProvider>
          ^
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
