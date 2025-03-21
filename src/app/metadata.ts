import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YouTube AI Summarizer",
  description: "Get AI-powered insights from any YouTube video",
  manifest: "/manifest.json",
  themeColor: "#FF3737",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "YouTube AI Summarizer",
  },
  formatDetection: {
    telephone: false,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};
