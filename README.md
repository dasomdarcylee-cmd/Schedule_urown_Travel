# 여행 일정 (Travel Schedule PWA)

Google Sheets("Travel Schedule")와 양방향으로 동기화되는 여행 일정 PWA. 요일별 카드를 스와이프해서
넘기며, 각 카드는 오전 4시~오후 9시를 30분 단위 세로 그리드로 보여준다. 일정은 색상으로 구분된다
(빨강=교통편, 파랑=여행 투어, 초록=식사/숙소).

## 개발

```bash
npm install
npm run dev
```

## 구글시트 연동 설정

1. Google Cloud Console에서 새 프로젝트를 만들고 **Google Sheets API**를 활성화한다.
2. 해당 프로젝트에 서비스 계정을 만들고 JSON 키를 다운로드한다.
3. "Travel Schedule" 시트를 그 서비스 계정의 `client_email`에 **편집자(Editor)** 권한으로 공유한다.
4. `.dev.vars.example`을 `.dev.vars`로 복사하고 `GOOGLE_SERVICE_ACCOUNT_JSON`(다운로드한 JSON 전체를
   한 줄로), `GOOGLE_SHEET_ID`를 채운다.

## 배포 (Cloudflare Workers)

```bash
wrangler kv namespace create TOKEN_KV   # 반환된 id를 wrangler.jsonc에 반영
wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON
wrangler secret put GOOGLE_SHEET_ID
npm run deploy
```
