import type { Metadata } from 'next';
import './globals.css';
import AuthProvider from '@/components/ui/AuthProvider';
import { ThemeProvider } from '@/components/providers/theme-provider';

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
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
