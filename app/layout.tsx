import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Listly — Minimal lists, maximal flow",
  description:
    "A minimal, highly polished list experience with smooth micro‑animations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} antialiased bg-background text-foreground`}
      >
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none fixed inset-0 z-[-1]">
            <div className="hero-orbit hero-orbit--primary" />
            <div className="hero-orbit hero-orbit--secondary" />
          </div>
          <div className="backdrop-blur-xl">
            {children}
            <Toaster richColors position="top-right" />
          </div>
        </div>
      </body>
    </html>
  );
}
