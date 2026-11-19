import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/site";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import PrivacySetupDialog from "@/components/custom/PrivacySetupDialog";
import { instrumentSerif } from "@/app/fonts";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const description =
  "Track movies, series, anime, manga, games, books and comics. Rate, review, build lists and discover your next favorite.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Listiq", template: "%s · Listiq" },
  description,
  applicationName: "Listiq",
  openGraph: { type: "website", siteName: "Listiq", title: "Listiq", description },
  twitter: { card: "summary_large_image", title: "Listiq", description },
};

export const viewport: Viewport = { themeColor: "#000000", colorScheme: "dark" };

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.userId },
        select: { privacySetupCompleted: true },
      })
    : null;
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} ${instrumentSerif.variable} antialiased bg-background text-foreground`}
      >
        <div className="relative min-h-screen">
          <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
            <div className="hero-orbit hero-orbit--primary" />
            <div className="hero-orbit hero-orbit--secondary" />
          </div>

          {children}
          {user && !user.privacySetupCompleted && <PrivacySetupDialog />}
        </div>
        <Toaster position="top-right" closeButton duration={2000} />
      </body>
    </html>
  );
}
