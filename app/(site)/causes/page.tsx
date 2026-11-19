import SectionIndex, { indexMetadata } from "@/components/SectionIndex";

export const dynamic = "force-dynamic";

export const generateMetadata = () => indexMetadata("causes");

export default function Page() {
  return <SectionIndex kind="causes" />;
}
