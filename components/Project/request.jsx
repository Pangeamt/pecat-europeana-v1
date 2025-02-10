import axios from "axios";

const saveProject = async (newProject) => {
    return await axios({
        method: "patch",
        url: "/api/projects",
        data: newProject,
    });
};
const removeProject = async (projectId) => {
    return await axios({
        method: "delete",
        url: `/api/projects`,
        data: { projectId },
    });
};

const addProject = async (newProject) => { 
    let METHOD = newProject.url ? "put" : "post";

    return await axios({
        method: METHOD,
        url: "/api/projects",
        data: newProject,
    });
};

const getProjects = async () => {
    return await axios({
        method: "get",
        url: "/api/projects",
    });
};

export { saveProject, removeProject, addProject, getProjects };