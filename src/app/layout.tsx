import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { PwaUpdateNotifier } from "@/components/pwa/PwaUpdateNotifier";
import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";
import { THEME_COLORS } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "CalConny · BERENT.AI",
  description: "Interner Kalender für BERENT.AI",
  appleWebApp: {
    capable: true,
    title: "CalConny",
    statusBarStyle: "black-translucent",
  },
  // iOS nimmt für den Home-Bildschirm kein Manifest-Icon, sondern apple-touch-icon.
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  // Ohne gespeicherte Wahl folgt die App dem System; ThemeToggle gleicht die Tags beim Umschalten an.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeScript = `
(function(){
  try {
    var k = 'calconny-theme';
    var s = localStorage.getItem(k);
    var d = document.documentElement;
    if (s === 'light') {
      d.setAttribute('data-theme', 'light');
    } else if (s === 'dark') {
      d.removeAttribute('data-theme');
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      d.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col antialiased">
        <Script id="calconny-theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <PwaUpdateNotifier />
        <Header />
        <main className="calconny-safe-x flex flex-1 flex-col py-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
