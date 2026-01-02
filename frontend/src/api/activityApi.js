import axiosInstance from "./axiosInstance";

const activityApi = {
  createActivity: async (payload) => {
    try {
      const response = await axiosInstance.post(
        "activities/create-activity",
        payload,
        { timeout: 60000 }
      );
      return response.data;
    } catch (error) {
      const serverData = error?.response?.data;
      const message =
        serverData?.message ||
        (error?.code === "ECONNABORTED"
          ? "Request timed out. Please try again."
          : error?.message) ||
        "Failed to create activity";

      const err = new Error(message);
      err.data = serverData;
      throw err;
    }
  },

  getActivitiesByLessonId: async (lessonId) => {
    try {
      const response = await axiosInstance.get(
        `activities/get-by-lesson/${lessonId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getActivityById: async (activityId) => {
    try {
      const response = await axiosInstance.get(`activities/get/${activityId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  submitAttempt: async (activityId, payload) => {
    try {
      const response = await axiosInstance.post(
        `activities/submit-attempt/${activityId}`,
        payload
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  explainMistakes: async (activityId, attemptId) => {
    try {
      const response = await axiosInstance.post(
        `activities/explain-mistakes/${activityId}/${attemptId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default activityApi;
export const {
  createActivity,
  getActivitiesByLessonId,
  getActivityById,
  submitAttempt,
  explainMistakes,
} = activityApi;
