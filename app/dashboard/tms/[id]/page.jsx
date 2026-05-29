import TMView from "@/components/TM/view";

export default async function TmDetailPage({ params }) {
  const { id } = await params;

  return <TMView key={id} tmId={id} />;
}
