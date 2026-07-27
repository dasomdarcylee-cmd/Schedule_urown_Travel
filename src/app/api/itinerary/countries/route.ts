import { getCloudflareContext } from "@opennextjs/cloudflare";
import { updateCountryLabel } from "@/lib/sheets/itinerary";

interface PatchBody {
  oldRaw: string;
  newRaw: string;
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as PatchBody;
  if (!body.oldRaw || !body.newRaw?.trim()) {
    return Response.json({ error: "국가 이름을 입력해주세요" }, { status: 400 });
  }

  try {
    const { env } = getCloudflareContext();
    await updateCountryLabel(env, body.oldRaw, body.newRaw.trim());
    return Response.json({ ok: true });
  } catch (e) {
    console.error("국가 헤더 업데이트 실패:", e instanceof Error ? e.message : e);
    return Response.json({ error: "구글시트 업데이트 실패" }, { status: 502 });
  }
}
