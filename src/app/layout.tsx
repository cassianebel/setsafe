import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SetSafe",
  description: "Production-scoped contracts and materials",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
