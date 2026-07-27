import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "덤핑점핑 · Powered by JumpingBid",
  description: "B2B 덤핑 재고 정보를 가장 빠르게 알려드립니다. (JumpingBid AI 거래 플랫폼)",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "덤핑점핑",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B2540",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="font-sans overflow-x-hidden">
        <div className="mx-auto max-w-md min-h-screen bg-white shadow-sm overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
