import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Ghost Protocol - Real-Time AI Negotiation Wingman",
  description: "Never freeze in a negotiation again. Ghost whispers real-time coaching cues during sales calls, interviews, and high-stakes conversations. Undetectable. Sub-500ms latency.",
  keywords: "AI negotiation, sales coaching, interview prep, real-time AI, negotiation assistant",
  openGraph: {
    title: "Ghost Protocol - Real-Time AI Negotiation Wingman",
    description: "Never freeze in a negotiation again. Real-time coaching cues for sales, interviews, and negotiations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
