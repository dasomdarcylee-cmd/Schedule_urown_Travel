import { getCloudflareContext } from "@opennextjs/cloudflare";
import { updateTask } from "@/lib/sheets/itinerary";
import type { TaskCategory } from "@/lib/itinerary/types";

interface PatchBody {
  originalEndSlot: number;
  startSlot: number;
  endSlot: number;
  text: string;
  cost: number | null;
  category: TaskCategory;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const [dayIndexRaw, originalStartSlotRaw] = taskId.split(":");
  const dayIndex = Number.parseInt(dayIndexRaw, 10);
  const originalStartSlot = Number.parseInt(originalStartSlotRaw, 10);
  if (!Number.isFinite(dayIndex) || !Number.isFinite(originalStartSlot)) {
    return Response.json({ error: "잘못된 taskId" }, { status: 400 });
  }

  const body = (await req.json()) as PatchBody;

  try {
    const { env } = getCloudflareContext();
    await updateTask(env, {
      dayIndex,
      originalStartSlot,
      originalEndSlot: body.originalEndSlot,
      startSlot: body.startSlot,
      endSlot: body.endSlot,
      text: body.text,
      cost: body.cost,
      category: body.category,
    });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("구글시트 업데이트 실패:", e instanceof Error ? e.message : e);
    return Response.json({ error: "구글시트 업데이트 실패" }, { status: 502 });
  }
}
