import GlossaryView from "@/components/Glossary/view";

export default async function GlossaryDetailPage({ params }) {
  const { id } = await params;

  return <GlossaryView key={id} glossaryId={id} />;
}
