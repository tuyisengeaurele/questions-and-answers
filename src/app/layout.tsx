import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { RegisterSW } from "@/components/register-sw";
import { ConfirmProvider } from "@/components/confirm-dialog";
import { LangProvider } from "@/components/lang-provider";
import { LeaveGuardProvider } from "@/components/leave-guard";
import { LightboxProvider } from "@/components/lightbox";
import { OfflineBanner } from "@/components/offline-banner";
import { ProgressProvider } from "@/components/progress-provider";
import { TabBar } from "@/components/tab-bar";
import { sizeInitScript } from "@/lib/prefs";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Ikizamini",
  description: "Practice for the Rwandan driving theory test, with the questions in Kinyarwanda.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f3ee" },
    { media: "(prefers-color-scheme: dark)", color: "#131518" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript + sizeInitScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <ProgressProvider>
          <LangProvider>
            <ConfirmProvider>
              <LightboxProvider>
                <LeaveGuardProvider>
                  <TabBar />
                  <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6 md:pb-12 md:pt-24">
                    <OfflineBanner />
                    {children}
                  </main>
                </LeaveGuardProvider>
              </LightboxProvider>
            </ConfirmProvider>
          </LangProvider>
        </ProgressProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
