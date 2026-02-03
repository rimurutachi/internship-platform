import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Intern-Galing | Internship Platform',
    template: '%s | Intern-Galing',
  },
  description: 'Comprehensive internship management platform for students, advisors, supervisors, and administrators.',
  keywords: ['internship', 'student', 'advisor', 'supervisor', 'management', 'platform'],
  authors: [{ name: 'Intern-Galing Team' }],
  creator: 'Intern-Galing',
  metadataBase: process.env.NEXT_PUBLIC_APP_URL 
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : undefined,
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Intern-Galing | Internship Platform',
    description: 'Comprehensive internship management platform for students, advisors, supervisors, and administrators.',
    siteName: 'Intern-Galing',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Intern-Galing | Internship Platform',
    description: 'Comprehensive internship management platform for students, advisors, supervisors, and administrators.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
