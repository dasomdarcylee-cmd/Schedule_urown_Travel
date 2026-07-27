import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ItineraryDeck } from "@/components/ItineraryDeck";
import { tripFixture } from "@/lib/itinerary/fixture";
import { fetchItinerary } from "@/lib/sheets/itinerary";

// 빌드 시점에 정적으로 굽지 않고 매 요청마다 최신 시트 데이터를 가져오도록 강제
export const dynamic = "force-dynamic";

export default async function Home() {
  const { env } = getCloudflareContext();
  const itinerary = await fetchItinerary(env).catch((e) => {
    console.error("초기 구글시트 조회 실패, fixture로 대체:", e instanceof Error ? e.message : e);
    return tripFixture;
  });
  return <ItineraryDeck itinerary={itinerary} />;
}
