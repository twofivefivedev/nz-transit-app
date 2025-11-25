import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Metlink vNext",
  description: "A scalable, multi-modal transit platform for Wellington, NZ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

