"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

// 카메라로 QR을 스캔해서 티켓 코드를 뽑아냅니다. 카메라 권한이 없거나 실패하면
// 조용히 멈추고, 화면에서는 항상 코드 직접입력을 함께 제공해 대체 수단을 보장합니다.
export default function QRScanner({ onScan }: { onScan: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let stopped = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setActive(true);
        tick();
      } catch {
        setError("카메라를 사용할 수 없어요. 아래 코드 직접입력을 이용해주세요.");
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || stopped) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const result = jsQR(imageData.data, imageData.width, imageData.height);
          if (result?.data) {
            const match = result.data.match(/\/t\/([A-Za-z0-9]{4,8})/);
            const code = match ? match[1] : result.data;
            onScan(code.toUpperCase());
            return; // 스캔 성공 시 루프 종료
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden bg-navy relative" style={{ aspectRatio: "1/1" }}>
      <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />
      {active && (
        <div className="absolute inset-6 border-4 border-white/70 rounded-2xl pointer-events-none" />
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-white text-sm bg-navy/90">
          {error}
        </div>
      )}
    </div>
  );
}
