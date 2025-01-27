import axios from "axios";

const confirmTu = async (data) => {
    return await axios({
      method: "post",
      url: "/api/tus",
      data: data,
    });
  };
  
  const confirmTuTm = async (data) => {
    return await axios({
      method: "post",
      url: `${process.env.NEXT_PUBLIC_TM_HOST}/tu`,
      data: data,
    });
  };
  
  const updateTuTm = async (data) => {
    return await axios({
      method: "patch",
      url: `${process.env.NEXT_PUBLIC_TM_HOST}/tu`,
      data: data,
    });
  };
  
  const getTus = async (projectId) => {
    return await axios({
      method: "get",
      url: "/api/tus",
      params: { projectId },
    });
  };

  export { confirmTu, confirmTuTm, updateTuTm, getTus };