// 구글 드라이브의 "링크 복사" 공유 링크는 뷰어 페이지(HTML)라서 <img>에 그대로 쓰면
// 깨진 이미지로 뜬다. 흔한 공유 링크 형태를 감지해서 이미지 데이터를 직접 반환하는
// "직접 보기" 링크로 바꿔준다. 드라이브 링크가 아니거나 이미 직접 보기 형식이면 그대로 둔다.
const DRIVE_FILE_RE = /^https?:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
const DRIVE_OPEN_RE = /^https?:\/\/drive\.google\.com\/open\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/;

export function normalizeImageUrl(raw: string): string {
  const url = raw.trim();
  const match = url.match(DRIVE_FILE_RE) ?? url.match(DRIVE_OPEN_RE);
  if (!match) return url;
  return `https://drive.google.com/uc?export=view&id=${match[1]}`;
}
