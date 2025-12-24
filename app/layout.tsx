import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import '../src/index.css';
import './globals.css';

/**
 * Primary font: Space Grotesk - Modern, distinctive geometric sans-serif
 * Used for headings and UI elements
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

/**
 * Secondary font: Inter - Clean, readable for body text
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CommandOS | MPB Health',
    template: '%s | CommandOS',
  },
  description: 'Enterprise Command Center for MPB Health - Unified dashboard for CEO and CTO operations',
  keywords: ['dashboard', 'enterprise', 'health', 'management', 'analytics'],
  authors: [{ name: 'MPB Health' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/icon-192.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0ea5e9' },
    { media: '(prefers-color-scheme: dark)', color: '#0c4a6e' },
  ],
};

/**
 * Root layout - wraps all pages with fonts and base styles
 * The CommandOS shell components are in the (shell) route group layout
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

