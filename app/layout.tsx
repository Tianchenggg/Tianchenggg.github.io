import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tianchenggg.github.io"),
  title: "Tiancheng He — AI Researcher",
  description:
    "Tiancheng He researches LLM safety and agent creativity, guided by the belief that real innovation should solve real problems.",
  keywords: [
    "Tiancheng He",
    "AI researcher",
    "LLM safety",
    "agent creativity",
    "HUST",
    "BUPT",
  ],
  authors: [{ name: "Tiancheng He", url: "https://github.com/Tianchenggg" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "Tiancheng He — AI Researcher",
    description:
      "LLM safety, agent creativity, and research that solves real problems.",
    siteName: "Tiancheng He",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Tiancheng He — AI Researcher",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tiancheng He — AI Researcher",
    description:
      "LLM safety, agent creativity, and research that solves real problems.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/avatar.png",
    apple: "/avatar.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3f6fa",
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
