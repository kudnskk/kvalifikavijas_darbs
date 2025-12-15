import axiosInstance from "./axiosInstance";

// Message API endpoints
const messageApi = {
  // Get all messages for a lesson
  getMessagesByLessonId: async (lessonId) => {
    try {
      const response = await axiosInstance.get(
        `messages/get-all-messages-and-activities/${lessonId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Send a new message
  createMessage: async (messageData) => {
    try {
      const response = await axiosInstance.post(
        "messages/create-message",
        messageData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default messageApi;

// Also export individual functions for named imports
export const { getMessagesByLessonId, createMessage } = messageApi;
