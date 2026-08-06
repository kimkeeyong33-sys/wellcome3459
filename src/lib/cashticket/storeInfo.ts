import type { SupabaseClient } from "@supabase/supabase-js";
import { demoGetStore, demoListProducts } from "./demoStore";

export type PublicStoreInfo = {
  verified: boolean;
  address: string | null;
  businessHours: string | null;
  publicPhone: string | null;
  products: { id: string; name: string; price: number }[];
};

export function getPublicStoreInfoDemo(storeId: string): PublicStoreInfo {
  const store = demoGetStore(storeId);
  const products = demoListProducts(storeId);
  return {
    verified: store?.businessVerified ?? false,
    address: store?.address || null,
    businessHours: store?.businessHours || null,
    publicPhone: store?.publicPhone || null,
    products: products.map((p) => ({ id: p.id, name: p.name, price: p.price })),
  };
}

export async function getPublicStoreInfoSupabase(
  supabaseAdmin: SupabaseClient,
  storeId: string
): Promise<PublicStoreInfo> {
  const [{ data: store }, { data: products }] = await Promise.all([
    supabaseAdmin
      .from("ct_stores")
      .select("business_verified, address, business_hours, public_phone")
      .eq("id", storeId)
      .maybeSingle(),
    supabaseAdmin
      .from("ct_products")
      .select("id, name, price")
      .eq("store_id", storeId)
      .order("sort_order", { ascending: true }),
  ]);

  return {
    verified: store?.business_verified ?? false,
    address: store?.address || null,
    businessHours: store?.business_hours || null,
    publicPhone: store?.public_phone || null,
    products: (products ?? []).map((p) => ({ id: p.id, name: p.name, price: Number(p.price) })),
  };
}
