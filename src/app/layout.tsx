import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Anchovy | 멸치 탈출 프로젝트",
  description: "53kg에서 60kg으로! 마른 체질 전용 벌크업 매니저. 먹는 것까지가 운동이다.",
  keywords: ["벌크업", "운동", "헬스", "식단", "체중 증가", "하드게이너"],
  authors: [{ name: "Project Anchovy" }],
  creator: "Project Anchovy",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "멸치 탈출",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Project Anchovy | 멸치 탈출 프로젝트",
    description: "53kg에서 60kg으로! 마른 체질 전용 벌크업 매니저",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
    { media: "(prefers-color-scheme: light)", color: "#0a0a0f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased no-select">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
