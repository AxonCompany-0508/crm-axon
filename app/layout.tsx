import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AxonBr Company CRM",
  description: "CRM comercial simples e rápido para WhatsApp e Instagram.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
