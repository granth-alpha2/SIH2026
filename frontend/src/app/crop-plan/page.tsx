import UnavailableFeature from "../components/UnavailableFeature";

export default function CropPlanPage() {
  return <UnavailableFeature eyebrow="CROP PLAN" title="Crop plan" description="Review an accepted plan and its lifecycle milestones." action={{ label: "Set up a farm", href: "/farms/new" }} />;
}