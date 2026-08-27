import UnavailableFeature from "../components/UnavailableFeature";

export default function FarmsPage() {
  return <UnavailableFeature eyebrow="FARMS" title="My farms" description="Manage your saved farm boundaries and preferences." action={{ label: "Add a farm", href: "/farms/new" }} />;
}