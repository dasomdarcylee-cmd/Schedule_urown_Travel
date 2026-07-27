import { getCloudflareContext } from "@opennextjs/cloudflare";
import { fetchItinerary } from "@/lib/sheets/itinerary";

export async function GET() {
  try {
    const { env } = getCloudflareContext();
    const itinerary = await fetchItinerary(env);
    return Response.json(itinerary);
  } catch (e) {
    console.error("구글시트 조회 실패:", e instanceof Error ? e.message : e);
    return Response.json({ error: "구글시트 조회 실패" }, { status: 502 });
  }
}
