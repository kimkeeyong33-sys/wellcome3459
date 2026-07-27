import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "deal-images";
const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 15초 영상은 대체로 이 안에 들어옵니다

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  const video = formData.get("video") as File | null;

  if (!files.length && !video) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  if (!supabaseUrl || !serviceKey) {
    // 데모 모드: 실제 저장 없이 빈 값 반환 (화면에서는 로컬 미리보기만 보임)
    return NextResponse.json({ urls: [], videoUrl: null, demo: true });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);
  const urls: string[] = [];

  for (const file of files.slice(0, 4)) {
    // 매물당 최대 4장으로 제한
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

    if (!error) {
      const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
      urls.push(data.publicUrl);
    }
  }

  let videoUrl: string | null = null;
  if (video && video.size <= MAX_VIDEO_BYTES) {
    const ext = video.name.split(".").pop() || "webm";
    const path = `video-${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await video.arrayBuffer();

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, { contentType: video.type || "video/webm", upsert: false });

    if (!error) {
      const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
      videoUrl = data.publicUrl;
    }
  }

  return NextResponse.json({ urls, videoUrl });
}
