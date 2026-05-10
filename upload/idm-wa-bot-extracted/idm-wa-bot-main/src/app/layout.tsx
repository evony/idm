import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "optional",
  preload: true,
});

export const metadata: Metadata = {
  title: "Tarkam IDM - Idol Meta Fan Made Edition",
  description: "Idol meta fan made edition - TARKAM. Komunitas Idol Meta Indonesia. Turnamen mingguan, leaderboard, dan lebih banyak lagi.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo1.webp",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#080a14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark overflow-x-hidden" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground overflow-x-hidden`}
      >
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
