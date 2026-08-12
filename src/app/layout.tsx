import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider, ANTI_FLASH_SCRIPT } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM B2B",
  description: "Next-gen B2B CRM",
};

// Banco (Supabase) roda em São Paulo (sa-east-1). Sem isso, as functions
// rodam na região padrão da Vercel (Washington D.C.) e cada consulta ao
// banco cruza o continente — é a causa da lentidão ao trocar de aba.
export const preferredRegion = "gru1";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Script id="theme-anti-flash" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: ANTI_FLASH_SCRIPT }} />
        <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
      </body>
    </html>
  );
}
