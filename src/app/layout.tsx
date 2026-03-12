import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IronCore",
  description: "Plataforma operacional financeira do IronCore",
  icons: {
    icon: "/brand/ironcore-logo.jpg",
    shortcut: "/brand/ironcore-logo.jpg",
    apple: "/brand/ironcore-logo.jpg",
  },
  openGraph: {
    title: "IronCore",
    description: "Plataforma operacional financeira do IronCore",
    images: ["/brand/ironcore-logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
