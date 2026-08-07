import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chat with AI Vaibhav",
  description: "Vaibhav's personal AI chatbot — ask me anything, I talk just like the real one. Built by vaibecoded.",
  openGraph: {
    title: "Chat with AI Vaibhav",
    description: "Vaibhav's personal AI chatbot — ask me anything, I talk just like the real one.",
    url: "https://chat.vaibbhubb.in",
    siteName: "AI Vaibhav",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Chat with AI Vaibhav",
    description: "Vaibhav's personal AI chatbot — ask me anything, I talk just like the real one.",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};
