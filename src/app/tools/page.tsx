import { redirect } from "next/navigation";

// /tools는 /logistics(점핑로지스)로 통합되었습니다. 이전 링크 호환을 위해 리다이렉트만 유지합니다.
export default function ToolsRedirect() {
  redirect("/logistics");
}
