import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TryThat.ai — For Realtors",
  description: "Content Studio for real estate marketing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      {/* suppressHydrationWarning: browser extensions (ColorZilla, Grammarly,
          etc.) inject attributes onto <body> before hydration; this ignores
          attribute-only diffs on this element, not its children. */}
      <body className="bg-cream text-ink min-h-screen" suppressHydrationWarning>
        <AuthProvider>
          <TooltipProvider delay={200}>{children}</TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
