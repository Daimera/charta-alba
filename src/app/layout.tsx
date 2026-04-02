import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Charta Alba — Research, Reels, Repeat",
  description:
    "Discover AI breakthroughs in 60 seconds. The TikTok-style feed for research papers.",
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "https://chartaalba.com"),
  openGraph: {
    title: "Charta Alba — Research, Reels, Repeat",
    description:
      "Discover AI breakthroughs in 60 seconds. The TikTok-style feed for research papers.",
    siteName: "Charta Alba",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Charta Alba — Research, Reels, Repeat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Charta Alba — Research, Reels, Repeat",
    description: "Discover AI breakthroughs in 60 seconds. The TikTok-style feed for research papers.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="bg-[#0a0a0a] text-white">
        <AuthProvider>
          <Suspense fallback={null}>
            <TopNav />
          </Suspense>
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
