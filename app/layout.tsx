import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import AmbientLight from "@/components/ambient-light";
import { StudioProvider } from "@/components/studio-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://studiokoficial.netlify.app"),
  title: {
    default: "Studio K",
    template: "%s · Studio K"
  },
  description: "Portfólio, produtos e experiências 3D do Studio K para GTA V / FiveM.",
  openGraph: {
    title: "Studio K",
    description: "Design 3D, roupas e experiências visuais para GTA V / FiveM.",
    url: "https://studiokoficial.netlify.app",
    siteName: "Studio K",
    locale: "pt_BR",
    type: "website"
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
    <html lang="pt-BR">
      <head>
        <script type="importmap" dangerouslySetInnerHTML={{ __html: threeImportMap }} />
      </head>
      <body>
        <Script
          type="module"
          src="https://unpkg.com/@google/model-viewer@4.1.0/dist/model-viewer.min.js"
          strategy="afterInteractive"
        />
        <StudioProvider>
          <AmbientLight />
          {children}
        </StudioProvider>
      </body>
    </html>
  );
}
