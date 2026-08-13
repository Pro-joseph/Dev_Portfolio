import type { Metadata } from "next";
import { Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "JosephLab | Youssef Jdira — Systems Architect",
    template: "%s | JosephLab",
  },
  description:
    "Full-stack developer with extensive experience in backend systems, databases, and software architecture. Building scalable, secure, and efficient solutions.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${hanken.variable} antialiased`}>
      <body className="min-h-screen bg-surface font-sans text-primary overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
