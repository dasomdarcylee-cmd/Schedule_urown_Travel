import { getCloudflareContext } from "@opennextjs/cloudflare";
import { updateDaySolo } from "@/lib/sheets/itinerary";

interface PatchBody {
  solo: boolean;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ dayIndex: string }> }) {
  const { dayIndex: dayIndexRaw } = await params;
  const dayIndex = Number.parseInt(dayIndexRaw, 10);
  if (!Number.isFinite(dayIndex)) {
    return Response.json({ error: "잘못된 dayIndex" }, { status: 400 });
  }

  const body = (await req.json()) as PatchBody;

  try {
    const { env } = getCloudflareContext();
    await updateDaySolo(env, dayIndex, body.solo);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("날짜 이동 표시 업데이트 실패:", e instanceof Error ? e.message : e);
    return Response.json({ error: "구글시트 업데이트 실패" }, { status: 502 });
  }
}
