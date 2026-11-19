import SectionIndex, { indexMetadata } from "@/components/SectionIndex";

export const dynamic = "force-dynamic";

export const generateMetadata = () => indexMetadata("books");

export default function Page() {
  return <SectionIndex kind="books" />;
}
