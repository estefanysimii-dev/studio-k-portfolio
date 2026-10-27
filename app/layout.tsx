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
    default: "STUDIO K - CREATIVE LAB",
    template: "%s · STUDIO K - CREATIVE LAB"
  },
  description: "Portfólio, produtos e experiências 3D do STUDIO K - CREATIVE LAB para GTA V / FiveM.",
  icons: {
    icon: "/studio-assets/crypto-logo.png?v=studio-k-png-20261027",
    shortcut: "/studio-assets/crypto-logo.png?v=studio-k-png-20261027",
    apple: "/studio-assets/crypto-logo.png?v=studio-k-png-20261027"
  },
  openGraph: {
    title: "STUDIO K - CREATIVE LAB",
    description: "Design 3D, roupas e experiências visuais para GTA V / FiveM.",
    url: "https://studiokatelier.infinityfreeapp.com",
    siteName: "STUDIO K - CREATIVE LAB",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/studio-assets/studio-k-neon-background.png", width: 1983, height: 793, alt: "STUDIO K - CREATIVE LAB" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "STUDIO K - CREATIVE LAB",
    description: "Design 3D, roupas e experiências visuais para GTA V / FiveM.",
    images: ["/studio-assets/studio-k-neon-background.png"]
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
