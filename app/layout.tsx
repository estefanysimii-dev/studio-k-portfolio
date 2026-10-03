import type { Metadata } from "next";
import "./globals.css";
import AmbientLight from "@/components/ambient-light";

export const metadata: Metadata = {
  title: "Studio K",
  description: "Portfólio, produtos e experiências 3D do Studio K."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AmbientLight />
        {children}
      </body>
    </html>
  );
}
