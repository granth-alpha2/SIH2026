import UnavailableFeature from "../components/UnavailableFeature";

export default function WeatherPage() {
  return <UnavailableFeature eyebrow="WEATHER" title="Weather outlook" description="A farm location and weather provider are required before showing a forecast." action={{ label: "Set up a farm", href: "/farms/new" }} />;
}