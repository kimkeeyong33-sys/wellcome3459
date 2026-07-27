import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// 배포 전 .env.local에 실제 Supabase 프로젝트 값을 채워주세요.
// (없을 때는 화면이 목업 데이터로 대체 렌더링됩니다 — lib/mockData.ts 참고)
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
