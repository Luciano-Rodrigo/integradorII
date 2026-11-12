import type { Metadata } from "next";
import "./globals.css";
import PwaRegistration from "@/components/pwa-registration";

export const metadata: Metadata = {
  title: "Descarte Certo | Encontre onde descartar",
  description: "Encontre locais para o descarte responsável de eletrônicos e baterias.",
  manifest: "/manifest.webmanifest",
  applicationName: "Descarte Certo",
  appleWebApp: { capable: true, title: "Descarte Certo", statusBarStyle: "default" },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased"><PwaRegistration />{children}</body>
    </html>
  );
}
