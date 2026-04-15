import { httpClient } from "./http-client";

export const saveProject = async (newProject) => {
  return await httpClient({
    method: "patch",
    url: "/api/projects",
    data: newProject,
  });
};

export const removeProject = async (projectId) => {
  return await httpClient({
    method: "delete",
    url: "/api/projects",
    data: { projectId },
  });
};

export const addProject = async (newProject) => {
  const method = newProject.url ? "put" : "post";

  return await httpClient({
    method,
    url: "/api/projects",
    data: newProject,
  });
};

export const getProjects = async () => {
  return await httpClient({
    method: "get",
    url: "/api/projects",
  });
};

export const getProjectShareLink = async (projectId, baseURL) => {
  const { data } = await httpClient.get(`${baseURL}/api/file/${projectId}`);
  return `${baseURL}/api/file?uuid=${data.uuid}&projectId=${projectId}`;
};

