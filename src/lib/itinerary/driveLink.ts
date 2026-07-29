// 구글 드라이브의 "링크 복사" 공유 링크는 뷰어 페이지(HTML)라서 <img>에 그대로 쓰면
// 깨진 이미지로 뜬다. 흔한 공유 링크 형태를 감지해서 lh3.googleusercontent.com(구글이
// 자체적으로 드라이브 미리보기에 쓰는 이미지 서빙 주소)으로 바꿔준다. drive.google.com/uc
// 방식은 한때 이 용도로 흔히 쓰였지만 구글이 핫링크를 점점 차단하고 있어 더 이상 안정적이지
// 않다 — 예전에 저장된 uc?export=view 링크도 다시 읽을 때 자동으로 lh3 형식으로 바뀐다.
const DRIVE_FILE_RE = /^https?:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
const DRIVE_OPEN_RE = /^https?:\/\/drive\.google\.com\/open\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/;
const DRIVE_UC_RE = /^https?:\/\/drive\.google\.com\/uc\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/;
const LH3_RE = /^https?:\/\/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/;

export function normalizeImageUrl(raw: string): string {
  const url = raw.trim();
  if (LH3_RE.test(url)) return url;
  const match = url.match(DRIVE_FILE_RE) ?? url.match(DRIVE_OPEN_RE) ?? url.match(DRIVE_UC_RE);
  if (!match) return url;
  return `https://lh3.googleusercontent.com/d/${match[1]}`;
}
