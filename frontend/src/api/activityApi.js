import axiosInstance from "./axiosInstance";

const activityApi = {
  createActivity: async (payload) => {
    try {
      const response = await axiosInstance.post(
        "activities/create-activity",
        payload
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
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
};

export default activityApi;
export const { createActivity, getActivitiesByLessonId } = activityApi;
