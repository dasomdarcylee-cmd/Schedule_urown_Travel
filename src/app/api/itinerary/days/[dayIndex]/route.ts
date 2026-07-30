import { getCloudflareContext } from "@opennextjs/cloudflare";
import { updateDaySolo, setDayMovingCountry } from "@/lib/sheets/itinerary";

interface PatchBody {
  solo?: boolean;
  movingCountry?: string | null;
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
    if (typeof body.solo === "boolean") {
      await updateDaySolo(env, dayIndex, body.solo);
    }
    if ("movingCountry" in body) {
      await setDayMovingCountry(env, dayIndex, body.movingCountry ?? null);
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error("날짜 국가 업데이트 실패:", e instanceof Error ? e.message : e);
    return Response.json({ error: "구글시트 업데이트 실패" }, { status: 502 });
  }
}
