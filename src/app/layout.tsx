import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ProfessionalHeader } from "@/components/header";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cortex Arena",
  description: "Professional Security Sandbox Analysis Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="app-layout">
            <ProfessionalHeader />
            <main className="main-content">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
