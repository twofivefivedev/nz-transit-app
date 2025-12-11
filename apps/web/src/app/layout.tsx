import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Metlink vNext",
  description: "Real-time transit information for Wellington",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistMono.variable}>
      <body className="min-h-screen bg-white font-mono antialiased">
        {children}
      </body>
    </html>
  );
}








