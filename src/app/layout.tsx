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
  metadataBase: new URL("https://ironcore.lat"),
  title: {
    default: "IronCore",
    template: "%s | IronCore",
  },
  description: "Diagnóstico, decisão e execução para caixa, margem e eficiência operacional.",
  icons: {
    icon: "/icon.jpg",
    shortcut: "/icon.jpg",
    apple: "/apple-touch-icon.jpg",
  },
  openGraph: {
    title: "IronCore",
    description: "Diagnóstico, decisão e execução para caixa, margem e eficiência operacional.",
    images: ["/brand/ironcore-mark-official.jpg"],
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
