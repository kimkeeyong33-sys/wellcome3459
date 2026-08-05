import type { Metadata, Viewport } from "next";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cashticket.vercel.app";
const DEFAULT_DESCRIPTION =
  "카카오톡을 쓸 줄 알면 누구나 5분 만에 시작하는 우리 매장 금액권. 발행하고, 전달하고, 매장에서 바로 결제 확인까지 캐시티켓 하나로 끝냅니다.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "캐시티켓 - 우리 매장 금액권",
    template: "%s | 캐시티켓",
  },
  description: DEFAULT_DESCRIPTION,
  keywords: ["캐시티켓", "선불카드", "상품권", "소상공인", "금액권", "선결제", "카카오톡 상품권", "매장 멤버십"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "캐시티켓",
  },
  icons: {
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "캐시티켓 - 우리 매장 금액권",
    description: DEFAULT_DESCRIPTION,
    url: BASE_URL,
    siteName: "캐시티켓",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "캐시티켓 - 우리 매장 금액권",
    description: DEFAULT_DESCRIPTION,
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
