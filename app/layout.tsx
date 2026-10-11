import type { Metadata } from "next";
import "./globals.css";
import AmbientLight from "@/components/ambient-light";
import StudioScrollbars from "@/components/studio-scrollbars";
import { StudioProvider } from "@/components/studio-provider";
import { ThemeProvider } from '@/components/theme-provider';
import { RadioPlayerProvider } from "@/components/radio-player-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://studiokatelier.infinityfreeapp.com"),
  title: {
    default: "Crypto",
    template: "%s · Crypto"
  },
  description: "Portfólio, produtos e experiências 3D do Crypto para GTA V / FiveM.",
  icons: {
    icon: "/studio-assets/crypto-favicon.svg",
    shortcut: "/studio-assets/crypto-favicon.svg",
    apple: "/studio-assets/crypto-favicon.svg"
  },
  openGraph: {
    title: "Crypto",
    description: "Design 3D, roupas e experiências visuais para GTA V / FiveM.",
    url: "https://studiokatelier.infinityfreeapp.com",
    siteName: "Crypto",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/studio-assets/crypto-banner.svg", width: 1600, height: 900, alt: "Crypto" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto",
    description: "Design 3D, roupas e experiências visuais para GTA V / FiveM.",
    images: ["/studio-assets/crypto-banner.svg"]
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
