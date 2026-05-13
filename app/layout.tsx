import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner"
import { Analytics } from "@vercel/analytics/react"
import { TranslationsProvider } from "@/components/translations-context"

export const metadata: Metadata = {
  title: "Anchor — AI Companion for Cancer Caregivers",
  description: "Anchor is a real-time AI companion for family members navigating a loved one's cancer diagnosis. Speak your fears. Get grounded. Know your next move.",
  icons: {
    icon: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fbf7f0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-[#fbf7f0]">
      <body style={{ margin: 0, padding: 0, overflowX: "hidden" }}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <TranslationsProvider>
            {children}
            <Toaster />
          </TranslationsProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
