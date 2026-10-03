import type { Metadata } from "next";
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <StudioProvider>
          <AmbientLight />
          {children}
        </StudioProvider>
      </body>
    </html>
  );
}
