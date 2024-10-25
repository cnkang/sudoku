import type { Metadata } from "next";
import localFont from "next/font/local";
import Head from "next/head";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Define the Author type if not already defined
type Author = {
  name: string;
};

export const metadata: Metadata = {
  title: "Sudoku Application",
  description: "An interactive and challenging Sudoku game built with Next.js and React, offering various difficulty levels and a responsive design.",
  keywords: "Sudoku, Puzzle, Game, Next.js, React, Interactive",
  authors: [{ name: "Kang Liu" }],
};

function extractKeywords(keywords: string | string[] | undefined): string {
  if (!keywords) return "";
  return typeof keywords === "string" ? keywords : keywords.join(", ");
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <meta name="description" content={String(metadata.description ?? "")} />
        <meta name="keywords" content={extractKeywords(metadata.keywords ?? "")} />
        <meta
          name="author"
          content={String(
            Array.isArray(metadata.authors) && metadata.authors.length > 0
              ? metadata.authors[0].name
              : ""
          )}
        />
        <meta property="og:title" content={String(metadata.title ?? "")} />
        <meta property="og:description" content={String(metadata.description ?? "")} />
        <meta property="og:image" content="URL_to_your_logo_or_image" />
        <meta property="og:url" content="Your_Website_URL" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={String(metadata.title ?? "")} />
        <meta name="twitter:description" content={String(metadata.description ?? "")} />
        <meta name="twitter:image" content="URL_to_your_logo_or_image" />
        <title>{String(metadata.title ?? "")}</title>
      </Head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
