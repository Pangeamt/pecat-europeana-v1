import axios from "axios";

const TM_HOST = process.env.NEXT_PUBLIC_TM_HOST;

const addTMRequest = async (tm) => {
    try {
      const response = await axios.post(`${TM_HOST}/tm`, tm);
      return response.data;
    } catch (error) {
      console.error("Error adding TM:", error.response?.data || error.message);
      throw error; // Relanzamos el error para que el código que lo llame pueda manejarlo
    }
  };

const fetchTMRequest = async (user) => {
    try {
        const response = await axios.get(`${TM_HOST}/tm`, { params: { user } });
        return response.data;
    } catch (error) {
        console.error("Error fetching TM:", error.response?.data || error.message);
        throw error; // Relanzamos el error para que pueda manejarse donde se llame
    }
};

const updateTMRequest = async (tm) => {
    try {
      const response = await axios.patch(`${TM_HOST}/tm`, tm);
      return response.data;
    } catch (error) {
      console.error("Error updating TM:", error.response?.data || error.message);
      throw error; // Relanzamos el error para que pueda manejarse donde se llame
    }
  };

const deleteTMRequest = async (tmId) => {
    try {
      const response = await axios.delete(`${TM_HOST}/tm/${tmId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting TM:", error.response?.data || error.message);
      throw error; // Relanzamos el error para que pueda manejarse donde se llame
    }
  };

const getLogsRequest = async (projectId, tmId) => {
    try {
        const response = await axios.get(`/api/projects/logs`, { params: { projectId, tmId } });
        return response.data;
    } catch (error) {
        console.error("Error getting logs:", error.response?.data || error.message);
        throw error; // Relanzamos el error para que pueda manejarse donde se llame
    }
};

export { addTMRequest, fetchTMRequest, updateTMRequest, deleteTMRequest, getLogsRequest };