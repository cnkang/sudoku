import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import PWAInit from '@/components/PWAInit';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Multi-Size Sudoku Challenge - Educational Puzzle Game for Children',
  description:
    'Educational Sudoku game with 4×4, 6×6, and 9×9 grids designed for children. Child-friendly interface with hints, celebrations, and WCAG AAA accessibility.',
  keywords:
    'Sudoku, Children, Kids, Educational, Puzzle, Game, 4x4, 6x6, 9x9, Learning, Accessibility, Child-friendly',
  authors: [{ name: 'Kang Liu' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Multi-Size Sudoku Challenge - Educational Puzzle Game for Children',
    description:
      'Educational Sudoku game with multiple grid sizes designed for children. Features child-friendly interface and accessibility.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Multi-Size Sudoku Challenge',
    images: [
      {
        url: '/icons/icon-512x512.svg',
        width: 512,
        height: 512,
        alt: 'Multi-Size Sudoku Challenge Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Multi-Size Sudoku Challenge - Educational Puzzle Game for Children',
    description:
      'Educational Sudoku game with 4×4, 6×6, and 9×9 grids designed for children.',
    images: ['/icons/icon-512x512.svg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sudoku Kids',
    startupImage: [
      {
        url: '/icons/icon-512x512.svg',
        media:
          '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Sudoku Kids',
    'application-name': 'Sudoku Kids',
    'msapplication-TileColor': '#0077BE',
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  userScalable: true, // Enable zoom for accessibility
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0077BE' },
    { media: '(prefers-color-scheme: dark)', color: '#005a9e' },
  ],
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Multi-Size Sudoku Challenge',
  alternateName: 'Sudoku Kids',
  description:
    'Educational Sudoku puzzle game with 4×4, 6×6, and 9×9 grids designed for children with child-friendly interface and WCAG AAA accessibility',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web Browser',
  browserRequirements: 'Requires JavaScript. Modern browser recommended.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  author: {
    '@type': 'Person',
    name: 'Kang Liu',
  },
  genre: 'Educational Puzzle Game',
  keywords:
    'sudoku, children, kids, educational, puzzle, accessibility, learning, 4x4, 6x6, 9x9',
  audience: {
    '@type': 'Audience',
    audienceType: 'Children',
    suggestedMinAge: 6,
    suggestedMaxAge: 16,
  },
  educationalUse: 'Problem solving, logical thinking, pattern recognition',
  learningResourceType: 'Interactive game',
  interactivityType: 'active',
  isAccessibleForFree: true,
  accessibilityFeature: [
    'highContrast',
    'largePrint',
    'keyboardNavigation',
    'screenReaderSupport',
    'voiceNavigation',
  ],
  accessibilityHazard: 'none',
  accessibilityControl: [
    'fullKeyboardControl',
    'fullMouseControl',
    'fullTouchControl',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <PWAInit />
        {children}
      </body>
    </html>
  );
}
