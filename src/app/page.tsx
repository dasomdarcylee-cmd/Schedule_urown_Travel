import { ItineraryDeck } from "@/components/ItineraryDeck";
import { tripFixture } from "@/lib/itinerary/fixture";

export default function Home() {
  // TODO(6단계): 서비스 계정 키 연동 후 fetchItinerary()로 교체
  return <ItineraryDeck itinerary={tripFixture} />;
}
