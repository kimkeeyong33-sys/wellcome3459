import { formatPrice } from "@/lib/format";

type Product = { id: string; name: string; price: number };

export default function StoreInfoCard({
  address,
  businessHours,
  publicPhone,
  products,
}: {
  address: string | null;
  businessHours: string | null;
  publicPhone: string | null;
  products: Product[];
}) {
  const hasContact = address || businessHours || publicPhone;
  const hasMenu = products.length > 0;
  if (!hasContact && !hasMenu) return null;

  return (
    <div className="w-full flex flex-col gap-3">
      {hasContact && (
        <div className="rounded-2xl border-2 border-gray200 px-4 py-4 flex flex-col gap-2.5">
          {address && (
            <div className="flex items-start gap-2">
              <span className="text-base flex-shrink-0">📍</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray900">{address}</div>
                <a
                  href={`https://map.kakao.com/?q=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-orange underline"
                >
                  지도에서 보기
                </a>
              </div>
            </div>
          )}
          {businessHours && (
            <div className="flex items-center gap-2">
              <span className="text-base flex-shrink-0">🕐</span>
              <div className="text-sm text-gray900">{businessHours}</div>
            </div>
          )}
          {publicPhone && (
            <div className="flex items-center gap-2">
              <span className="text-base flex-shrink-0">📞</span>
              <a href={`tel:${publicPhone}`} className="text-sm text-gray900 underline">
                {publicPhone}
              </a>
            </div>
          )}
        </div>
      )}

      {hasMenu && (
        <div className="rounded-2xl border-2 border-gray200 px-4 py-4">
          <div className="text-sm font-bold text-navy mb-2.5">메뉴 · 가격</div>
          <div className="flex flex-col gap-1.5">
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <div className="text-gray900">{p.name}</div>
                <div className="font-bold text-navy">{formatPrice(p.price)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
