import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
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
  title: 'Sudoku Game - Interactive Online Puzzle',
  description:
    'Play free Sudoku puzzles online with multiple difficulty levels. Interactive Sudoku game built with Next.js featuring hints, validation, and responsive design.',
  keywords:
    'Sudoku, Puzzle, Game, Online Sudoku, Free Sudoku, Brain Game, Logic Puzzle, Number Puzzle',
  authors: [{ name: 'Kang Liu' }],
  openGraph: {
    title: 'Sudoku Game - Interactive Online Puzzle',
    description:
      'Play free Sudoku puzzles online with multiple difficulty levels. Interactive game with hints and validation.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Sudoku Game',
  },
  twitter: {
    card: 'summary',
    title: 'Sudoku Game - Interactive Online Puzzle',
    description:
      'Play free Sudoku puzzles online with multiple difficulty levels.',
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sudoku Game',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Sudoku Game',
  description:
    'Interactive online Sudoku puzzle game with multiple difficulty levels',
  applicationCategory: 'Game',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  author: {
    '@type': 'Person',
    name: 'Kang Liu',
  },
  genre: 'Puzzle Game',
  keywords: 'sudoku, puzzle, brain game, logic puzzle, number game',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
