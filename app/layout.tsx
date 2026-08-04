import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tianchenggg.github.io"),
  title: "Tiancheng He — AI Researcher",
  description:
    "Tiancheng He researches multimodal safety, LLM reasoning, on-device intelligence, and AI for science.",
  keywords: [
    "Tiancheng He",
    "AI researcher",
    "multimodal safety",
    "LLM reasoning",
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
      "Multimodal safety, LLM reasoning, on-device intelligence, and AI for science.",
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
      "Multimodal safety, LLM reasoning, on-device intelligence, and AI for science.",
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
  themeColor: "#07111f",
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
