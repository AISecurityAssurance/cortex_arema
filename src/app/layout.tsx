import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@cloudscape-design/global-styles/index.css";
import "./globals.css";
import "@/styles/cloudscape-overrides.css";
import { CloudscapeLayout } from "@/components/layout/CloudscapeLayout";
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
          <CloudscapeLayout>
            {children}
          </CloudscapeLayout>
        </Providers>
      </body>
    </html>
  );
}
