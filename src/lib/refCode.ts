// 추천 링크용 짧은 코드 생성 — 헷갈리기 쉬운 0/O, 1/I/L은 제외
const CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateRefCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}
