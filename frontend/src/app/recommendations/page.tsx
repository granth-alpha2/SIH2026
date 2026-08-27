import UnavailableFeature from "../components/UnavailableFeature";

export default function RecommendationsPage() {
  return <UnavailableFeature eyebrow="RECOMMENDATIONS" title="Recommendations" description="Ranked crop recommendations will appear here after farm preferences and data services are connected." action={{ label: "Set up a farm", href: "/farms/new" }} />;
}