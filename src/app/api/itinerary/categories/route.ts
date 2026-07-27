import { getCloudflareContext } from "@opennextjs/cloudflare";
import { setCategoryColor } from "@/lib/sheets/categoryColors";
import { recolorCategory } from "@/lib/sheets/itinerary";
import type { TaskCategory } from "@/lib/itinerary/types";

interface PatchBody {
  category: TaskCategory;
  color: string;
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as PatchBody;
  if (!body.category || !/^#[0-9a-fA-F]{6}$/.test(body.color)) {
    return Response.json({ error: "잘못된 요청" }, { status: 400 });
  }

  try {
    const { env } = getCloudflareContext();
    const categoryColors = await setCategoryColor(env, body.category, body.color);
    await recolorCategory(env, body.category, body.color);
    return Response.json({ ok: true, categoryColors });
  } catch (e) {
    console.error("카테고리 색상 업데이트 실패:", e instanceof Error ? e.message : e);
    return Response.json({ error: "구글시트 업데이트 실패" }, { status: 502 });
  }
}
