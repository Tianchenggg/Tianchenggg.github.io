import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tianchenggg.github.io"),
  title: "Tiancheng He — AI Scientist",
  description:
    "Tiancheng He researches LLM creativity, post-training, and interpretability, with a focus on solving real-world problems and improving people’s lives.",
  keywords: [
    "Tiancheng He",
    "何天成",
    "AI scientist",
    "人工智能科学家",
    "LLM creativity",
    "大模型创造力",
    "post-training",
    "后训练",
    "interpretability",
    "可解释性",
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
      "LLM creativity, post-training, interpretability, and research that improves people’s lives.",
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
      "LLM creativity, post-training, interpretability, and research that improves people’s lives.",
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
