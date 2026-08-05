"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// 티켓 코드를 담은 URL을 QR 이미지로 그려줍니다 (오프라인 생성, 외부 API 호출 없음).
export default function TicketQR({ url, size = 220 }: { url: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      color: { dark: "#0B2540", light: "#FFFFFF" },
    }).then((d) => {
      if (!cancelled) setDataUrl(d);
    });
    return () => {
      cancelled = true;
    };
  }, [url, size]);

  return (
    <div
      className="flex items-center justify-center bg-white rounded-2xl border-2 border-gray200"
      style={{ width: size + 24, height: size + 24 }}
    >
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt="티켓 QR코드" width={size} height={size} />
      ) : (
        <div className="text-gray500 text-sm">QR 생성 중...</div>
      )}
    </div>
  );
}
