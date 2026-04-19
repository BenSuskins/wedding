import { ContentBlockPage } from "@/components/content-block-page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function TravelPage() {
  return <ContentBlockPage blockKey="travel" />;
}
