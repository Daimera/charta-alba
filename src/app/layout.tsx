import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// Startup validation — runs on every cold start; throws if secrets are misconfigured
import "@/lib/startup-checks";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { LogoSplash } from "@/components/LogoSplash";
import { Suspense } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

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
        url: "/logo-black.png",
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
    images: ["/logo-black.png"],
  },
  icons: {
    icon: "/logo-black.png",
    apple: "/logo-black.png",
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
      {/* Inline script: applies theme, font-size, and reduce-motion from localStorage
          synchronously before the first paint — prevents flash of wrong settings. */}
      <script dangerouslySetInnerHTML={{ __html: `(function(){try{
        var t=localStorage.getItem('ca-theme')||'dark';
        var f=localStorage.getItem('ca-font-size')||'default';
        var m=localStorage.getItem('ca-reduce-motion')==='true';
        document.documentElement.setAttribute('data-theme',t);
        if(f==='large')document.documentElement.classList.add('font-large');
        if(f==='xlarge')document.documentElement.classList.add('font-xlarge');
        if(m)document.documentElement.classList.add('reduce-motion');
      }catch(e){}})();` }} />
      <body className="bg-[#0a0a0a] text-white">
        <a href="#main-content" className="skip-to-main">Skip to main content</a>
        <AuthProvider>
          <LogoSplash />
          <Suspense fallback={null}>
            <TopNav />
          </Suspense>
          {children}
          <Footer />
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
