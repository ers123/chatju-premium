import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatJu Premium - AI-Powered Saju Readings",
  description: "Ancient wisdom meets modern AI. Experience personalized Saju readings that illuminate your path forward.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
