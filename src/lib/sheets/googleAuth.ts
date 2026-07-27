import { SignJWT, importPKCS8 } from "jose";

// 구글 서비스 계정 JWT-Bearer 플로우로 액세스 토큰을 발급받고 Workers KV에 캐싱한다.
// trading-log-viewer(trackingstocktransaction)의 토큰 캐싱 구조를 그대로 따른다.
// googleapis 대신 jose를 쓰는 이유는 Web Crypto 기반이라 Cloudflare Workers(V8 isolate)에서
// 바로 동작하기 때문 (Node 전용 내부 의존성 없음).
// 이 앱은 웹에서 시트로 쓰기도 해야 하므로 readonly가 아닌 전체 spreadsheets 스코프를 쓴다.

interface GoogleTokenCacheEntry {
  accessToken: string;
  expiresAt: number; // Unix ms
}

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_KV_KEY = "google-sheets-oauth-token";
const TOKEN_SAFETY_MARGIN_MS = 5 * 60_000;

function parseServiceAccount(env: CloudflareEnv): ServiceAccountKey {
  const json = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON) as Partial<ServiceAccountKey>;
  if (!json.client_email || !json.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON에 client_email/private_key가 없습니다");
  }
  return { client_email: json.client_email, private_key: json.private_key };
}

async function buildAssertion(env: CloudflareEnv): Promise<string> {
  const { client_email, private_key } = parseServiceAccount(env);
  const privateKey = await importPKCS8(private_key, "RS256");

  return new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(client_email)
    .setAudience(TOKEN_URL)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);
}

async function exchangeAssertion(assertion: string): Promise<GoogleTokenCacheEntry> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`구글 OAuth 토큰 발급 HTTP ${res.status}`);

  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("구글 OAuth 토큰 응답에 access_token 없음");

  return {
    accessToken: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
}

async function bootstrap(env: CloudflareEnv): Promise<GoogleTokenCacheEntry> {
  const assertion = await buildAssertion(env);
  return exchangeAssertion(assertion);
}

export async function getGoogleAccessToken(env: CloudflareEnv, forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    try {
      const raw = await env.TOKEN_KV.get(TOKEN_KV_KEY);
      if (raw) {
        const entry = JSON.parse(raw) as GoogleTokenCacheEntry;
        if (
          typeof entry.accessToken === "string" &&
          typeof entry.expiresAt === "number" &&
          Date.now() < entry.expiresAt - TOKEN_SAFETY_MARGIN_MS
        ) {
          return entry.accessToken;
        }
      }
    } catch {
      // KV 읽기/파싱 실패 — 그냥 새로 발급받는다 (여기서 절대 throw 하지 않음)
    }
  }

  const entry = await bootstrap(env);
  try {
    await env.TOKEN_KV.put(TOKEN_KV_KEY, JSON.stringify(entry));
  } catch {
    // 쓰기 실패해도 이번 요청은 방금 받은 토큰으로 정상 처리 가능 — 무시
  }
  return entry.accessToken;
}
