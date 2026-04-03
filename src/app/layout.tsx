import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { PwaUpdateNotifier } from "@/components/pwa/PwaUpdateNotifier";
import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "CalConny · BERENT.AI",
  description: "Interner Kalender für BERENT.AI",
  appleWebApp: {
    capable: true,
    title: "CalConny",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#090806",
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
        <main className="flex flex-1 flex-col px-[max(1rem,env(safe-area-inset-left))] py-6 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
