import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tianchenggg.github.io"),
  title: "Tiancheng He — AI Scientist",
  description:
    "Tiancheng He researches LLM safety and agent creativity, with a focus on solving real-world problems and improving people’s lives.",
  keywords: [
    "Tiancheng He",
    "何天成",
    "AI scientist",
    "人工智能科学家",
    "LLM safety",
    "大语言模型安全",
    "agent creativity",
    "智能体创造力",
    "HUST",
    "BUPT",
  ],
  authors: [{ name: "Tiancheng He (何天成)", url: "https://github.com/Tianchenggg" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "Tiancheng He — AI Scientist",
    description:
      "LLM safety, agent creativity, and research that solves real-world problems and improves people’s lives.",
    siteName: "Tiancheng He",
    images: [
      {
        url: "/og-scientist.png",
        width: 1200,
        height: 630,
        alt: "Tiancheng He — AI Scientist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tiancheng He — AI Scientist",
    description:
      "LLM safety, agent creativity, and research that solves real-world problems and improves people’s lives.",
    images: ["/og-scientist.png"],
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
