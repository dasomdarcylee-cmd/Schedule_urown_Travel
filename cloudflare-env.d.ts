// 임시 수동 선언. `npm run cf-typegen` (= wrangler types) 실행 후 자동 생성본으로 교체됨.
interface CloudflareEnv {
  ASSETS: Fetcher;
  TOKEN_KV: KVNamespace;
  GOOGLE_SERVICE_ACCOUNT_JSON: string;
  GOOGLE_SHEET_ID: string;
}
