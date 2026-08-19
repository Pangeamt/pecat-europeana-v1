import ProjectDetail from "../../../../components/Projects/detail";

const ProjectPage = async ({ params }) => {
  const { id } = await params;
  return <ProjectDetail key={id} projectId={id} />;
};

export default ProjectPage;
