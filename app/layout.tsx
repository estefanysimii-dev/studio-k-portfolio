import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import AmbientLight from "@/components/ambient-light";
import StudioScrollbars from "@/components/studio-scrollbars";
import { StudioProvider } from "@/components/studio-provider";
import { ThemeProvider } from '@/components/theme-provider';
import { RadioPlayerProvider } from "@/components/radio-player-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://studiokoficial.netlify.app"),
  title: {
    default: "Studio K",
    template: "%s · Studio K"
  },
  description: "Portfólio, produtos e experiências 3D do Studio K para GTA V / FiveM.",
  icons: {
    icon: "/studio-assets/studio-k-logo.webp",
    shortcut: "/studio-assets/studio-k-logo.webp",
    apple: "/studio-assets/studio-k-logo.webp"
  },
  openGraph: {
    title: "Studio K",
    description: "Design 3D, roupas e experiências visuais para GTA V / FiveM.",
    url: "https://studiokoficial.netlify.app",
    siteName: "Studio K",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/studio-assets/studio-k-banner-hq.webp", width: 1600, height: 900, alt: "Studio K" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Studio K",
    description: "Design 3D, roupas e experiências visuais para GTA V / FiveM.",
    images: ["/studio-assets/studio-k-banner-hq.webp"]
  }
};

const threeImportMap = JSON.stringify({
  imports: {
    three: "https://unpkg.com/three@0.180.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.180.0/examples/jsm/"
  }
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{document.documentElement.dataset.theme=localStorage.getItem('studio-theme')==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}" }} />
        <script type="importmap" dangerouslySetInnerHTML={{ __html: threeImportMap }} />
      </head>
      <body>
        <Script
          type="module"
          src="https://unpkg.com/@google/model-viewer@4.1.0/dist/model-viewer.min.js"
          strategy="afterInteractive"
        />
        <StudioProvider>
          <RadioPlayerProvider>
            <ThemeProvider>
              <AmbientLight />
              <StudioScrollbars />
              {children}
            </ThemeProvider>
          </RadioPlayerProvider>
        </StudioProvider>
      </body>
    </html>
  );
}
